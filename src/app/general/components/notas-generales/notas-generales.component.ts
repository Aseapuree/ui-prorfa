  import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { Router, RouterModule, ActivatedRoute } from '@angular/router';
  import { FormsModule } from '@angular/forms';
  import { GeneralLoadingSpinnerComponent } from '../spinner/spinner.component';
  import { DTONotaResponse } from '../../../campus/interface/DTONota';

  @Component({
    selector: 'app-notas-generales',
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, GeneralLoadingSpinnerComponent],
    templateUrl: './notas-generales.component.html',
    styleUrls: ['./notas-generales.component.scss']
  })
  export class NotasGeneralesComponent implements OnInit {
    notas: DTONotaResponse[] = [];
    alumnosNotas: AlumnoNotas[] = [];
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
      private route: ActivatedRoute
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
      // Simulamos datos estáticos
      this.isLoading = true;
      this.notas = [
        {
          idNota: 'sesion1',
          idAlumno: 'alumno1',
          nombre: 'Joaquín',
          apellidos: 'Pérez',
          idActividad: 'act1',
          nombreActividad: 'Tarea de Matemáticas',
          nota: 15,
          grado: '5°',
          seccion: 'B',
          nivel: 'Secundaria',
          notatareaurl: 'http://example.com/tarea1.pdf',
          usuarioCreacion: 'profesor1',
          usuarioActualizacion: null,
          nombreArchivo: 'tarea1.pdf',
          comentario: 'Buen trabajo',
          fechaRegistro: '2025-05-01',
          fechaActualizacion: '2025-05-01'
        },
        {
          idNota: 'sesion2',
          idAlumno: 'alumno1',
          nombre: 'Joaquín',
          apellidos: 'Pérez',
          idActividad: 'act2',
          nombreActividad: 'Prueba de Ciencias',
          nota: 18,
          grado: '5°',
          seccion: 'B',
          nivel: 'Secundaria',
          notatareaurl: '',
          usuarioCreacion: 'profesor1',
          usuarioActualizacion: null,
          nombreArchivo: undefined,
          comentario: 'Excelente',
          fechaRegistro: '2025-05-02',
          fechaActualizacion: '2025-05-02'
        },
        {
          idNota: 'sesion1',
          idAlumno: 'alumno2',
          nombre: 'María',
          apellidos: 'Gómez',
          idActividad: 'act1',
          nombreActividad: 'Tarea de Matemáticas',
          nota: 14,
          grado: '5°',
          seccion: 'B',
          nivel: 'Secundaria',
          notatareaurl: 'http://example.com/tarea2.pdf',
          usuarioCreacion: 'profesor1',
          usuarioActualizacion: null,
          nombreArchivo: 'tarea2.pdf',
          comentario: 'Falta detalle',
          fechaRegistro: '2025-05-01',
          fechaActualizacion: '2025-05-01'
        },
        {
          idNota: 'sesion2',
          idAlumno: 'alumno2',
          nombre: 'María',
          apellidos: 'Gómez',
          idActividad: 'act2',
          nombreActividad: 'Prueba de Ciencias',
          nota: 16,
          grado: '5°',
          seccion: 'B',
          nivel: 'Secundaria',
          notatareaurl: '',
          usuarioCreacion: 'profesor1',
          usuarioActualizacion: null,
          nombreArchivo: undefined,
          comentario: null,
          fechaRegistro: '2025-05-02',
          fechaActualizacion: '2025-05-02'
        },
        {
          idNota: 'sesion3',
          idAlumno: 'alumno3',
          nombre: 'Carlos',
          apellidos: 'López',
          idActividad: 'act3',
          nombreActividad: 'Tarea de Historia',
          nota: 12,
          grado: '5°',
          seccion: 'B',
          nivel: 'Secundaria',
          notatareaurl: '',
          usuarioCreacion: 'profesor1',
          usuarioActualizacion: null,
          nombreArchivo: undefined,
          comentario: 'Puede mejorar',
          fechaRegistro: '2025-05-03',
          fechaActualizacion: '2025-05-03'
        }
      ];

      this.availableActivities = [...new Set(this.notas.map(nota => nota.nombreActividad))];
      this.availableSessions = [...new Set(this.notas.map(nota => nota.idNota))];
      this.agruparNotasPorAlumno();

      this.isLoading = false;
      this.isDataLoaded = true;
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
        const asistencia = 0; // Placeholder - No hay campo en DTONotaResponse
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

  interface AlumnoNotas {
    alumno: string;
    notas: DTONotaResponse[];
    promedioNotas: number;
    asistencia: number;
  }