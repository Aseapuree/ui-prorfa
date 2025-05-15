import { NotificationComponent } from './../../../campus/components/shared/notificaciones/notification.component';
import { NotificationService } from './../../../campus/components/shared/notificaciones/notification.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableComponent, ColumnConfig } from './../../../general/components/table/table.component';
import { MatriculaService } from './../../services/matricula.service';
import { Matricula } from './../../interfaces/DTOMatricula';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faDollarSign, faFileAlt, faExclamationTriangle, faSearch, faBroom } from '@fortawesome/free-solid-svg-icons';
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

// Interfaz para la configuración de acciones en la tabla
export interface ActionConfig {
  name: string;
  icon: any;
  tooltip: string;
  action: (item: any) => void;
  hoverColor?: string;
  visible?: (item: any) => boolean;
}

// Interfaz para mostrar los datos de matrícula con información adicional
export interface MatriculadoDisplay extends Matricula {
  nombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  alumno?: Alumno;
  codigomatricula?: string | null;
  codigopago?: string | null;
  fechaCreacionComprobante?: string | null; // Fecha de creación del comprobante
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
  loading = false; // Indicador de carga
  matriculados: MatriculadoDisplay[] = []; // Matrículas a mostrar en la tabla
  allMatriculados: MatriculadoDisplay[] = []; // Todas las matrículas cargadas
  columns: ColumnConfig[] = []; // Configuración de columnas de la tabla
  actions: ActionConfig[] = []; // Configuración de acciones de la tabla
  currentPage: number = 1; // Página actual de la paginación
  totalPages: number = 1; // Total de páginas para la paginación
  pageSize: number = 5; // Cantidad de elementos por página
  maxPaginationSize: number = 7; // Tamaño máximo de los controles de paginación
  currentDate: string; // Fecha actual en formatoYYYY-MM-DD

  // Propiedades para filtros de Nivel, Grado, Sección y Fechas
  niveles = ['Primaria', 'Secundaria']; // Opciones de niveles
  grados: string[] = []; // Opciones de grados (depende del nivel)
  secciones = ['A', 'B', 'C', 'D']; // Opciones de secciones

  // Objeto para almacenar los valores de los filtros
  filters = {
    codigomatricula: '',
    codigopago: '',
    grado: '',
    seccion: '',
    nivel: '',
    fechaInicio: '' as string, // Campo para el filtro de rango - Fecha Inicio
    fechaFin: '' as string // Campo para el filtro de rango - Fecha Fin
  };

  constructor(
    private router: Router,
    private matriculaService: MatriculaService,
    private comprobanteService: ComprobanteService,
    private apoderadoService: ApoderadoService,
    private alumnoService: AlumnoService,
    private library: FaIconLibrary,
    private notificationService: NotificationService // Servicio de notificaciones
  ) {
    // Agregar iconos de Font Awesome a la biblioteca
    this.library.addIcons(faArrowRight, faDollarSign, faFileAlt, faExclamationTriangle, faSearch, faBroom);
    // Obtener la fecha actual en formatoYYYY-MM-DD para el atributo max y validación
    this.currentDate = new Date().toISOString().split('T')[0];
  }

  async ngOnInit() {
    // Configuración de las columnas de la tabla
    this.columns = [
      { field: 'codigomatricula', header: 'CODIGO MATRICULA', maxWidth: 150, sortable: true },
      { field: 'codigopago', header: 'CODIGO PAGO', maxWidth: 150, sortable: true },
      { field: 'grado', header: 'GRADO', maxWidth: 100, sortable: true },
      { field: 'seccion', header: 'SECCION', maxWidth: 100, sortable: true },
      { field: 'nivel', header: 'NIVEL', maxWidth: 100, sortable: true },
      { field: 'numeroDocumentoApoderado', header: 'DOCUMENTO APODERADO', maxWidth: 110, sortable: true },
      { field: 'numeroDocumentoAlumno', header: 'DOCUMENTO ALUMNO', maxWidth: 110, sortable: true },
      { field: 'estadoMatricula', header: 'ESTADO', maxWidth: 150, sortable: true },
      { field: 'fechaCreacionComprobante', header: 'FECHA CREACION', maxWidth: 150, sortable: true, type: 'date' },
    ];

    // Configuración de las acciones de la tabla
    this.actions = [
      {
        name: 'continue',
        icon: ['fas', 'arrow-right'],
        tooltip: 'CONTINUAR',
        action: (item: MatriculadoDisplay) => this.continueMatricula(item),
        hoverColor: 'green',
        // Mostrar solo si el estado es "EN PROCESO" (robusto a espacios y mayúsculas/minúsculas)
        visible: (item: MatriculadoDisplay) => {
           // Usar trim() y toUpperCase() para una comparación más robusta
           const estado = item.estadoMatricula?.trim().toUpperCase();
           return estado === 'EN PROCESO';
        }
      },
      {
        name: 'print-payment',
        icon: ['fas', 'dollar-sign'],
        tooltip: 'COMPROBANTE DE PAGO',
        action: (item: MatriculadoDisplay) => this.imprimirComprobantePago(item),
        hoverColor: 'blue',
        // Mostrar solo si el estado es "COMPLETADA" (robusto a espacios y mayúsculas/minúsculas)
        visible: (item: MatriculadoDisplay) => {
           // Usar trim() y toUpperCase() para una comparación más robusta
           const estado = item.estadoMatricula?.trim().toUpperCase();
           return estado === 'COMPLETADA';
        }
      },
      {
        name: 'print-enrollment',
        icon: ['fas', 'file-alt'],
        tooltip: 'COMPROBANTE DE MATRICULA',
        action: (item: MatriculadoDisplay) => this.imprimirComprobanteMatricula(item),
        hoverColor: 'purple',
        // Mostrar solo si el estado es "COMPLETADA" (robusto a espacios y mayúsculas/minúsculas)
        visible: (item: MatriculadoDisplay) => {
           // Usar trim() y toUpperCase() para una comparación más robusta
           const estado = item.estadoMatricula?.trim().toUpperCase();
           return estado === 'COMPLETADA';
        }
      }
    ];

    // Cargar las matrículas al inicializar el componente
    this.loadMatriculas();
  }

  // Método para cargar las matrículas desde el servicio
  loadMatriculas(): void {
     this.loading = true; // Activar indicador de carga
     this.matriculaService.obtenerMatriculas()
       .pipe(
         switchMap(matriculas => {
           if (matriculas.length === 0) {
             return of([]); // Si no hay matrículas, retornar un observable vacío
           }
           // Para cada matrícula, obtener información adicional (apoderado, alumno, comprobante)
           const observables = matriculas.map(matricula => {
             const apoderado$ = matricula.idapoderado ? this.apoderadoService.obtenerApoderado(matricula.idapoderado).pipe(
               catchError(() => of(null)) // Manejar error si no se encuentra apoderado
             ) : of(null);
             const alumno$ = matricula.idalumno ? this.alumnoService.obtenerAlumno(matricula.idalumno).pipe(
               catchError(() => of(null)) // Manejar error si no se encuentra alumno
             ) : of(null);
             const comprobante$ = matricula.idmatricula ? this.comprobanteService.obtenerComprobantePorIdMatricula(matricula.idmatricula).pipe(
               catchError(() => of(null)) // Manejar error si no se encuentra comprobante
             ) : of(null);

             // Combinar los resultados en un solo observable
             return forkJoin([of(matricula), apoderado$, alumno$, comprobante$]);
           });
           // Esperar a que todos los observables se completen
           return forkJoin(observables);
         }),
         // Mapear los resultados combinados a la estructura MatriculadoDisplay
         map(results => {
           return results.map(([matricula, apoderado, alumno, comprobante]) => ({
             ...matricula,
             nombre: alumno?.nombre || null,
             apellidoPaterno: alumno?.apellidoPaterno || null,
             apellidoMaterno: alumno?.apellidoMaterno || null,
             estadoMatricula: matricula.estadoMatricula || null,
             codigomatricula: comprobante?.codigomatricula || null,
             codigopago: comprobante?.codigopago || null,
             fechaCreacionComprobante: comprobante?.fechaCreacion || null,
             numeroDocumentoApoderado: apoderado?.numeroDocumento || null,
             numeroDocumentoAlumno: alumno?.numeroDocumento || null,
           }));
         })
       )
       .subscribe({
         next: data => {
           this.allMatriculados = data; // Almacenar todas las matrículas
           this.applyFiltersAndPagination(); // Aplicar filtros y paginación inicial
           this.loading = false; // Desactivar indicador de carga
         },
         error: err => {
           this.notificationService.showNotification('Error al cargar matrículas: ' + err.message, 'error');
           this.loading = false; // Desactivar indicador de carga en caso de error
         }
       });
   }

  // Método para aplicar filtros y paginación a las matrículas
  applyFiltersAndPagination(): void {
    let filteredMatriculados = this.allMatriculados.filter(matricula => {
      let isMatch = true;

      // Filtrar por Código Matrícula
      if (this.filters.codigomatricula && !matricula.codigomatricula?.includes(this.filters.codigomatricula)) {
        isMatch = false;
      }

      // Filtrar por Código Pago
      if (this.filters.codigopago && !matricula.codigopago?.includes(this.filters.codigopago)) {
        isMatch = false;
      }

      // Filtrar por Nivel, Grado y Sección
      if (this.filters.nivel && matricula.nivel?.toLowerCase() !== this.filters.nivel.toLowerCase()) {
        isMatch = false;
      }
      if (this.filters.grado && matricula.grado?.toString() !== this.filters.grado) {
        isMatch = false;
      }
      if (this.filters.seccion && matricula.seccion?.toLowerCase() !== this.filters.seccion.toLowerCase()) {
        isMatch = false;
      }

      // Filtrar por rango de fecha de creación SOLO si ambos campos de fecha están llenos y son válidos
      if (this.filters.fechaInicio && this.filters.fechaFin && this.isValidDateFormat(this.filters.fechaInicio) && this.isValidDateFormat(this.filters.fechaFin)) {
          const fechaCreacion = matricula.fechaCreacionComprobante ? new Date(matricula.fechaCreacionComprobante) : null;
          const fechaInicioFilter = new Date(this.filters.fechaInicio);
          const fechaFinFilter = new Date(this.filters.fechaFin);

          if (fechaCreacion) {
              if (fechaCreacion < fechaInicioFilter) {
                  isMatch = false;
              }
              const fechaFinAdjusted = new Date(fechaFinFilter);
              fechaFinAdjusted.setDate(fechaFinAdjusted.getDate() + 1); // Incluir la fecha de fin en el rango
              if (fechaCreacion >= fechaFinAdjusted) {
                  isMatch = false;
              }
          } else {
              // Si no hay fecha de creación en la matrícula, no coincide si se ha aplicado un filtro de fecha
              isMatch = false;
          }
      } else {
          // Si uno o ambos campos de fecha están vacíos o el formato es inválido, no se aplica el filtro de rango de fecha.
          // La condición isMatch se mantiene según los otros filtros.
      }


      return isMatch;
    });

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

  // Método para validar si una cadena de fecha tiene el formatoYYYY-MM-DD
  isValidDateFormat(dateString: string | null): boolean {
      if (!dateString) {
          return false; // Cadena vacía no es formato válido
      }
      // Expresión regular para verificar el formatoYYYY-MM-DD
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      return regex.test(dateString);
  }


  // Método para validar si una cadena de fecha no es futura
  validateDate(dateString: string | null): boolean {
      if (!dateString) {
          return true; // No se ingresó fecha, se considera válido (esta validación se hace después del formato)
      }
      const inputDate = new Date(dateString);
      const today = new Date(this.currentDate);
      // Establecer la hora a 00:00:00 para una comparación de fechas precisa
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      return inputDate <= today;
  }

  // Manejador para el evento change de los inputs de fecha
  onDateChange(field: 'fechaInicio' | 'fechaFin'): void {
      const dateValue = this.filters[field];

      // Primero, validar el formato completo (YYYY-MM-DD) si hay algo ingresado
      if (dateValue && !this.isValidDateFormat(dateValue)) {
          this.notificationService.showNotification(`Por favor, ingrese una fecha completa en formato Año-Mes-Día.`, 'error');
          this.filters[field] = ''; // Limpiar fecha inválida
          return; // Detener la validación si el formato es incorrecto
      }

      // Luego, validar que la fecha no sea futura si el formato es válido
      if (dateValue && !this.validateDate(dateValue)) {
          this.notificationService.showNotification(`La ${field === 'fechaInicio' ? 'Fecha Inicio' : 'Fecha Fin'} no puede ser mayor a la fecha actual.`, 'error');
          this.filters[field] = ''; // Limpiar fecha inválida
      }
      // No se llama a applyFiltersAndPagination aquí.
      // El filtrado se realiza al hacer clic en el botón Buscar.
  }


  // Método llamado al hacer clic en el botón Buscar
  onSearch(): void {
    // Validar que ambos campos de fecha estén llenos si se intenta filtrar por rango
    if ((this.filters.fechaInicio && !this.filters.fechaFin) || (!this.filters.fechaInicio && this.filters.fechaFin)) {
        this.notificationService.showNotification('Por favor, ingrese tanto la Fecha Inicio como la Fecha Fin para filtrar por rango de fechas.', 'error');
        return; // No aplicar filtros si solo un campo de fecha está lleno
    }

    // Validar rangos de fecha antes de aplicar filtros (redundante si se usa onDateChange, pero útil por seguridad)
    if (this.filters.fechaInicio && !this.validateDate(this.filters.fechaInicio)) {
        this.notificationService.showNotification('La Fecha Inicio no puede ser mayor a la fecha actual.', 'error');
        this.filters.fechaInicio = ''; // Limpiar fecha inválida
        return;
    }
     if (this.filters.fechaFin && !this.validateDate(this.filters.fechaFin)) {
        this.notificationService.showNotification('La Fecha Fin no puede ser mayor a la fecha actual.', 'error');
        this.filters.fechaFin = ''; // Limpiar fecha inválida
        return;
    }

    // Validar que la fecha de fin no sea anterior a la fecha de inicio SOLO si ambos campos están llenos
    if (this.filters.fechaInicio && this.filters.fechaFin) {
        const fechaInicio = new Date(this.filters.fechaInicio);
        const fechaFin = new Date(this.filters.fechaFin);
        if (fechaFin < fechaInicio) {
            this.notificationService.showNotification('La fecha fin no puede ser menor que la fecha inicio.', 'error');
            return; // No aplicar filtros si la validación falla
        }
    }


    // Activar spinner y aplicar filtros/paginación con un retardo de 1 segundo
    this.loading = true;
    this.currentPage = 1; // Reiniciar a la primera página al buscar

    // Usar setTimeout para permitir que la UI actualice el estado del spinner
    setTimeout(() => {
      this.applyFiltersAndPagination(); // Aplicar filtros y paginación
      this.loading = false; // Desactivar spinner después de aplicar filtros
    }, 1000); // Retardo de 1000ms (1 segundo)
  }

  // Método llamado al cambiar de página en la paginación
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.applyFiltersAndPagination(); // Aplicar paginación
  }

  // Lógica para poblar grados según el nivel seleccionado
  onNivelChange(): void {
    this.filters.grado = ''; // Reiniciar grado cuando cambia el nivel
    this.filters.seccion = ''; // Reiniciar sección cuando cambia el nivel
    if (this.filters.nivel === 'Primaria') {
      this.grados = ['1', '2', '3', '4', '5', '6'];
    } else if (this.filters.nivel === 'Secundaria') {
      this.grados = ['1', '2', '3', '4', '5'];
    } else {
      this.grados = []; // Vaciar grados si no se selecciona nivel
    }
    // No es necesario llamar a applyFiltersAndPagination aquí, se llamará al hacer clic en el botón Buscar
  }

  // Método para continuar una matrícula en estado "EN PROCESO"
  continueMatricula(matricula: MatriculadoDisplay): void {
    // Permite continuar matrículas en estado "EN PROCESO"
    if (matricula.estadoMatricula === 'EN PROCESO') {
      this.router.navigate(['/registrar-matricula'], {
        queryParams: { idMatricula: matricula.idmatricula }
      });
    } else {
      this.notificationService.showNotification(`Solo se puede continuar una matrícula que esté en estado "EN PROCESO". Estado actual: ${matricula.estadoMatricula}`, 'info');
    }
  }

  // Método para imprimir el comprobante de pago
  imprimirComprobantePago(matricula: MatriculadoDisplay): void {
    if (matricula.estadoMatricula === 'COMPLETADA' && matricula.idmatricula) {
      this.loading = true; // Activar indicador de carga
      this.comprobanteService.generarPdfDirecto(matricula.idmatricula, 'PAGO')
        .subscribe({
          next: blob => {
            const url = window.URL.createObjectURL(blob);
            window.open(url); // Abrir el PDF en una nueva pestaña
            this.loading = false; // Desactivar indicador de carga
          },
          error: err => {
            this.notificationService.showNotification('Error al generar comprobante de pago: ' + err.message, 'error');
            this.loading = false; // Desactivar indicador de carga en caso de error
          }
        });
    } else if (!matricula.idmatricula) {
      this.notificationService.showNotification('No se pudo obtener el ID de la matrícula para generar el comprobante de pago.', 'error');
    }
  }

  // Método para imprimir el comprobante de matrícula
  imprimirComprobanteMatricula(matricula: MatriculadoDisplay): void {
    if (matricula.estadoMatricula === 'COMPLETADA' && matricula.idmatricula) {
      this.loading = true; // Activar indicador de carga
      this.comprobanteService.generarPdfDirecto(matricula.idmatricula, 'MATRICULA')
        .subscribe({
          next: blob => {
            const url = window.URL.createObjectURL(blob);
            window.open(url); // Abrir el PDF en una nueva pestaña
            this.loading = false; // Desactivar indicador de carga
          },
          error: err => {
             this.notificationService.showNotification('Error al generar comprobante de matrícula: ' + err.message, 'error');
            this.loading = false; // Desactivar indicador de carga en caso de error
          }
        });
    } else if (!matricula.idmatricula) {
       this.notificationService.showNotification('No se pudo obtener el ID de la matrícula para generar el comprobante de matrícula.', 'error');
    }
  }

  // Método para reiniciar todos los filtros
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
    this.grados = []; // Reiniciar grados
    this.currentPage = 1; // Volver a la primera página
    this.applyFiltersAndPagination(); // Aplicar filtros reiniciados
  }
}
