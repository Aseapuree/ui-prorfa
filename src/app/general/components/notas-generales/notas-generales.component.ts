import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GeneralLoadingSpinnerComponent } from '../spinner/spinner.component';
import { DTONotaResponse, AlumnoNotas } from '../../../campus/interface/DTONota';
import { NotasService } from '../../../campus/services/notas.service';
import { catchError, map, throwError } from 'rxjs';
import { PaginationComponent } from '../pagination/pagination.component';


@Component({
  selector: 'app-notas-generales',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, GeneralLoadingSpinnerComponent, PaginationComponent],
  templateUrl: './notas-generales.component.html',
  styleUrls: ['./notas-generales.component.scss']
})
export class NotasGeneralesComponent implements OnInit {
  notas: DTONotaResponse[] = [];
  alumnosNotas: LocalAlumnoNotas[] = []; // Cambiado a LocalAlumnoNotas
  expandedRows: Set<string> = new Set();
  isLoading: boolean = false;
  isDataLoaded: boolean = false;
  loadingMessage: string = 'Cargando notas...';
  idSesion: string = '';
  grado: string = '';
  seccion: string = '';
  nivel: string = '';
  filterActivity: string = '';
  filterSession: string = '';
  filterNotaMin: number | null = null;
  availableActivities: string[] = [];
  availableSessions: string[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notasService: NotasService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.idSesion = localStorage.getItem('idProfesorCurso') || '';
      this.grado = params['grado'] || localStorage.getItem('grado') || '5°';
      this.seccion = params['seccion'] || localStorage.getItem('seccion') || 'B';
      this.nivel = params['nivel'] || localStorage.getItem('nivel') || 'Secundaria';
      this.loadNotas();
    });
  }

  loadNotas(): void {
    if (!this.idSesion) {
      console.error('No se encontró idProfesorCurso en localStorage');
      this.isLoading = false;
      this.isDataLoaded = true;
      return;
    }

    this.isLoading = true;
    this.notasService.listarNotasPorProfesorCurso(this.idSesion).pipe(
      map(response => {
        if (response.code === 200 && response.data) {
          const notas: DTONotaResponse[] = [];
          const sesiones = response.data.sesiones || [];
          sesiones.forEach(sesion => {
            const titulo = sesion.sesion?.titulo || ''; // Obtenemos el título de la sesión
            const infoCurso = sesion.sesion?.infoCurso || {};
            const notasSesion = sesion.notas || [];
            notasSesion.forEach(nota => {
              notas.push({
                idNota: titulo, // Cambiamos idNota por el título de la sesión
                idAlumno: nota.idAlumno || '',
                nombre: nota.nombre || '',
                apellidos: nota.apellidos || '',
                idActividad: nota.idActividad || '',
                nombreActividad: nota.nombreActividad || '',
                nota: nota.nota || null,
                grado: infoCurso.grado || this.grado,
                seccion: infoCurso.seccion || this.seccion,
                nivel: infoCurso.nivel || this.nivel,
                notatareaurl: nota.notatareaurl || '',
                usuarioCreacion: nota.usuarioCreacion || null,
                usuarioActualizacion: nota.usuarioActualizacion || null,
                nombreArchivo: nota.nombreArchivo || '',
                comentario: nota.comentario || null,
                fechaRegistro: nota.fechaRegistro || '',
                fechaActualizacion: nota.fechaActualizacion || ''
              });
            });
          });
          return notas;
        } else {
          throw new Error('No se encontraron notas para el curso');
        }
      }),
      catchError(error => {
        console.error('Error al cargar las notas:', error);
        this.isLoading = false;
        this.isDataLoaded = true;
        return throwError(() => error);
      })
    ).subscribe(notas => {
      this.notas = notas;
      this.availableActivities = [...new Set(this.notas.map(nota => nota.nombreActividad))];
      this.availableSessions = [...new Set(this.notas.map(nota => nota.idNota))]; // Esto ahora usará los títulos
      this.agruparNotasPorAlumno();
      this.isLoading = false;
      this.isDataLoaded = true;
    });
  }

  agruparNotasPorAlumno(): void {
    const notasFiltradas = this.filtrarNotas();
    const notasPorAlumno = notasFiltradas.reduce((acc: { [key: string]: DTONotaResponse[] }, nota) => {
      const alumnoKey = `${nota.idAlumno}-${nota.nombre}-${nota.apellidos}`;
      if (!acc[alumnoKey]) {
        acc[alumnoKey] = [];
      }
      acc[alumnoKey].push(nota);
      return acc;
    }, {});

    this.alumnosNotas = Object.keys(notasPorAlumno).map(alumnoKey => {
      const notas = notasPorAlumno[alumnoKey];
      const notasNumericas = notas
        .map(nota => nota.nota)
        .filter((nota): nota is number => nota !== null);
      const promedioNotas = notasNumericas.length > 0
        ? notasNumericas.reduce((sum, n) => sum + n, 0) / notasNumericas.length
        : 0;
      const asistencia = 0;
      return {
        alumno: `${notas[0].nombre} ${notas[0].apellidos}`,
        notas,
        promedioNotas: Number(promedioNotas.toFixed(2)),
        asistencia,
      };
    });
  }

  toggleRow(alumnoKey: string): void {
    if (this.expandedRows.has(alumnoKey)) {
      this.expandedRows.delete(alumnoKey);
    } else {
      this.expandedRows.add(alumnoKey);
    }
  }

  filtrarNotas(): DTONotaResponse[] {
    let notasFiltradas = this.notas;

    if (this.filterActivity) {
      notasFiltradas = notasFiltradas.filter(nota => nota.nombreActividad === this.filterActivity);
    }

    if (this.filterSession) {
      notasFiltradas = notasFiltradas.filter(nota => nota.idNota === this.filterSession);
    }

    if (this.filterNotaMin !== null) {
      notasFiltradas = notasFiltradas.filter(nota => (nota.nota ?? 0) >= this.filterNotaMin!);
    }

    return notasFiltradas;
  }

  aplicarFiltros(): void {
    this.agruparNotasPorAlumno();
  }

  regresar(): void {
    this.router.navigate(['/campus-vista'], {
      queryParams: { grado: this.grado, seccion: this.seccion, nivel: this.nivel }
    });
  }
}

interface LocalAlumnoNotas {
  alumno: string;
  notas: DTONotaResponse[];
  promedioNotas: number;
  asistencia: number;
}