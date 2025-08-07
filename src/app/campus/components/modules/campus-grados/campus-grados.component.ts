import { Component, OnInit } from '@angular/core';
import { CardComponent } from '../../shared/card/card.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProfesorCurso } from '../../../interface/ProfesorCurso';
import { lastValueFrom } from 'rxjs';
import { ProfesorCursoService } from '../../../services/profesor-curso.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { CommonModule, SlicePipe } from '@angular/common';

import { GeneralLoadingSpinnerComponent } from '../../../../general/components/spinner/spinner.component';
import { PaginationComponent } from '../../../../general/components/pagination/pagination.component';


@Component({
  selector: 'app-campus-grados',
  standalone: true,
  imports: [
  RouterModule,
  CardComponent,
  CommonModule,
  PaginationComponent,
  GeneralLoadingSpinnerComponent,
  SlicePipe, // Add SlicePipe
],
  templateUrl: './campus-grados.component.html',
  styleUrl: './campus-grados.component.scss',
})
export class CampusGradosComponent implements OnInit {
  nivel: string = '';
  grados: string[] = [];
  selectedGrado: string | null = null;
  profesorcursos: ProfesorCurso[] = [];
  filteredCursos: ProfesorCurso[] = [];
  page: number = 1;
  itemsPerPage: number = 4;
  totalPages: number = 1;
  isDataLoaded: boolean = false;
  profesorNombre: string = 'Profesor';
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private profesorCursoService: ProfesorCursoService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.nivel = this.route.snapshot.paramMap.get('nivel') || '';
    const usuarioId = localStorage.getItem('usuarioId');
    const storedGrado = localStorage.getItem('grado');

    if (usuarioId) {
      try {
        const rawCursos = await lastValueFrom(
          this.profesorCursoService.obtenerCursosPorProfesor(usuarioId)
        );
        console.log('Cursos obtenidos:', rawCursos);

        this.profesorcursos = rawCursos.map((item: any) => ({
          idProfesorCurso: item.idProfesorCurso || '',
          usuario: item.usuario || {},
          curso: {
            idCurso: item.curso?.idCurso || '',
            nombre: item.curso?.nombre || 'Curso sin nombre',
            abreviatura: item.curso?.abreviatura || '',
          },
          grado: item.grado || '',
          seccion: item.seccion || 'Sin sección',
          nivel: item.nivel || this.nivel,
          fechaAsignacion: item.fechaAsignacion
            ? new Date(item.fechaAsignacion)
            : undefined,
        }));

        console.log('Cursos mapeados:', this.profesorcursos);

        if (this.profesorcursos.length > 0 && this.profesorcursos[0].usuario) {
          const usuario = this.profesorcursos[0].usuario;
          this.profesorNombre = `${usuario.nombre || ''} ${
            usuario.apellidopaterno || ''
          } ${usuario.apellidomaterno || ''}`.trim() || 'Profesor';
        }
        console.log('Nombre del profesor:', this.profesorNombre);

        if (this.nivel) {
          this.grados = [
            ...new Set(
              this.profesorcursos
                .filter(
                  (curso) =>
                    curso.grado &&
                    curso.nivel?.toLowerCase() === this.nivel.toLowerCase()
                )
                .map((curso) => curso.grado + '°')
            ),
          ].sort((a, b) => parseInt(a) - parseInt(b));
        }
        console.log('Grados filtrados:', this.grados);

        this.isDataLoaded = true;

        const fromBreadcrumb =
          this.route.snapshot.queryParams['fromBreadcrumb'] === 'true';
        console.log('fromBreadcrumb:', fromBreadcrumb, 'storedGrado:', storedGrado, 'grados:', this.grados);
        if (
          fromBreadcrumb &&
          storedGrado &&
          this.grados.includes(storedGrado)
        ) {
          console.log('Preseleccionando grado:', storedGrado);
          this.selectGrado(storedGrado);
        } else {
          console.log('No se preselecciona grado. Mostrando pantalla de bienvenida.');
          this.selectedGrado = null;
          this.filteredCursos = [];
          this.updateTotalPages();
        }
      } catch (error) {
        console.error('Error al obtener los cursos:', error);
      } finally {
        this.isLoading = false;
        this.isDataLoaded = true;
      }
    } else {
      console.error('No se encontró usuarioId en localStorage');
      this.isLoading = false;
      this.isDataLoaded = true;
    }
  }

  selectGrado(grado: string): void {
    console.log('Seleccionando grado:', grado);
    this.selectedGrado = grado;
    const gradoBackend = grado.replace('°', '');
    this.filteredCursos = this.profesorcursos.filter(
      (curso) =>
        curso.grado === gradoBackend &&
        curso.curso?.idCurso &&
        curso.idProfesorCurso
    );
    this.page = 1;
    this.updateTotalPages();
    console.log('Cursos filtrados para', grado, ':', this.filteredCursos);
  }

  navigateToInicio(): void {
    console.log('Navegando a Inicio');
    this.selectedGrado = null;
    this.filteredCursos = [];
    this.page = 1;
    this.updateTotalPages();
    localStorage.removeItem('grado');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { fromBreadcrumb: false },
      queryParamsHandling: 'merge',
    });
  }

  seleccionarCurso(curso: ProfesorCurso): void {
    const grado = curso.grado ? curso.grado + '°' : '';
    const seccion = curso.seccion ?? 'Sin sección';
    const nivel = curso.nivel ?? this.nivel;
    const idCurso = curso.curso?.idCurso ?? '';
    const idProfesorCurso = curso.idProfesorCurso ?? '';
    const nombreCurso = curso.curso?.nombre ?? 'Curso sin nombre';
    const idProfesor = localStorage.getItem('usuarioId') || '';

    if (idCurso && idProfesorCurso && grado && seccion && nivel && nombreCurso && idProfesor) {
      console.log('Guardando en localStorage:', {
        grado,
        seccion,
        nivel,
        idCurso,
        idProfesorCurso,
        nombreCurso,
        idProfesor,
      });
      localStorage.setItem('grado', grado);
      localStorage.setItem('seccion', seccion);
      localStorage.setItem('nivel', nivel);
      localStorage.setItem('idCurso', idCurso);
      localStorage.setItem('idProfesorCurso', idProfesorCurso);
      localStorage.setItem('nombreCurso', nombreCurso);
      localStorage.setItem('idProfesor', idProfesor);
      this.router.navigate(['/campus-vista'], {
        queryParams: { idProfesorCurso, grado, seccion, nivel },
      });
    } else {
      console.error('Datos incompletos para el curso:', {
        idCurso,
        idProfesorCurso,
        grado,
        seccion,
        nivel,
        idProfesor,
      });
    }
  }

  // Calculate total pages based on filteredCursos and itemsPerPage
  updateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredCursos.length / this.itemsPerPage);
    if (this.page > this.totalPages && this.totalPages > 0) {
      this.page = 1;
    }
    console.log(
      `Total páginas actualizadas: ${this.totalPages}, página actual: ${this.page}`
    );
  }

  // Handle page change events from app-pagination
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      console.log(`Cambiando a página: ${page}`);
      this.page = page;
    }
  }
}