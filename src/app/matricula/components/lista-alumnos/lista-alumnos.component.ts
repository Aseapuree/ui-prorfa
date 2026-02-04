import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';
import { NotasService } from '../../../campus/services/notas.service';
import { ProfesorCursoService } from '../../../campus/services/profesor-curso.service';
import { PaginationComponent } from '../../../general/components/pagination/pagination.component';
import { DTONotaResponse } from '../../../campus/interface/DTONota';
import { ProfesorCurso } from '../../../campus/interface/ProfesorCurso';

@Component({
  selector: 'app-lista-alumnos',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, GeneralLoadingSpinnerComponent, PaginationComponent],
  templateUrl: './lista-alumnos.component.html',
  styleUrls: ['./lista-alumnos.component.scss']
})
export class ListaAlumnosComponent implements OnInit {
  alumnos: LocalAlumno[] = [];
  isLoading: boolean = false;
  isDataLoaded: boolean = false;
  loadingMessage: string = 'Cargando lista de alumnos...';
  grado: string = '';
  seccion: string = '';
  nivel: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notasService: NotasService,
    private profesorCursoService: ProfesorCursoService
  ) {}

  ngOnInit(): void {
    this.loadAlumnos();
  }

  loadAlumnos(): void {
    this.isLoading = true;
    this.alumnos = []; // Limpiar lista

    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
      console.error('No se encontró el ID del profesor logueado.');
      this.isLoading = false;
      this.isDataLoaded = true;
      return;
    }

    // Leer tutorIds desde queryParams
    const tutorIdsStr = this.route.snapshot.queryParams['tutorIds'];
    let tutorIds: string[] = [];
    if (tutorIdsStr) {
      tutorIds = tutorIdsStr.split(',');
      console.log('Filtrando solo alumnos de grupos tutorados:', tutorIds);
    } else {
      console.warn('No se recibieron IDs tutorados – mostrando todos los cursos');
    }

    // Paso 1: Obtener todos los cursos del profesor
    this.profesorCursoService.obtenerCursosPorProfesor(usuarioId).subscribe({
      next: (cursos: ProfesorCurso[]) => {
        if (!cursos || cursos.length === 0) {
          console.warn('El profesor no tiene cursos asignados.');
          this.isLoading = false;
          this.isDataLoaded = true;
          return;
        }

        // Filtrar solo los cursos que están en tutorIds (si hay tutorIds)
        let idProfesorCursos = cursos
          .map(c => c.idProfesorCurso)
          .filter((id): id is string => id !== undefined && id !== null);

        if (tutorIds.length > 0) {
          idProfesorCursos = idProfesorCursos.filter(id => tutorIds.includes(id));
          console.log('Cursos filtrados por tutoría:', idProfesorCursos);
        }

        if (idProfesorCursos.length === 0) {
          console.warn('No se encontraron cursos tutorados válidos.');
          this.isLoading = false;
          this.isDataLoaded = true;
          return;
        }

        // Paso 2: Cargar alumnos solo de esos cursos
        this.fetchAllAlumnos(idProfesorCursos);
      },
      error: (error) => {
        console.error('Error al cargar cursos del profesor:', error);
        this.isLoading = false;
        this.isDataLoaded = true;
      }
    });
  }

  fetchAllAlumnos(idProfesorCursos: string[]): void {
    const alumnosMap = new Map<string, LocalAlumno>();

    const processNext = (index: number) => {
      if (index >= idProfesorCursos.length) {
        this.alumnos = Array.from(alumnosMap.values());
        this.isDataLoaded = true;
        this.isLoading = false;
        console.log('Alumnos finales cargados:', this.alumnos.length);
        return;
      }

      const idProfesorCurso = idProfesorCursos[index];

      this.notasService.listarNotasPorProfesorCurso(idProfesorCurso).subscribe({
        next: (response) => {
          if (response.code === 200 && response.data) {
            response.data.sesiones.forEach(sesion => {
              sesion.notas.forEach((nota: DTONotaResponse) => {
                const idAlumno = nota.idAlumno;
                if (!alumnosMap.has(idAlumno)) {
                  alumnosMap.set(idAlumno, {
                    id: idAlumno,
                    nombre: `${nota.nombre} ${nota.apellidos || ''}`.trim(),
                    grado: nota.grado || 'No especificado',
                    seccion: nota.seccion || 'No especificado'
                  });
                }
              });
            });
          }
          processNext(index + 1);
        },
        error: (error) => {
          console.error(`Error al cargar notas para ${idProfesorCurso}:`, error);
          processNext(index + 1);
        }
      });
    };

    processNext(0);
  }

  verBoleta(idAlumno: string, nombreAlumno: string): void {
  const alumno = this.alumnos.find(a => a.id === idAlumno);
  const grado = alumno?.grado || 'No especificado';
  const seccion = alumno?.seccion || 'No especificado';
  const nivel = this.nivel || 'Secundaria';

  localStorage.setItem('idAlumno', idAlumno);
  localStorage.setItem('nombreAlumno', nombreAlumno);
  localStorage.setItem('grado', grado);
  localStorage.setItem('seccion', seccion);
  localStorage.setItem('nivel', nivel);

  this.router.navigate(['/app-boleta-notas']);
}

  regresar(): void {
    this.router.navigate(['/campus']);
  }
}

interface LocalAlumno {
  id: string;
  nombre: string;
  grado: string;
  seccion: string;
}