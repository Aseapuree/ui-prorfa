import { NotificationComponent } from './../../../campus/components/shared/notificaciones/notification.component';
import { NotificationService } from './../../../campus/components/shared/notificaciones/notification.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableComponent, ColumnConfig, ActionConfig } from './../../../general/components/table/table.component';
import { MatriculaService } from './../../services/matricula.service';
import { Matricula } from './../../interfaces/DTOMatricula';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faDollarSign, faFileAlt, faExclamationTriangle, faSearch, faBroom, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { GeneralLoadingSpinnerComponent } from './../../../general/components/spinner/spinner.component';
import { Alumno } from './../../interfaces/DTOAlumno';
import { ComprobanteService } from './../../services/comprobante.service';
import { ApoderadoService } from './../../services/apoderado.service';
import { AlumnoService } from './../../services/alumno.service';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Comprobante } from '../../interfaces/DTOComprobante';
import { Apoderado } from '../../interfaces/DTOApoderado';
import { PaginationComponent } from './../../../general/components/pagination/pagination.component';
import { FormsModule } from '@angular/forms';
import { TooltipComponent } from './../../../general/components/tooltip/tooltip.component';
import { EntidadService } from './../../services/entidad.service';
import { DatosNGS, SeccionVacantes } from './../../interfaces/DTOEntidad';

export interface MatriculadoDisplay extends Matricula {
  nombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  alumno?: Alumno;
  codigomatricula?: string | null;
  codigopago?: string | null;
  fechaCreacionMatricula?: string | null;
  numeroDocumentoApoderado?: string | null;
  numeroDocumentoAlumno?: string | null;
  montoTotalComprobante?: number;
  seccion?: string;
}

@Component({
  selector: 'app-matriculados',
  standalone: true,
  imports: [
    CommonModule,
    TableComponent,
    FontAwesomeModule,
    GeneralLoadingSpinnerComponent,
    PaginationComponent,
    FormsModule,
    NotificationComponent,
    TooltipComponent
  ],
  templateUrl: './matriculados.component.html',
  styleUrls: ['./matriculados.component.scss']
})
export class MatriculadosComponent implements OnInit {
  loading = false;
  spinnerMessage: string = 'Cargando matrículas...';

  matriculados: MatriculadoDisplay[] = [];

  columns: ColumnConfig[] = [];
  actions: ActionConfig[] = [];

  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 5;
  totalElements = 0;

  currentDate: string;

  datosNGS: DatosNGS | null = null;
  nivelesParaFiltro: string[] = [];
  gradosParaFiltro: string[] = [];
  seccionesParaFiltro: SeccionVacantes[] = [];

  currentSortField: string | null = null;
  currentSortDirection: 'asc' | 'desc' | null = null;

  filters = {
    codigomatricula: '',
    codigopago: '',
    grado: '',
    seccion: '',
    nivel: '',
    fechaInicio: '' as string,
    fechaFin: '' as string
  };

  isValidFechaInicio: boolean = true;
  isValidFechaFin: boolean = true;
  currentYear: number = new Date().getFullYear();

  // REGEX
  //private readonly CODIGO_MATRICULA_REGEX = /^MTRC-\d{4}-\d{5}$/i;
  //private readonly CODIGO_PAGO_REGEX = /^PAGO-\d{4}-\d{5}$/i;

  private readonly REGEX_INTERMEDIO = /^[MPTRCAGO0-9-]*$/i;
  //private readonly REGEX_BUSQUEDA_PARCIAL = /^(MTRC|PAGO)(-\d{0,4})?(-\d{0,5})?$/i;

  private lastValidValues: { [key: string]: string } = {
    codigomatricula: '',
    codigopago: ''
  };

  constructor(
    private router: Router,
    private matriculaService: MatriculaService,
    private comprobanteService: ComprobanteService,
    private apoderadoService: ApoderadoService,
    private alumnoService: AlumnoService,
    private library: FaIconLibrary,
    private notificationService: NotificationService,
    private entidadService: EntidadService
  ) {
    this.library.addIcons(
        faArrowRight, faDollarSign, faFileAlt, faExclamationTriangle,
        faSearch, faBroom, faFileExcel
    );
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayLocal = new Date(today.getTime() - (offset * 60 * 1000));
    this.currentDate = todayLocal.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.columns = [
      { field: 'codigomatricula', header: 'CÓDIGO MATRÍCULA', maxWidth: 170, sortable: true },
      { field: 'codigopago', header: 'CÓDIGO PAGO', maxWidth: 170, sortable: true },
      { field: 'grado', header: 'GRADO', maxWidth: 100, sortable: true },
      { field: 'seccion', header: 'SECCIÓN', maxWidth: 100, sortable: true },
      { field: 'nivel', header: 'NIVEL', maxWidth: 100, sortable: true },
      { field: 'numeroDocumentoApoderado', header: 'DOC. APODERADO', maxWidth: 130, sortable: true },
      { field: 'numeroDocumentoAlumno', header: 'DOC. ALUMNO', maxWidth: 130, sortable: true },
      { field: 'estadoMatricula', header: 'ESTADO', maxWidth: 150, sortable: true },
      { field: 'fechaCreacionMatricula', header: 'FECHA CREACIÓN', maxWidth: 150, sortable: true, type: 'date' },
    ];

    this.actions = [
      {
        name: 'continue',
        icon: ['fas', 'arrow-right'],
        tooltip: 'CONTINUAR',
        action: (item: MatriculadoDisplay) => this.continueMatricula(item),
        hoverColor: 'green',
        visible: (item: MatriculadoDisplay) => item.estadoMatricula?.trim().toUpperCase() === 'EN PROCESO'
      },
      {
        name: 'print-payment',
        icon: ['fas', 'dollar-sign'],
        tooltip: 'COMPROBANTE PAGO',
        action: (item: MatriculadoDisplay) => {
          this.spinnerMessage = 'Generando comprobante de pago...';
          this.viewComprobante(item, 'pago');
        },
        hoverColor: 'blue',
        visible: (item: MatriculadoDisplay) => item.estadoMatricula?.trim().toUpperCase() === 'COMPLETADO'
      },
      {
        name: 'print-enrollment',
        icon: ['fas', 'file-alt'],
        tooltip: 'COMPROBANTE MATRÍCULA',
        action: (item: MatriculadoDisplay) => {
          this.spinnerMessage = 'Generando comprobante de matrícula...';
          this.viewComprobante(item, 'matricula');
        },
        hoverColor: 'purple',
        visible: (item: MatriculadoDisplay) => item.estadoMatricula?.trim().toUpperCase() === 'COMPLETADO'
      }
    ];

    this.cargarDatosEntidadParaFiltros();
    this.onSearch();
  }

  cargarDatosEntidadParaFiltros(): void {
    const idUsuario = localStorage.getItem('IDUSER');
    if (idUsuario) {
      this.entidadService.obtenerEntidadPorUsuario(idUsuario).subscribe({
        next: (entidad) => {
          if (entidad && entidad.datosngs && entidad.datosngs.niveles) {
            this.datosNGS = entidad.datosngs;
            this.nivelesParaFiltro = this.datosNGS.niveles!
              .map(n => n.nombre)
              .filter((nombre): nombre is string => !!nombre)
              .sort();
            this.notificationService.showNotification('Niveles cargados exitosamente para los filtros.', 'success');
          } else {
            this.notificationService.showNotification('No se pudieron cargar los niveles para los filtros desde la entidad.', 'error');
            this.nivelesParaFiltro = [];
          }
          this.gradosParaFiltro = [];
          this.seccionesParaFiltro = [];
        },
        error: (err) => {
          this.notificationService.showNotification('Error al cargar datos de entidad para filtros: ' + err.message, 'error');
          this.nivelesParaFiltro = [];
          this.gradosParaFiltro = [];
          this.seccionesParaFiltro = [];
        }
      });
    } else {
      this.notificationService.showNotification('Error: No se pudo identificar al usuario.', 'error');
      this.nivelesParaFiltro = [];
      this.gradosParaFiltro = [];
      this.seccionesParaFiltro = [];
    }
  }

  onNivelChange(): void {
    this.filters.grado = '';
    this.filters.seccion = '';
    this.gradosParaFiltro = [];
    this.seccionesParaFiltro = [];

    if (this.filters.nivel && this.datosNGS && this.datosNGS.niveles) {
      const nivelSeleccionado = this.datosNGS.niveles.find(
        (n) => n.nombre.toLowerCase() === this.filters.nivel.toLowerCase()
      );
      if (nivelSeleccionado && nivelSeleccionado.grados) {
        this.gradosParaFiltro = nivelSeleccionado.grados
          .map(g => g.nombre)
          .filter((nombre): nombre is string => !!nombre)
          .sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return a.localeCompare(b);
          });
        this.notificationService.showNotification(`Grados cargados para el nivel: ${this.filters.nivel}`, 'info');
      }
    }
  }

  onGradoChange(): void {
    this.filters.seccion = '';
    this.seccionesParaFiltro = [];

    if (this.filters.nivel && this.filters.grado && this.datosNGS && this.datosNGS.niveles) {
      const nivelSeleccionado = this.datosNGS.niveles.find(
        (n) => n.nombre.toLowerCase() === this.filters.nivel.toLowerCase()
      );
      if (nivelSeleccionado && nivelSeleccionado.grados) {
        const gradoSeleccionado = nivelSeleccionado.grados.find(
          (g) => g.nombre.toLowerCase() === this.filters.grado.toLowerCase()
        );
        if (gradoSeleccionado && gradoSeleccionado.secciones) {
          this.seccionesParaFiltro = [...gradoSeleccionado.secciones].sort((a, b) => a.nombre.localeCompare(b.nombre));
          this.notificationService.showNotification(`Secciones cargadas para el grado: ${this.filters.grado}`, 'info');
        }
      }
    }
  }

  isValidDateFormat(dateString: string | null): boolean {
    if (!dateString) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  validateDateIsNotFuture(dateString: string | null): boolean {
    if (!dateString || !this.isValidDateFormat(dateString)) return true;
    const [year, month, day] = dateString.split('-').map(Number);
    const inputDateUTC = Date.UTC(year, month - 1, day);
    const today = new Date();
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return inputDateUTC <= todayUTC;
  }

  onDateChange(field: 'fechaInicio' | 'fechaFin'): void {
    const dateValue = this.filters[field];
    if (dateValue && !this.isValidDateFormat(dateValue)) {
      this.notificationService.showNotification(`Formato de ${field === 'fechaInicio' ? 'Fecha Inicio' : 'Fecha Fin'} inválido. Use YYYY-MM-DD.`, 'error');
      this.filters[field] = '';
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = false;
      return;
    }
    if (dateValue && !this.validateDateIsNotFuture(dateValue)) {
      this.notificationService.showNotification(`La ${field === 'fechaInicio' ? 'Fecha Inicio' : 'Fecha Fin'} no puede ser mayor a la fecha actual.`, 'error');
      this.filters[field] = '';
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = false;
    } else {
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = true;
    }

    if (field === 'fechaFin' && this.filters.fechaInicio && dateValue) {
      const startDate = new Date(this.filters.fechaInicio);
      const endDate = new Date(dateValue);
      if (endDate < startDate) {
        this.notificationService.showNotification('La Fecha Fin no puede ser menor que la Fecha Inicio.', 'error');
        this.filters.fechaFin = '';
        this.isValidFechaFin = false;
      }
    }
    if (field === 'fechaInicio' && this.filters.fechaFin) {
      const startDate = new Date(dateValue);
      const endDate = new Date(this.filters.fechaFin);
      if (endDate < startDate) {
        this.notificationService.showNotification('La Fecha Fin no puede ser menor que la Fecha Inicio.', 'error');
        this.filters.fechaFin = '';
        this.isValidFechaFin = false;
      }
    }
  }

  // VALIDACIÓN EN TIEMPO REAL PARA CÓDIGOS MTRC y PAGO
  onInputChange(event: Event, field: 'codigomatricula' | 'codigopago'): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.toUpperCase().trimStart();

    // Bloquea espacios al inicio
    if (valor.startsWith(' ')) {
      input.value = this.lastValidValues[field];
      this.filters[field] = this.lastValidValues[field];
      return;
    }

    // Permitir solo caracteres válidos mientras escribe
    if (valor && !this.REGEX_INTERMEDIO.test(valor)) {
      input.value = this.lastValidValues[field];
      this.filters[field] = this.lastValidValues[field];
      this.notificationService.showNotification('Solo letras MTRC/PAGO, números y guiones', 'info');
      return;
    }

    this.filters[field] = valor;
    this.lastValidValues[field] = valor;
  }

    onEnterKey(event: any): void {
    if (event.key === 'Enter') {
      this.currentPage = 1;
      this.onSearch();
    }
  }


  // BÚSQUEDA CON BACKEND
  onSearch(sortEvent?: { sortBy: string, sortDir: string }): void {
    // Solo reiniciamos página 1 cuando NO viene de paginación
    if (!sortEvent) {
      this.currentPage = 1;
    }

    if (sortEvent) {
      this.currentSortField = sortEvent.sortBy;
      this.currentSortDirection = sortEvent.sortDir as 'asc' | 'desc';
    }

    this.loading = true;
    this.spinnerMessage = 'Buscando matrículas...';

    const filters: any = {
      codigomatricula: this.filters.codigomatricula || undefined,
      codigopago: this.filters.codigopago || undefined,
      nivel: this.filters.nivel ? this.filters.nivel.toLowerCase() : undefined,
      grado: this.filters.grado || undefined,
      seccion: this.filters.seccion ? this.filters.seccion.toLowerCase() : undefined,
      fechaInicio: this.filters.fechaInicio || undefined,
      fechaFin: this.filters.fechaFin || undefined,
    };

    this.matriculaService.obtenerMatriculas(filters, this.currentPage - 1, this.pageSize)
      .pipe(
        switchMap((matriculas: Matricula[]) => {
          this.totalPages = this.matriculaService.totalPages || 1;
          this.totalElements = this.matriculaService.totalElements || 0;

          if (!matriculas || matriculas.length === 0) {
            this.notificationService.showNotification('No se encontraron matrículas.', 'info');
            return of([]);
          }

          const observables = matriculas.map(m => this.enriquecerMatricula(m));
          return forkJoin(observables);
        })
      )
      .subscribe({
        next: (data) => {
          this.matriculados = data;

          if (this.currentSortField && this.currentSortDirection) {
            this.ordenarLocalmente();
          }

          this.loading = false;
          const mensaje = data.length === 0
            ? 'No se encontraron matrículas con los filtros aplicados.'
            : 'Matrículas cargadas exitosamente.';
          this.notificationService.showNotification(mensaje, data.length === 0 ? 'info' : 'success');
        },
        error: (err) => {
          this.loading = false;
          this.notificationService.showNotification('Error al cargar matrículas: ' + err.message, 'error');
        }
      });
  }


    private enriquecerMatricula(matricula: Matricula): Observable<MatriculadoDisplay> {
    const apoderado$ = matricula.idapoderado
      ? this.apoderadoService.obtenerApoderado(matricula.idapoderado).pipe(catchError(() => of(null)))
      : of(null);

    const alumno$ = matricula.idalumno
      ? this.alumnoService.obtenerAlumno(matricula.idalumno).pipe(catchError(() => of(null)))
      : of(null);

    const comprobante$ = (matricula.estadoMatricula?.trim().toUpperCase() === 'COMPLETADO' && matricula.idmatricula)
      ? this.comprobanteService.obtenerComprobantePorIdMatricula(matricula.idmatricula).pipe(catchError(() => of(null)))
      : of(null);

    return forkJoin([of(matricula), apoderado$, alumno$, comprobante$]).pipe(
      map(([m, apoderado, alumno, comprobante]) => {
        const seccionNombre = (typeof m.seccion === 'object' && m.seccion && 'nombre' in m.seccion)
          ? (m.seccion as any).nombre
          : (m.seccion || null);

        return {
          ...m,
          codigomatricula: comprobante?.codigomatricula || null,
          codigopago: comprobante?.codigopago || null,
          numeroDocumentoApoderado: apoderado?.numeroDocumento || null,
          numeroDocumentoAlumno: alumno?.numeroDocumento || null,
          montoTotalComprobante: comprobante?.montototal ? parseFloat(comprobante.montototal) : undefined,
          seccion: seccionNombre,
          fechaCreacionMatricula: m.fechaCreacion || null
        } as MatriculadoDisplay;
      })
    );
  }


  private ordenarLocalmente(): void {
    this.matriculados.sort((a: any, b: any) => {
      const fieldA = a[this.currentSortField!];
      const fieldB = b[this.currentSortField!];
      let comparison = 0;
      if (fieldA == null) comparison = -1;
      else if (fieldB == null) comparison = 1;
      else if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        comparison = fieldA.toLowerCase().localeCompare(fieldB.toLowerCase());
      } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        comparison = fieldA - fieldB;
      } else if (this.currentSortField === 'fechaCreacionMatricula') {
        comparison = new Date(fieldA || '').getTime() - new Date(fieldB || '').getTime();
      } else {
        comparison = fieldA < fieldB ? -1 : (fieldA > fieldB ? 1 : 0);
      }
      return this.currentSortDirection === 'asc' ? comparison : -comparison;
    });
  }

    onPageChange(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages || newPage === this.currentPage) return;
    this.currentPage = newPage;
    this.onSearch();
  }

  continueMatricula(matricula: MatriculadoDisplay): void {
    const estadoActual = matricula.estadoMatricula?.trim().toUpperCase();
    if (estadoActual === 'EN PROCESO' && matricula.idmatricula) {
      this.router.navigate(['/registrarmatricula'], {
        queryParams: {
          idMatricula: matricula.idmatricula,
          nivel: matricula.nivel,
          grado: matricula.grado,
        }
      });
    } else {
      this.notificationService.showNotification('Solo se puede continuar matrículas en estado "En Proceso".', 'error');
    }
  }

  viewComprobante(matricula: MatriculadoDisplay, tipoComprobante: string): void {
    if (matricula.estadoMatricula?.trim().toUpperCase() !== 'COMPLETADO') {
      this.notificationService.showNotification(`El comprobante solo está disponible para matrículas completadas.`, 'error');
      return;
    }
    if (!matricula.idmatricula) return;

    this.loading = true;
    this.comprobanteService.generarPdfDirecto(matricula.idmatricula, tipoComprobante, matricula.montoTotalComprobante)
      .subscribe({
        next: (blob) => {
          this.loading = false;
          if (blob.size === 0) {
            this.notificationService.showNotification('El archivo PDF está vacío.', 'error');
            return;
          }
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: () => {
          this.loading = false;
          this.notificationService.showNotification('Error al generar el comprobante.', 'error');
        }
      });
  }

  resetFilter(): void {
    this.filters = {
      codigomatricula: '',
      codigopago: '',
      grado: '',
      seccion: '',
      nivel: '',
      fechaInicio: '',
      fechaFin: ''
    };
    this.gradosParaFiltro = [];
    this.seccionesParaFiltro = [];
    this.currentPage = 1;
    this.currentSortField = null;
    this.currentSortDirection = null;
    this.onSearch();
    this.notificationService.showNotification('Filtros limpiados.', 'info');
  }

  exportToExcel(): void {
    this.loading = true;
    this.notificationService.showNotification('Generando archivo Excel...', 'info');

    const filters: any = {
      codigomatricula: this.filters.codigomatricula || undefined,
      codigopago: this.filters.codigopago || undefined,
      nivel: this.filters.nivel ? this.filters.nivel.toLowerCase() : undefined,
      grado: this.filters.grado || undefined,
      seccion: this.filters.seccion ? this.filters.seccion.toLowerCase() : undefined,
      fechaInicio: this.filters.fechaInicio || undefined,
      fechaFin: this.filters.fechaFin || undefined,
    };

    this.matriculaService.descargarExcel(filters).subscribe({
      next: () => {
        this.loading = false;
        this.notificationService.showNotification('Excel descargado correctamente', 'success');
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.showNotification('Error al generar el Excel: ' + err.message, 'error');
      }
    });
  }
}
