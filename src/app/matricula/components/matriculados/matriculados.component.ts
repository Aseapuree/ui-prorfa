import { NotificationComponent } from './../../../campus/components/shared/notificaciones/notification.component';
import { NotificationService } from './../../../campus/components/shared/notificaciones/notification.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableComponent, ColumnConfig } from './../../../general/components/table/table.component';
import { MatriculaService } from './../../services/matricula.service';
import { Matricula } from './../../interfaces/DTOMatricula';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faDollarSign, faFileAlt, faExclamationTriangle, faSearch, faBroom, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { GeneralLoadingSpinnerComponent } from './../../../general/components/spinner/spinner.component';
import { Alumno } from './../../interfaces/DTOAlumno';
import { ComprobanteService } from './../../services/comprobante.service';
import { ApoderadoService } from './../../services/apoderado.service';
import { AlumnoService } from './../../services/alumno.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Comprobante } from '../../interfaces/DTOComprobante';
import { Apoderado } from '../../interfaces/DTOApoderado';
import { PaginationComponent } from './../../../general/components/pagination/pagination.component';
import { FormsModule } from '@angular/forms';
import { TooltipComponent } from './../../../general/components/tooltip/tooltip.component';

// Importaciones para Exportar a Excel
import * as XLSX from 'xlsx';

import { EntidadService } from './../../services/entidad.service';
import { DatosNGS, Nivel as EntidadNivel, Grado as EntidadGrado, SeccionVacantes } from './../../interfaces/DTOEntidad';

// Interfaz para la configuración de acciones en cada fila de la tabla
export interface ActionConfig {
  name: string;
  icon: any;
  tooltip: string;
  action: (item: MatriculadoDisplay) => void;
  hoverColor?: string;
  visible?: (item: MatriculadoDisplay) => boolean;
}

// Interfaz que extiende Matricula para incluir datos adicionales para la visualización en tabla
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
  // Indicador de estado de carga
  loading = false;

  // Datos para la tabla (filtrados, ordenados y paginados)
  matriculados: MatriculadoDisplay[] = [];
  // Todos los datos de matrículas cargados
  allMatriculados: MatriculadoDisplay[] = [];

  // Configuración de las columnas y acciones de la tabla
  columns: ColumnConfig[] = [];
  actions: ActionConfig[] = [];

  // Propiedades de paginación
  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 5;
  maxPaginationSize: number = 7;

  // Fecha actual para validaciones
  currentDate: string;

  // Propiedades para filtros dinámicos basados en la entidad
  datosNGS: DatosNGS | null = null;
  nivelesParaFiltro: string[] = [];
  gradosParaFiltro: string[] = [];
  seccionesParaFiltro: SeccionVacantes[] = [];

  // Propiedades para almacenar el estado de ordenación de la tabla
  currentSortField: string | null = null;
  currentSortDirection: 'asc' | 'desc' | null = null;

  // Objeto que contiene los valores actuales de los filtros aplicados
  filters = {
    codigomatricula: '',
    codigopago: '',
    grado: '',
    seccion: '',
    nivel: '',
    fechaInicio: '' as string,
    fechaFin: '' as string
  };

  /**
   * Constructor del componente.
   * Inyecta los servicios y dependencias necesarias.
   */
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
    // Calcula y formatea la fecha actual
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayLocal = new Date(today.getTime() - (offset*60*1000));
    this.currentDate = todayLocal.toISOString().split('T')[0];
  }

  /**
   * Método del ciclo de vida que se ejecuta al inicializar el componente.
   * Configura las columnas de la tabla, las acciones y carga los datos iniciales.
   */
  ngOnInit() {
    // Define la configuración de las columnas de la tabla, incluyendo si son ordenables.
    this.columns = [
      { field: 'codigomatricula', header: 'CODIGO MATRICULA', maxWidth: 150, sortable: true },
      { field: 'codigopago', header: 'CODIGO PAGO', maxWidth: 150, sortable: true },
      { field: 'grado', header: 'GRADO', maxWidth: 100, sortable: true },
      { field: 'seccion', header: 'SECCION', maxWidth: 100, sortable: true },
      { field: 'nivel', header: 'NIVEL', maxWidth: 100, sortable: true },
      { field: 'numeroDocumentoApoderado', header: 'DOCUMENTO APODERADO', maxWidth: 110, sortable: true },
      { field: 'numeroDocumentoAlumno', header: 'DOCUMENTO ALUMNO', maxWidth: 110, sortable: true },
      { field: 'estadoMatricula', header: 'ESTADO', maxWidth: 150, sortable: true },
      { field: 'fechaCreacionMatricula', header: 'FECHA CREACION', maxWidth: 150, sortable: true, type: 'date' },
    ];

    // Define las acciones disponibles para cada fila de la tabla.
    this.actions = [
      {
        name: 'continue',
        icon: ['fas', 'arrow-right'],
        tooltip: 'CONTINUAR',
        action: (item: MatriculadoDisplay) => this.continueMatricula(item),
        hoverColor: 'green',
        visible: (item: MatriculadoDisplay) => {
           const estado = item.estadoMatricula?.trim().toUpperCase();
           return estado === 'EN ESPERA';
        }
      },
      {
        name: 'print-payment',
        icon: ['fas', 'dollar-sign'],
        tooltip: 'COMPROBANTE PAGO',
        action: (item: MatriculadoDisplay) => this.viewComprobante(item, 'pago'),
        hoverColor: 'blue',
        visible: (item: MatriculadoDisplay) => {
           const estado = item.estadoMatricula?.trim().toUpperCase();
           return estado === 'COMPLETADO';
        }
      },
      {
        name: 'print-enrollment',
        icon: ['fas', 'file-alt'],
        tooltip: 'COMPROBANTE MATRICULA',
        action: (item: MatriculadoDisplay) => this.viewComprobante(item, 'matricula'),
        hoverColor: 'purple',
        visible: (item: MatriculadoDisplay) => {
           const estado = item.estadoMatricula?.trim().toUpperCase();
           return estado === 'COMPLETADO';
        }
      }
    ];
    // Carga los datos de la entidad para poblar los filtros dinámicos.
    this.cargarDatosEntidadParaFiltros();
    // Carga todas las matrículas.
    this.loadMatriculas();
  }

  /**
   * Carga los datos de la entidad (niveles, grados, secciones) para los filtros.
   */
  cargarDatosEntidadParaFiltros(): void {
    this.entidadService.obtenerEntidadList().subscribe({
      next: (entidades) => {
        if (entidades && entidades.length > 0 && entidades[0].datosngs && entidades[0].datosngs.niveles) {
          this.datosNGS = entidades[0].datosngs;
          this.nivelesParaFiltro = this.datosNGS.niveles!
            .map(n => n.nombre)
            .filter((nombre): nombre is string => !!nombre)
            .sort();
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
  }

  /**
   * Maneja el cambio en la selección del filtro de nivel.
   * Actualiza las opciones disponibles para el filtro de grado.
   */
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
      }
    }
  }

  /**
   * Maneja el cambio en la selección del filtro de grado.
   * Actualiza las opciones disponibles para el filtro de sección.
   */
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
          this.seccionesParaFiltro = [...gradoSeleccionado.secciones].sort();
        }
      }
    }
  }

  /**
   * Carga todas las matrículas desde el servicio y obtiene datos adicionales
   * para enriquecer la información mostrada en la tabla.
   */
  loadMatriculas(): void {
     this.loading = true;
     this.matriculaService.obtenerMatriculas()
       .pipe(
         switchMap(matriculas => {
           if (!matriculas || matriculas.length === 0) {
             return of([]);
           }
           // Obtiene información adicional en paralelo para cada matrícula
           const observables = matriculas.map(matricula => {
             const apoderado$ = matricula.idapoderado ? this.apoderadoService.obtenerApoderado(matricula.idapoderado).pipe(catchError(() => of(null))) : of(null);
             const alumno$ = matricula.idalumno ? this.alumnoService.obtenerAlumno(matricula.idalumno).pipe(catchError(() => of(null))) : of(null);
             const comprobante$ = matricula.idmatricula ? this.comprobanteService.obtenerComprobantePorIdMatricula(matricula.idmatricula).pipe(catchError(() => of(null))) : of(null);
             return forkJoin([of(matricula), apoderado$, alumno$, comprobante$]);
           });
           return forkJoin(observables);
         }),
         map(results => {
           // Mapea los resultados para crear el objeto MatriculadoDisplay
           return results.map(([matricula, apoderado, alumno, comprobante]) => ({
             ...matricula,
             nombre: alumno?.nombre || null,
             apellidoPaterno: alumno?.apellidoPaterno || null,
             apellidoMaterno: alumno?.apellidoMaterno || null,
             estadoMatricula: matricula.estadoMatricula || null,
             codigomatricula: comprobante?.codigomatricula || null,
             codigopago: comprobante?.codigopago || null,
             fechaCreacionMatricula: matricula?.fechaCreacion || null,
             numeroDocumentoApoderado: apoderado?.numeroDocumento || null,
             numeroDocumentoAlumno: alumno?.numeroDocumento || null,
             nivel: matricula.nivel,
             grado: matricula.grado,
             seccion: matricula.seccion,
             montoTotalComprobante: comprobante?.montototal ? parseFloat(comprobante.montototal) : undefined,
           } as MatriculadoDisplay));
         })
       )
       .subscribe({
         next: data => {
           this.allMatriculados = data;
           // Aplica filtros, ordenamiento y paginación inicial
           this.applyFiltersAndPagination(this.filters.fechaInicio || undefined, this.filters.fechaFin || undefined);
           this.loading = false;
         },
         error: err => {
           this.notificationService.showNotification('Error al cargar matrículas: ' + err.message, 'error');
           this.loading = false;
         }
       });
   }

  /**
   * Aplica los filtros, la ordenación y la paginación a la lista completa de matrículas.
   * Actualiza la lista `matriculados` que se muestra en la tabla.
   */
  applyFiltersAndPagination(fechaInicioBusqueda?: string, fechaFinBusqueda?: string): void {
    // Filtra los datos basándose en los criterios de búsqueda
    let filteredMatriculados = this.allMatriculados.filter(matricula => {
      let isMatch = true;

      // Aplicar filtros de texto (búsqueda parcial insensible a mayúsculas/minúsculas)
      if (this.filters.codigomatricula && !matricula.codigomatricula?.toLowerCase().includes(this.filters.codigomatricula.toLowerCase())) isMatch = false;
      if (this.filters.codigopago && !matricula.codigopago?.toLowerCase().includes(this.filters.codigopago.toLowerCase())) isMatch = false;

      // Aplicar filtros de nivel, grado y sección
      if (this.filters.nivel && matricula.nivel?.toLowerCase() !== this.filters.nivel.toLowerCase()) isMatch = false;
      // El grado en la matrícula es numérico, el filtro es string. Convierte para comparar.
      if (this.filters.grado && matricula.grado?.toString().toLowerCase() !== this.filters.grado.toLowerCase()) isMatch = false;
      if (this.filters.seccion && matricula.seccion?.toLowerCase() !== this.filters.seccion.toLowerCase()) isMatch = false;

      // Validar y aplicar filtro por rango de fechas
      const fechaInicioValida = fechaInicioBusqueda && this.isValidDateFormat(fechaInicioBusqueda);
      const fechaFinValida = fechaFinBusqueda && this.isValidDateFormat(fechaFinBusqueda);

      if (fechaInicioValida && fechaFinValida) {
        const fechaCreacionStr = matricula.fechaCreacionMatricula?.split('T')[0];
        // Convierte fechas a objetos Date en UTC para comparación consistente
        const fechaCreacion = fechaCreacionStr ? new Date(fechaCreacionStr + "T00:00:00Z") : null;
        const fechaInicioFilter = new Date(fechaInicioBusqueda + "T00:00:00Z");
        const fechaFinFilter = new Date(fechaFinBusqueda + "T00:00:00Z");

        if (fechaCreacion) {
            // Compara las marcas de tiempo para incluir las fechas de inicio y fin
            if (fechaCreacion.getTime() < fechaInicioFilter.getTime() || fechaCreacion.getTime() > fechaFinFilter.getTime()) {
                 isMatch = false;
            }
        } else {
          isMatch = false;
        }
      }

      return isMatch;
    });

    // Aplica la ordenación si hay un campo y dirección definidos
    if (this.currentSortField && this.currentSortDirection) {
        filteredMatriculados.sort((a, b) => {
            const fieldA = (a as any)[this.currentSortField!];
            const fieldB = (b as any)[this.currentSortField!];

            let comparison = 0;

            // Maneja valores nulos para la ordenación
            if (fieldA == null && fieldB == null) {
                comparison = 0;
            } else if (fieldA == null) {
                comparison = this.currentSortDirection === 'asc' ? -1 : 1;
            } else if (fieldB == null) {
                comparison = this.currentSortDirection === 'asc' ? 1 : -1;
            } else {
                // Compara basándose en el tipo de dato
                if (typeof fieldA === 'string' && typeof fieldB === 'string') {
                     comparison = fieldA.toLowerCase().localeCompare(fieldB.toLowerCase());
                } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
                     comparison = fieldA - fieldB;
                } else if (typeof fieldA === 'string' && typeof fieldB === 'string' && this.currentSortField === 'fechaCreacionMatricula') {
                    // Comparación específica para fechas almacenadas como string ISO
                    const dateA = new Date(fieldA);
                    const dateB = new Date(fieldB);
                    comparison = dateA.getTime() - dateB.getTime();
                }
                 else {
                    // Intento de comparación genérica
                    if (fieldA < fieldB) comparison = -1;
                    else if (fieldA > fieldB) comparison = 1;
                    else comparison = 0;
                }
            }

            // Aplica la dirección de ordenación
            return this.currentSortDirection === 'asc' ? comparison : -comparison;
        });
    }

    // Calcula el total de páginas y ajusta la página actual
    this.totalPages = Math.ceil(filteredMatriculados.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
        this.currentPage = 1;
    }

    // Aplica la paginación
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.matriculados = filteredMatriculados.slice(startIndex, endIndex);
  }

  /**
   * Valida el formato de una cadena de fecha (YYYY-MM-dd).
   */
  isValidDateFormat(dateString: string | null): boolean {
      if (!dateString) return false;
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if(!regex.test(dateString)) return false;
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  /**
   * Valida que una fecha no sea futura.
   */
  validateDateIsNotFuture(dateString: string | null): boolean {
      if (!dateString || !this.isValidDateFormat(dateString)) return true;
      const [year, month, day] = dateString.split('-').map(Number);
      const inputDateUTC = Date.UTC(year, month - 1, day);

      const today = new Date();
      const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

      return inputDateUTC <= todayUTC;
  }

  /**
   * Maneja el cambio en los campos de fecha de los filtros.
   */
  onDateChange(field: 'fechaInicio' | 'fechaFin'): void {
      const dateValue = this.filters[field];
      if (dateValue && !this.isValidDateFormat(dateValue)) {
          this.notificationService.showNotification(`Formato de ${field === 'fechaInicio' ? 'Fecha Inicio' : 'Fecha Fin'} inválido. UseYYYY-MM-dd.`, 'error');
          this.filters[field] = '';
          return;
      }
      if (dateValue && !this.validateDateIsNotFuture(dateValue)) {
          this.notificationService.showNotification(`La ${field === 'fechaInicio' ? 'Fecha Inicio' : 'Fecha Fin'} no puede ser mayor a la fecha actual.`, 'error');
          this.filters[field] = '';
      }
  }

  /**
   * Aplica los filtros y/o la ordenación a los datos.
   * Se llama al hacer clic en el botón de búsqueda o al cambiar la ordenación en la tabla.
   */
  onSearch(sortEvent?: { field: string, direction: 'asc' | 'desc' }): void {
    this.loading = true;

    // Si se recibió un evento de ordenación, actualiza el estado
    if (sortEvent) {
        this.currentSortField = sortEvent.field;
        this.currentSortDirection = sortEvent.direction;
    } else {
        // Si es un clic en el botón Buscar, reinicia la paginación
        this.currentPage = 1;
    }

    let fechaInicioBusqueda = this.filters.fechaInicio;
    let fechaFinBusqueda = this.filters.fechaFin;

    // Validaciones y lógica de rangos de fecha
    if (fechaInicioBusqueda && !this.isValidDateFormat(fechaInicioBusqueda)) {
        this.notificationService.showNotification('Formato de Fecha Inicio inválido. UseYYYY-MM-dd.', 'error');
        this.loading = false;
        return;
    }
    if (fechaFinBusqueda && !this.isValidDateFormat(fechaFinBusqueda)) {
        this.notificationService.showNotification('Formato de Fecha Fin inválido. UseYYYY-MM-dd.', 'error');
        this.loading = false;
        return;
    }

    if (fechaInicioBusqueda && !this.validateDateIsNotFuture(fechaInicioBusqueda)) {
        this.notificationService.showNotification('La Fecha Inicio no puede ser futura.', 'error');
        this.loading = false;
        return;
    }
    if (fechaFinBusqueda && !this.validateDateIsNotFuture(fechaFinBusqueda)) {
        this.notificationService.showNotification('La Fecha Fin no puede ser futura.', 'error');
        this.loading = false;
        return;
    }

    if (fechaInicioBusqueda && !fechaFinBusqueda) {
        fechaFinBusqueda = this.currentDate;
    } else if (!fechaInicioBusqueda && fechaFinBusqueda) {
        this.notificationService.showNotification('Por favor, ingrese también la Fecha Inicio para filtrar por rango.', 'error');
        this.loading = false;
        return;
    }

    if (fechaInicioBusqueda && fechaFinBusqueda) {
        const inicio = new Date(fechaInicioBusqueda + "T00:00:00Z");
        const fin = new Date(fechaFinBusqueda + "T00:00:00Z");
        if (fin.getTime() < inicio.getTime()) {
            this.notificationService.showNotification('La Fecha Fin no puede ser menor que la Fecha Inicio.', 'error');
            this.loading = false;
            return;
        }
    }

    // Aplica filtros, ordenación y paginación
    setTimeout(() => {
      this.applyFiltersAndPagination(fechaInicioBusqueda || undefined, fechaFinBusqueda || undefined);
      this.loading = false;
    }, 300);
  }

  /**
   * Maneja el evento de cambio de página de la paginación.
   */
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    let fechaInicioActiva = this.filters.fechaInicio;
    let fechaFinActiva = this.filters.fechaFin;

    if (this.filters.fechaInicio && this.isValidDateFormat(this.filters.fechaInicio) &&
        (!this.filters.fechaFin || !this.isValidDateFormat(this.filters.fechaFin))) {
        fechaFinActiva = this.currentDate;
    }
    // Aplica filtros y paginación (mantiene la ordenación actual)
    this.applyFiltersAndPagination(fechaInicioActiva || undefined, fechaFinActiva || undefined);
  }

  /**
   * Redirige para continuar un trámite de matrícula "EN ESPERA".
   */
  continueMatricula(matricula: MatriculadoDisplay): void {
    const estadoActual = matricula.estadoMatricula?.trim().toUpperCase();
    if (estadoActual === 'EN ESPERA' && matricula.idmatricula) {
      this.notificationService.showNotification(`Continuando trámite para matrícula ID: ${matricula.idmatricula}`, 'info');
      this.router.navigate(['/registrar-matricula'], {
        queryParams: {
            idMatricula: matricula.idmatricula,
            nivel: matricula.nivel,
            grado: matricula.grado
        }
      });
    } else if (!matricula.idmatricula) {
       this.notificationService.showNotification('No se pudo obtener el ID de la matrícula para continuar.', 'error');
    }
  }

  /**
   * Genera y abre directamente el PDF de un comprobante.
   */
  viewComprobante(matricula: MatriculadoDisplay, tipoComprobante: string): void {
    const estadoActual = matricula.estadoMatricula?.trim().toUpperCase();
    if (estadoActual !== 'COMPLETADO') {
      this.notificationService.showNotification(`El comprobante de ${tipoComprobante} solo está disponible para matrículas en estado 'Completado'. Estado actual: ${matricula.estadoMatricula}`, 'error');
      return;
    }

    if (!matricula.idmatricula) {
      this.notificationService.showNotification('No se pudo obtener el ID de la matrícula para generar el comprobante.', 'error');
      return;
    }

    this.loading = true;
    this.notificationService.showNotification(`Generando comprobante de ${tipoComprobante}...`, 'info');

    const monto = matricula.montoTotalComprobante;

    this.comprobanteService.generarPdfDirecto(matricula.idmatricula, tipoComprobante, monto)
      .subscribe({
        next: (blob) => {
          this.loading = false;
          if (blob.size === 0) {
            this.notificationService.showNotification(`No se pudo generar el comprobante de ${tipoComprobante}. El archivo está vacío.`, 'error');
            return;
          }
          const fileURL = URL.createObjectURL(blob);
          window.open(fileURL, '_blank');
          this.notificationService.showNotification(`Comprobante de ${tipoComprobante} generado exitosamente.`, 'success');
        },
        error: (err) => {
          this.loading = false;
          let displayMessage = `Error al generar el comprobante de ${tipoComprobante}.`;

          if (err && err.message) {
            displayMessage = err.message;
            if (err.message.includes('(500)')) {
                displayMessage += " Por favor, revise los logs del servidor o contacte al administrador.";
            }
            if (err.message.includes('(400)')) {
                 displayMessage += " Verifique los datos asociados a la matrícula.";
            }

          } else {
            displayMessage = `Ocurrió un error inesperado al generar el comprobante de ${tipoComprobante}. Intente nuevamente.`;
          }

          this.notificationService.showNotification(displayMessage, 'error');
          console.error(`Error completo al generar PDF para ${tipoComprobante}, matrícula ID ${matricula.idmatricula}:`, err);
        }
      });
  }

  /**
   * Restablece todos los filtros y la ordenación a sus valores iniciales.
   */
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

    this.applyFiltersAndPagination();
    this.notificationService.showNotification('Filtros y ordenación limpiados.', 'info');
  }

  /**
   * Exporta los datos actualmente filtrados y ordenados a un archivo Excel.
   */
  exportToExcel(): void {
    this.loading = true;

    let fechaInicioBusqueda = this.filters.fechaInicio;
    let fechaFinBusqueda = this.filters.fechaFin;
    if (fechaInicioBusqueda && this.isValidDateFormat(fechaInicioBusqueda) && (!fechaFinBusqueda || !this.isValidDateFormat(fechaFinBusqueda))) {
        fechaFinBusqueda = this.currentDate;
    }

    // Filtra todos los datos cargados según los filtros actuales
    let datosFiltradosCompletos = this.allMatriculados.filter(matricula => {
      let isMatch = true;

      if (this.filters.codigomatricula && !matricula.codigomatricula?.toLowerCase().includes(this.filters.codigomatricula.toLowerCase())) isMatch = false;
      if (this.filters.codigopago && !matricula.codigopago?.toLowerCase().includes(this.filters.codigopago.toLowerCase())) isMatch = false;
      if (this.filters.nivel && matricula.nivel?.toLowerCase() !== this.filters.nivel.toLowerCase()) isMatch = false;
      if (this.filters.grado && matricula.grado?.toString().toLowerCase() !== this.filters.grado.toLowerCase()) isMatch = false;
      if (this.filters.seccion && matricula.seccion?.toLowerCase() !== this.filters.seccion.toLowerCase()) isMatch = false;

      const fechaInicioValida = fechaInicioBusqueda && this.isValidDateFormat(fechaInicioBusqueda);
      const fechaFinValida = fechaFinBusqueda && this.isValidDateFormat(fechaFinBusqueda);

      if (fechaInicioValida && fechaFinValida) {
        const fechaCreacionStr = matricula.fechaCreacionMatricula?.split('T')[0];
        const fechaCreacion = fechaCreacionStr ? new Date(fechaCreacionStr + "T00:00:00Z") : null;
        const fechaInicioFilter = new Date(fechaInicioBusqueda + "T00:00:00Z");
        const fechaFinFilter = new Date(fechaFinBusqueda + "T00:00:00Z");

        if (fechaCreacion) {
            if (fechaCreacion.getTime() < fechaInicioFilter.getTime() || fechaCreacion.getTime() > fechaFinFilter.getTime()) {
                 isMatch = false;
            }
        } else {
          isMatch = false;
        }
      }
      return isMatch;
    });

     // Aplica la ordenación actual a los datos filtrados para la exportación
    if (this.currentSortField && this.currentSortDirection) {
        datosFiltradosCompletos.sort((a, b) => {
            const fieldA = (a as any)[this.currentSortField!];
            const fieldB = (b as any)[this.currentSortField!];

            let comparison = 0;

            if (fieldA == null && fieldB == null) {
                comparison = 0;
            } else if (fieldA == null) {
                comparison = this.currentSortDirection === 'asc' ? -1 : 1;
            } else if (fieldB == null) {
                comparison = this.currentSortDirection === 'asc' ? 1 : -1;
            } else {
                if (typeof fieldA === 'string' && typeof fieldB === 'string') {
                     comparison = fieldA.toLowerCase().localeCompare(fieldB.toLowerCase());
                } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
                     comparison = fieldA - fieldB;
                } else if (typeof fieldA === 'string' && typeof fieldB === 'string' && this.currentSortField === 'fechaCreacionMatricula') {
                    const dateA = new Date(fieldA);
                    const dateB = new Date(fieldB);
                    comparison = dateA.getTime() - dateB.getTime();
                }
                 else {
                    if (fieldA < fieldB) comparison = -1;
                    else if (fieldA > fieldB) comparison = 1;
                    else comparison = 0;
                }
            }

            return this.currentSortDirection === 'asc' ? comparison : -comparison;
        });
    }

    if (datosFiltradosCompletos.length === 0) {
        this.notificationService.showNotification('No hay datos para exportar según los filtros actuales.', 'info');
        this.loading = false;
        return;
    }

    // Prepara los datos para la exportación
    const dataToExport = datosFiltradosCompletos.map(m => {
        let fechaFormateada = '-';
        if (m.fechaCreacionMatricula) {
            const dateParts = m.fechaCreacionMatricula.split('T')[0].split('-');
            if (dateParts.length === 3) {
                fechaFormateada = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            }
        }
        return {
          'Código Matrícula': m.codigomatricula || '-',
          'Código Pago': m.codigopago || '-',
          'Grado': m.grado || '-',
          'Sección': m.seccion || '-',
          'Nivel': m.nivel || '-',
          'Documento Apoderado': m.numeroDocumentoApoderado || '-',
          'Documento Alumno': m.numeroDocumentoAlumno || '-',
          'Estado de Matrícula': m.estadoMatricula || '-',
          'Fecha de Creación': fechaFormateada
        };
    });

    // Crea la hoja de cálculo y el libro de Excel
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);

    // Ajusta el ancho de las columnas
    const columnWidths = [
      { wch: 18 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 18 }
    ];
    ws['!cols'] = columnWidths;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriculados');


    XLSX.writeFile(wb, 'matriculados_export_' + new Date().toISOString().split('T')[0] + '.xlsx');

    this.loading = false;
    this.notificationService.showNotification('Datos exportados a Excel exitosamente.', 'success');
  }
}
