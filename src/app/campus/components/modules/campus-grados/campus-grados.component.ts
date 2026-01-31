import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CardComponent } from '../../shared/card/card.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProfesorCurso } from '../../../interface/ProfesorCurso';
import { lastValueFrom } from 'rxjs';
import { ProfesorCursoService } from '../../../services/profesor-curso.service';
import { DTOUsuarioService } from '../../../../general/Services/dtousuario.service';
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
    SlicePipe,
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

  puedeVerNotasBimestrales: boolean = false;
  usuarioPerfil: any = null;

  // Nueva propiedad: IDs de los cursos donde ES TUTOR
  gruposTutoradosIds: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private profesorCursoService: ProfesorCursoService,
    private router: Router,
    private usuarioService: DTOUsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.nivel = this.route.snapshot.paramMap.get('nivel') || '';
    const usuarioId = localStorage.getItem('usuarioId');
    const storedGrado = localStorage.getItem('grado');

    // Cargar perfil (para tutorprimaria/secundaria)
    let tutorPrimaria = '';
    let tutorSecundaria = '';

    if (usuarioId) {
      try {
        console.log('Cargando perfil para usuarioId:', usuarioId);
        const response = await lastValueFrom(this.usuarioService.getUsuario(usuarioId));
        console.log('Respuesta completa del perfil:', response);

        if (response && response.code === 200 && response.data) {
          this.usuarioPerfil = response.data;

          tutorPrimaria = typeof this.usuarioPerfil?.tutorprimaria === 'string' 
            ? this.usuarioPerfil.tutorprimaria.trim() 
            : '';
          tutorSecundaria = typeof this.usuarioPerfil?.tutorsecundaria === 'string' 
            ? this.usuarioPerfil.tutorsecundaria.trim() 
            : '';

          this.puedeVerNotasBimestrales = Boolean(tutorPrimaria || tutorSecundaria);

          console.log('Tutor Primaria:', tutorPrimaria);
          console.log('Tutor Secundaria:', tutorSecundaria);
          console.log('Puede ver Notas Bimestrales (temporal):', this.puedeVerNotasBimestrales);
        } else {
          console.warn('Respuesta inválida o sin data:', response);
          this.puedeVerNotasBimestrales = false;
        }
      } catch (error) {
        console.error('Error al cargar perfil usuario:', error);
        this.puedeVerNotasBimestrales = false;
      }
    } else {
      console.warn('No se encontró usuarioId en localStorage');
      this.puedeVerNotasBimestrales = false;
    }

    // Cargar cursos y calcular grupos tutorados
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
            competencias: []  // AÑADIR SIEMPRE
          },
          grado: item.grado || '',
          seccion: item.seccion || 'Sin sección',
          nivel: item.nivel || this.nivel,
          fechaAsignacion: item.fechaAsignacion
            ? new Date(item.fechaAsignacion)
            : undefined,
        }));

        console.log('Cursos mapeados:', this.profesorcursos);

        // FIX: Calcular grupos tutorados AQUÍ (después de tener profesorcursos)
        if (tutorPrimaria || tutorSecundaria) {
          this.gruposTutoradosIds = this.profesorcursos
            .filter(curso => {
              const grupoKey = `${curso.grado}${curso.seccion}`.toLowerCase(); // ej. "5b"
              const nivelCurso = curso.nivel?.toLowerCase();

              if (nivelCurso === 'primaria' && tutorPrimaria && grupoKey === tutorPrimaria.toLowerCase()) {
                return true;
              }
              if (nivelCurso === 'secundaria' && tutorSecundaria && grupoKey === tutorSecundaria.toLowerCase()) {
                return true;
              }
              return false;
            })
            .map(curso => curso.idProfesorCurso!)
            .filter(id => !!id);  // Eliminar null/undefined

          console.log('IDs de grupos tutorados:', this.gruposTutoradosIds);
        }

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
        this.cdr.detectChanges();
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
        queryParams: { idProfesorCourse: idProfesorCurso, grado, seccion, nivel },
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

  updateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredCursos.length / this.itemsPerPage);
    if (this.page > this.totalPages && this.totalPages > 0) {
      this.page = 1;
    }
    console.log(
      `Total páginas actualizadas: ${this.totalPages}, página actual: ${this.page}`
    );
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      console.log(`Cambiando a página: ${page}`);
      this.page = page;
    }
  }

  navigateToNotasBimestrales(): void {
    if (!this.puedeVerNotasBimestrales) {
      console.warn('Usuario no es tutor – Acceso denegado');
      return;
    }

    if (this.gruposTutoradosIds.length === 0) {
      console.warn('No se encontraron grupos tutorados válidos – Verifica que el grado/sección coincida exactamente');
      console.log('Tutor Primaria en DB:', this.usuarioPerfil?.tutorprimaria);
      console.log('Cursos disponibles:', this.profesorcursos.map(c => `${c.grado}${c.seccion} (${c.nivel})`));
      return;
    }

    const tutorIds = this.gruposTutoradosIds.join(',');
    console.log('Navegando a notas bimestrales con tutorIds:', tutorIds);

    this.router.navigate(['/app-lista-alumnos'], {
      queryParams: {
        tutorIds: tutorIds
      }
    });
  }
}