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

// Importaciones para Exportar a Excel (librería xlsx)
import * as XLSX from 'xlsx';

// Interfaz para la configuración de acciones en la tabla
export interface ActionConfig {
  name: string;
  icon: any;
  tooltip: string;
  action: (item: MatriculadoDisplay) => void;
  hoverColor?: string;
  visible?: (item: MatriculadoDisplay) => boolean;
}

// Interfaz para mostrar los datos de matrícula con información adicional
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
  loading = false; // Indica si se está cargando información
  matriculados: MatriculadoDisplay[] = []; // Matrículas mostradas en la tabla (después de filtros y paginación)
  allMatriculados: MatriculadoDisplay[] = []; // Todas las matrículas cargadas
  columns: ColumnConfig[] = []; // Configuración de las columnas de la tabla
  actions: ActionConfig[] = []; // Configuración de las acciones por fila
  currentPage: number = 1; // Página actual de la paginación
  totalPages: number = 1; // Total de páginas para la paginación
  pageSize: number = 5; // Cantidad de registros por página
  maxPaginationSize: number = 7; // Tamaño máximo de los controles de paginación
  currentDate: string; // Fecha actual en formatoYYYY-MM-DD para validación de fechas

  niveles = ['Primaria', 'Secundaria']; // Opciones para el filtro de nivel
  grados: string[] = []; // Opciones para el filtro de grado (depende del nivel)
  secciones = ['A', 'B', 'C', 'D']; // Opciones para el filtro de sección

  // Objeto para almacenar los valores de los filtros
  filters = {
    codigomatricula: '',
    codigopago: '',
    grado: '',
    seccion: '',
    nivel: '',
    fechaInicio: '' as string,
    fechaFin: '' as string
  };

  constructor(
    private router: Router,
    private matriculaService: MatriculaService,
    private comprobanteService: ComprobanteService,
    private apoderadoService: ApoderadoService,
    private alumnoService: AlumnoService,
    private library: FaIconLibrary, // Para usar iconos de Font Awesome
    private notificationService: NotificationService // Servicio para mostrar notificaciones
  ) {
    // Añadir iconos a la librería de Font Awesome
    this.library.addIcons(
        faArrowRight, faDollarSign, faFileAlt, faExclamationTriangle,
        faSearch, faBroom, faFileExcel
    );
    // Obtener la fecha actual y formatearla aYYYY-MM-DD
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayLocal = new Date(today.getTime() - (offset*60*1000));
    this.currentDate = todayLocal.toISOString().split('T')[0];
  }

  ngOnInit() {
    // Configuración inicial de las columnas de la tabla
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

    // Configuración de las acciones disponibles en cada fila de la tabla
    this.actions = [
      {
        name: 'continue',
        icon: ['fas', 'arrow-right'],
        tooltip: 'CONTINUAR',
        action: (item: MatriculadoDisplay) => this.continueMatricula(item),
        hoverColor: 'green',
        visible: (item: MatriculadoDisplay) => {
           const estado = item.estadoMatricula?.trim().toUpperCase();
           return estado === 'EN ESPERA'; // Visible solo si el estado es EN ESPERA
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
           return estado === 'COMPLETADO'; // Visible solo si el estado es COMPLETADO
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
           return estado === 'COMPLETADO'; // Visible solo si el estado es COMPLETADO
        }
      }
    ];
    // Cargar las matrículas al inicializar el componente
    this.loadMatriculas();
  }

  // Carga las matrículas desde el servicio y obtiene información adicional (apoderado, alumno, comprobante)
  loadMatriculas(): void {
     this.loading = true; // Activar spinner de carga
     this.matriculaService.obtenerMatriculas()
       .pipe(
         switchMap(matriculas => {
           if (!matriculas || matriculas.length === 0) { // Si no hay matrículas
             this.notificationService.showNotification('No hay matrículas registradas en el sistema.', 'info');
             return of([]); // Retorna un observable vacío
           }
           // Para cada matrícula, obtener información adicional en paralelo
           const observables = matriculas.map(matricula => {
             const apoderado$ = matricula.idapoderado ? this.apoderadoService.obtenerApoderado(matricula.idapoderado).pipe(catchError(() => of(null))) : of(null);
             const alumno$ = matricula.idalumno ? this.alumnoService.obtenerAlumno(matricula.idalumno).pipe(catchError(() => of(null))) : of(null);
             const comprobante$ = matricula.idmatricula ? this.comprobanteService.obtenerComprobantePorIdMatricula(matricula.idmatricula).pipe(catchError(() => of(null))) : of(null);
             return forkJoin([of(matricula), apoderado$, alumno$, comprobante$]);
           });
           return forkJoin(observables); // Esperar a que todas las llamadas se completen
         }),
         map(results => {
           // Mapear los resultados para crear el objeto MatriculadoDisplay
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
           }));
         })
       )
       .subscribe({
         next: data => {
           this.allMatriculados = data; // Almacenar todas las matrículas con información adicional
           // Aplicar filtros y paginación inicial
           this.applyFiltersAndPagination(this.filters.fechaInicio || undefined, this.filters.fechaFin || undefined);
           this.loading = false; // Desactivar spinner
         },
         error: err => {
           this.notificationService.showNotification('Error al cargar matrículas: ' + err.message, 'error');
           this.loading = false; // Desactivar spinner en caso de error
         }
       });
   }

  // Aplica los filtros y la paginación a la lista de matrículas
  applyFiltersAndPagination(fechaInicioBusqueda?: string, fechaFinBusqueda?: string): void {
    let filteredMatriculados = this.allMatriculados.filter(matricula => {
      let isMatch = true; // Bandera para verificar si la matrícula coincide con los filtros

      // Filtrar por código de matrícula (búsqueda parcial insensible a mayúsculas/minúsculas)
      if (this.filters.codigomatricula && !matricula.codigomatricula?.toLowerCase().includes(this.filters.codigomatricula.toLowerCase())) isMatch = false;
      // Filtrar por código de pago (búsqueda parcial insensible a mayúsculas/minúsculas)
      if (this.filters.codigopago && !matricula.codigopago?.toLowerCase().includes(this.filters.codigopago.toLowerCase())) isMatch = false;
      // Filtrar por nivel (comparación exacta insensible a mayúsculas/minúsculas)
      if (this.filters.nivel && matricula.nivel?.toLowerCase() !== this.filters.nivel.toLowerCase()) isMatch = false;
      // Filtrar por grado (comparación exacta)
      if (this.filters.grado && matricula.grado?.toString() !== this.filters.grado) isMatch = false;
      // Filtrar por sección (comparación exacta insensible a mayúsculas/minúsculas)
      if (this.filters.seccion && matricula.seccion?.toLowerCase() !== this.filters.seccion.toLowerCase()) isMatch = false;

      // Validar y aplicar filtro por rango de fechas
      const fechaInicioValida = fechaInicioBusqueda && this.isValidDateFormat(fechaInicioBusqueda);
      const fechaFinValida = fechaFinBusqueda && this.isValidDateFormat(fechaFinBusqueda);

      if (fechaInicioValida && fechaFinValida) {
        const fechaCreacionStr = matricula.fechaCreacionMatricula?.split('T')[0];
        // Convertir fechas a objetos Date en UTC para comparación consistente
        const fechaCreacion = fechaCreacionStr ? new Date(fechaCreacionStr + "T00:00:00Z") : null;
        const fechaInicioFilter = new Date(fechaInicioBusqueda + "T00:00:00Z");
        const fechaFinFilter = new Date(fechaFinBusqueda + "T00:00:00Z");

        if (fechaCreacion) {
            // Comparar las fechas (año, mes, día)
            if (fechaCreacion.getUTCFullYear() < fechaInicioFilter.getUTCFullYear() ||
                (fechaCreacion.getUTCFullYear() === fechaInicioFilter.getUTCFullYear() && fechaCreacion.getUTCMonth() < fechaInicioFilter.getUTCMonth()) ||
                (fechaCreacion.getUTCFullYear() === fechaInicioFilter.getUTCFullYear() && fechaCreacion.getUTCMonth() === fechaInicioFilter.getUTCMonth() && fechaCreacion.getUTCDate() < fechaInicioFilter.getUTCDate())
            ) {
                isMatch = false; // La fecha de creación es anterior al inicio del rango
            }

            if (fechaCreacion.getUTCFullYear() > fechaFinFilter.getUTCFullYear() ||
                (fechaCreacion.getUTCFullYear() === fechaFinFilter.getUTCFullYear() && fechaCreacion.getUTCMonth() > fechaFinFilter.getUTCMonth()) ||
                (fechaCreacion.getUTCFullYear() === fechaFinFilter.getUTCFullYear() && fechaCreacion.getUTCMonth() === fechaFinFilter.getUTCMonth() && fechaCreacion.getUTCDate() > fechaFinFilter.getUTCDate())
            ) {
                 isMatch = false; // La fecha de creación es posterior al fin del rango
            }
        } else {
          isMatch = false; // Si no hay fecha de creación, no coincide con el filtro de fecha
        }
      }

      return isMatch; // Retorna true si la matrícula pasa todos los filtros
    });

    // Mostrar notificación si no se encontraron resultados con los filtros aplicados
    if (filteredMatriculados.length === 0 && (this.filters.codigomatricula || this.filters.codigopago || this.filters.nivel || this.filters.grado || this.filters.seccion || (fechaInicioBusqueda && fechaFinBusqueda) )) {
        this.notificationService.showNotification('No se encontraron matrículas con los criterios de búsqueda aplicados.', 'info');
    }

    // Calcular total de páginas y ajustar la página actual si es necesario
    this.totalPages = Math.ceil(filteredMatriculados.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
        this.currentPage = 1;
    }

    // Aplicar paginación
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.matriculados = filteredMatriculados.slice(startIndex, endIndex);
  }

  // Valida que una cadena de fecha tenga el formatoYYYY-MM-DD
  isValidDateFormat(dateString: string | null): boolean {
      if (!dateString) return false;
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if(!regex.test(dateString)) return false;
      // Crear fecha en UTC para evitar problemas de zona horaria al validar
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day)); // Mes es 0-indexado en Date
      // Validar que los componentes de la fecha parseada coincidan con los originales
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  // Valida que una fecha no sea futura
  validateDateIsNotFuture(dateString: string | null): boolean {
      if (!dateString || !this.isValidDateFormat(dateString)) return true;
      // Crear fechas en UTC para comparación consistente
      const [year, month, day] = dateString.split('-').map(Number);
      const inputDateUTC = Date.UTC(year, month - 1, day);

      const today = new Date();
      const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

      return inputDateUTC <= todayUTC;
  }

  // Maneja el evento de cambio en los campos de fecha
  onDateChange(field: 'fechaInicio' | 'fechaFin'): void {
      const dateValue = this.filters[field];
      if (dateValue && !this.isValidDateFormat(dateValue)) {
          this.notificationService.showNotification(`Formato de ${field === 'fechaInicio' ? 'Fecha Inicio' : 'Fecha Fin'} inválido. UseYYYY-MM-DD.`, 'error');
          this.filters[field] = ''; // Limpiar si el formato es incorrecto
          return;
      }
      if (dateValue && !this.validateDateIsNotFuture(dateValue)) {
          this.notificationService.showNotification(`La ${field === 'fechaInicio' ? 'Fecha Inicio' : 'Fecha Fin'} no puede ser mayor a la fecha actual.`, 'error');
          this.filters[field] = ''; // Limpiar si la fecha es futura
      }
  }

  // Aplica los filtros al hacer clic en el botón de búsqueda
  onSearch(): void {
    this.loading = true; // Activar spinner
    this.currentPage = 1; // Reiniciar a la primera página

    let fechaInicioBusqueda = this.filters.fechaInicio;
    let fechaFinBusqueda = this.filters.fechaFin;

    // 1. Validar formato de Fecha Inicio si existe
    if (fechaInicioBusqueda && !this.isValidDateFormat(fechaInicioBusqueda)) {
        this.notificationService.showNotification('Formato de Fecha Inicio inválido. UseYYYY-MM-DD.', 'error');
        this.loading = false;
        return;
    }
    // 2. Validar formato de Fecha Fin si existe
    if (fechaFinBusqueda && !this.isValidDateFormat(fechaFinBusqueda)) {
        this.notificationService.showNotification('Formato de Fecha Fin inválido. UseYYYY-MM-DD.', 'error');
        this.loading = false;
        return;
    }

    // 3. Validar que Fecha Inicio no sea futura si existe y es válida
    if (fechaInicioBusqueda && !this.validateDateIsNotFuture(fechaInicioBusqueda)) {
        this.notificationService.showNotification('La Fecha Inicio no puede ser futura.', 'error');
        this.loading = false;
        return;
    }
    // 4. Validar que Fecha Fin no sea futura si existe y es válida
    if (fechaFinBusqueda && !this.validateDateIsNotFuture(fechaFinBusqueda)) {
        this.notificationService.showNotification('La Fecha Fin no puede ser futura.', 'error');
        this.loading = false;
        return;
    }

    // 5. Lógica de rangos
    if (fechaInicioBusqueda && !fechaFinBusqueda) {
        // Si solo hay fecha de inicio válida, buscar hasta la fecha actual
        fechaFinBusqueda = this.currentDate; // currentDate ya está enYYYY-MM-DD
        this.notificationService.showNotification(`Buscando desde ${fechaInicioBusqueda} hasta la fecha actual (${fechaFinBusqueda}).`, 'info');
    } else if (!fechaInicioBusqueda && fechaFinBusqueda) {
        // Si solo hay fecha de fin válida, es un error, se necesita fecha de inicio
        this.notificationService.showNotification('Por favor, ingrese también la Fecha Inicio para filtrar por rango.', 'error');
        this.loading = false;
        return;
    }

    // 6. Validar que fecha fin no sea menor que fecha inicio (solo si ambas son válidas)
    if (fechaInicioBusqueda && fechaFinBusqueda) {
        const inicio = new Date(fechaInicioBusqueda + "T00:00:00Z"); // Usar UTC para evitar problemas de zona horaria en la comparación
        const fin = new Date(fechaFinBusqueda + "T00:00:00Z");
        // Comparar las marcas de tiempo. Si fin es estrictamente menor que inicio, mostrar error.
        if (fin.getTime() < inicio.getTime()) {
            this.notificationService.showNotification('La Fecha Fin no puede ser menor que la Fecha Inicio.', 'error');
            this.loading = false;
            return;
        }
    }

    // Si todas las validaciones pasan, proceder con el filtrado
    setTimeout(() => {
      this.applyFiltersAndPagination(fechaInicioBusqueda || undefined, fechaFinBusqueda || undefined);
      this.loading = false; // Desactivar spinner
    }, 300); // Pequeño retraso para permitir que el spinner se muestre
  }

  // Maneja el cambio de página en la paginación
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    let fechaInicioActiva = this.filters.fechaInicio;
    let fechaFinActiva = this.filters.fechaFin;

    // Si solo hay fecha de inicio, usar la fecha actual como fin para la paginación
    if (this.filters.fechaInicio && this.isValidDateFormat(this.filters.fechaInicio) &&
        (!this.filters.fechaFin || !this.isValidDateFormat(this.filters.fechaFin))) {
        fechaFinActiva = this.currentDate;
    }
    // Aplicar filtros y paginación con las fechas activas
    this.applyFiltersAndPagination(fechaInicioActiva || undefined, fechaFinActiva || undefined);
  }

  // Maneja el cambio en el filtro de nivel para actualizar las opciones de grado
  onNivelChange(): void {
    this.filters.grado = ''; // Limpiar el grado al cambiar el nivel
    this.filters.seccion = ''; // Limpiar la sección al cambiar el nivel
    if (this.filters.nivel === 'Primaria') {
      this.grados = ['1', '2', '3', '4', '5', '6'];
    } else if (this.filters.nivel === 'Secundaria') {
      this.grados = ['1', '2', '3', '4', '5'];
    } else {
      this.grados = []; // Vaciar grados si no se selecciona nivel
    }
  }

  // Acción para continuar un trámite de matrícula en estado "EN ESPERA"
  continueMatricula(matricula: MatriculadoDisplay): void {
    const estadoActual = matricula.estadoMatricula?.trim().toUpperCase();
    if (estadoActual === 'EN ESPERA' && matricula.idmatricula) {
      this.notificationService.showNotification(`Continuando trámite para matrícula ID: ${matricula.idmatricula}`, 'info'); // Notificación de acción
      // Navegar a la página de registro de matrícula con los parámetros necesarios
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

  // Acción para ver un comprobante (de pago o matrícula)
  viewComprobante(matricula: MatriculadoDisplay, tipo: 'pago' | 'matricula'): void {
     const estadoActual = matricula.estadoMatricula?.trim().toUpperCase();
     if (estadoActual === 'COMPLETADA' && matricula.idmatricula) {
       this.notificationService.showNotification(`Viendo comprobante de ${tipo} para matrícula ID: ${matricula.idmatricula}`, 'info'); // Notificación de acción
       // Navegar a la página de comprobantes con los parámetros necesarios
       this.router.navigate(['/comprobantes'], {
         queryParams: { idMatricula: matricula.idmatricula, nivel: matricula.nivel, tipoComprobante: tipo } // Añadido tipoComprobante para el destino
       });
     } else if (!matricula.idmatricula) {
        this.notificationService.showNotification('No se pudo obtener el ID de la matrícula para ver el comprobante.', 'error');
     }
  }

  // Restablece todos los filtros a sus valores iniciales
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
    this.grados = []; // Vaciar grados
    this.currentPage = 1; // Reiniciar a la primera página
    this.applyFiltersAndPagination(); // Aplicar filtros (sin ninguno, muestra todos)
    this.notificationService.showNotification('Filtros limpiados.', 'info'); // Notificación de acción
  }

  // Exporta los datos filtrados actualmente a un archivo Excel con mejor diseño
  exportToExcel(): void {
    this.loading = true; // Activar spinner

    // Determinar el rango de fechas para la exportación si se aplicaron filtros de fecha
    let fechaInicioBusqueda = this.filters.fechaInicio;
    let fechaFinBusqueda = this.filters.fechaFin;
    if (fechaInicioBusqueda && this.isValidDateFormat(fechaInicioBusqueda) && (!fechaFinBusqueda || !this.isValidDateFormat(fechaFinBusqueda))) {
        fechaFinBusqueda = this.currentDate; // Si solo hay fecha de inicio, usar la fecha actual como fin
    }

    // Filtrar todos los datos cargados según los filtros actuales
    let datosFiltradosCompletos = this.allMatriculados.filter(matricula => {
      let isMatch = true; // Bandera para verificar si la matrícula coincide con los filtros

      // Aplicar filtros de texto, nivel, grado y sección
      if (this.filters.codigomatricula && !matricula.codigomatricula?.toLowerCase().includes(this.filters.codigomatricula.toLowerCase())) isMatch = false;
      if (this.filters.codigopago && !matricula.codigopago?.toLowerCase().includes(this.filters.codigopago.toLowerCase())) isMatch = false;
      if (this.filters.nivel && matricula.nivel?.toLowerCase() !== this.filters.nivel.toLowerCase()) isMatch = false;
      if (this.filters.grado && matricula.grado?.toString() !== this.filters.grado) isMatch = false;
      if (this.filters.seccion && matricula.seccion?.toLowerCase() !== this.filters.seccion.toLowerCase()) isMatch = false;

      // Aplicar filtro de rango de fechas si ambas fechas son válidas
      const fechaInicioValida = fechaInicioBusqueda && this.isValidDateFormat(fechaInicioBusqueda);
      const fechaFinValida = fechaFinBusqueda && this.isValidDateFormat(fechaFinBusqueda);

      if (fechaInicioValida && fechaFinValida) {
        const fechaCreacionStr = matricula.fechaCreacionMatricula?.split('T')[0];
        const fechaCreacion = fechaCreacionStr ? new Date(fechaCreacionStr + "T00:00:00Z") : null;
        const fechaInicioFilter = new Date(fechaInicioBusqueda + "T00:00:00Z");
        const fechaFinFilter = new Date(fechaFinBusqueda + "T00:00:00Z");

        if (fechaCreacion) {
            // Comparar las marcas de tiempo para incluir las fechas de inicio y fin
            if (fechaCreacion.getTime() < fechaInicioFilter.getTime() || fechaCreacion.getTime() > fechaFinFilter.getTime()) {
                 isMatch = false;
            }
        } else {
          isMatch = false; // Si no hay fecha de creación, no coincide con el filtro de fecha
        }
      }
      return isMatch; // Retorna true si la matrícula pasa todos los filtros
    });

    // Mostrar notificación si no hay datos para exportar
    if (datosFiltradosCompletos.length === 0) {
        this.notificationService.showNotification('No hay datos para exportar según los filtros actuales.', 'info');
        this.loading = false; // Desactivar spinner
        return;
    }

    // Preparar los datos para la exportación con encabezados más amigables y formato de fecha
    const dataToExport = datosFiltradosCompletos.map(m => {
        let fechaFormateada = '-';
        if (m.fechaCreacionMatricula) {
            const dateParts = m.fechaCreacionMatricula.split('T')[0].split('-'); // FormatoYYYY-MM-DD
            if (dateParts.length === 3) {
                fechaFormateada = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // Formato DD/MM/YYYY
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

    // Crear la hoja de cálculo
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);

    // Opcional: Ajustar el ancho de las columnas para un mejor diseño en Excel
    const columnWidths = [
      { wch: 18 }, // Código Matrícula (aumentado)
      { wch: 15 }, // Código Pago
      { wch: 10 }, // Grado
      { wch: 10 }, // Sección
      { wch: 10 }, // Nivel
      { wch: 22 }, // Documento Apoderado (aumentado)
      { wch: 22 }, // Documento Alumno (aumentado)
      { wch: 20 }, // Estado de Matrícula
      { wch: 18 }  // Fecha de Creación
    ];
    ws['!cols'] = columnWidths;

    // Crear el libro de Excel y añadir la hoja
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriculados'); // Añadir la hoja al libro

    // Escribir y descargar el archivo Excel
    XLSX.writeFile(wb, 'matriculados_export_' + new Date().toISOString().split('T')[0] + '.xlsx');

    this.loading = false; // Desactivar spinner
    this.notificationService.showNotification('Datos exportados a Excel exitosamente.', 'success'); // Notificación de éxito
  }
}
