import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxPaginationModule } from 'ngx-pagination';
import { ProfesorCursoService } from '../../../../services/profesor-curso.service';
import { NotificationComponent } from '../../../shared/notificaciones/notification.component';
import { ProfesorCurso } from '../../../../interface/ProfesorCurso';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../shared/notificaciones/notification.service';
import { DialogoConfirmacionComponent } from '../../modals/dialogo-confirmacion/dialogo-confirmacion.component';
import { ModalProfesorCursoComponent } from '../../modals/modal-profesor-curso/modal-profesor-curso.component';
import { PaginationComponent } from '../../../../../general/components/pagination/pagination.component';
import { GeneralLoadingSpinnerComponent } from '../../../../../general/components/spinner/spinner.component';
import { TooltipComponent } from '../../../../../general/components/tooltip/tooltip.component';
import { Usuario } from '../../../../interface/usuario';
import { Curso } from '../../../../interface/curso';
import { CourseService } from '../../../../services/course.service';
import { UsuarioService } from '../../../../services/usuario.service';
import { ActionConfig, ColumnConfig, TableComponent } from '../../../../../general/components/table/table.component';
import { EntidadService } from '../../../../../matricula/services/entidad.service';
import { DatosNGS } from '../../../../../matricula/interfaces/DTOEntidad';

@Component({
  selector: 'app-profesor-curso',
  standalone: true,
  imports: [
    RouterModule,
    HttpClientModule,
    CommonModule,
    NgxPaginationModule,
    FontAwesomeModule,
    FormsModule,
    NotificationComponent,
    PaginationComponent,
    GeneralLoadingSpinnerComponent,
    TooltipComponent,
    TableComponent,
  ],
  providers: [ProfesorCursoService,EntidadService],
  templateUrl: './profesor-curso.component.html',
  styleUrl: './profesor-curso.component.scss'
})
export class ProfesorCursoComponent implements OnInit {
  public page: number = 1;
  public itemsPerPage: number = 6;
  public pageSizeOptions: number[] = [];
  totalPages: number = 1;
  asignaciones: any[] = [];
  keyword: string = '';
  totalAsignaciones: number = 0;
  private lastValidKeyword: string = '';
  sortBy: string = 'fechaAsignacion';
  sortDir: string = 'asc';
  isLoading: boolean = false;
  appliedFilters: any = null;
  isValidFechaInicio: boolean = true;
  isValidFechaFin: boolean = true;
  currentYear: number = new Date().getFullYear(); // Año actual para validaciones

// Variables de filtros
  profesores: Usuario[] = [];
  cursos: Curso[] = [];
  filters = {
    profesorId: '',
    cursoId: '',
    grado: '',
    seccion: '',
    nivel: '',
    fechaInicio: '',
    fechaFin: '',
    fechaTipo: 'asignacion'
  };
  niveles: string[] = [];
  grados: string[] = [];
  secciones: string[] = [];
  datosNGS: DatosNGS | null = null;
  fechaTipos = [
    { value: 'asignacion', label: 'Fecha Asignación' },
    { value: 'actualizacion', label: 'Fecha Actualización' }
  ];

  // Fecha máxima
  maxDate!: string;

  // Configuración de columnas para la tabla
  tableColumns: ColumnConfig[] = [
    { field: 'profesor', header: 'Profesor', maxWidth: 150, sortable: true, type: 'text' },
    { field: 'curso', header: 'Curso', maxWidth: 150, sortable: true, type: 'text' },
    { field: 'grado', header: 'Grado', maxWidth: 100, sortable: true, type: 'text' },
    { field: 'seccion', header: 'Sección', maxWidth: 100, sortable: true, type: 'text' },
    { field: 'nivel', header: 'Nivel', maxWidth: 100, sortable: true, type: 'text' },
    { field: 'fechaAsignacion', header: 'Fecha Asignación', maxWidth: 120, sortable: true, type: 'date' },
    { field: 'fechaActualizacion', header: 'Fecha Actualización', maxWidth: 120, sortable: true, type: 'date' }
  ];

  // Configuración de acciones para la tabla
  tableActions: ActionConfig[] = [
    {
      name: 'Editar',
      icon: ['fas', 'pencil'],
      tooltip: 'Editar asignación',
      action: (asignacion: any) => this.openEditModal(asignacion),
      hoverColor: 'table-action-edit-hover'
    },
    {
      name: 'Eliminar',
      icon: ['fas', 'trash'],
      tooltip: 'Eliminar asignación',
      action: (asignacion: any) => {
        if (asignacion.idProfesorCurso) {
          this.eliminarAsignacion(asignacion.idProfesorCurso);
        } else {
          this.notificationService.showNotification(
            'La asignación no tiene un ID válido',
            'error'
          );
        }
      },
      hoverColor: 'table-action-delete-hover'
    }
  ];

  constructor(
    private profesorCursoService: ProfesorCursoService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private courseService: CourseService,
    private usuarioService: UsuarioService,
    private entidadService: EntidadService
  ) {
    this.updateMaxDate();
  }

  private readonly _dialog = inject(MatDialog);

  ngOnInit(): void {
    const savedItemsPerPage = localStorage.getItem('itemsPerPage');
    if (savedItemsPerPage) {
      this.itemsPerPage = parseInt(savedItemsPerPage, 10);
    }
    this.cargarConteoAsignaciones();
    this.cargarAsignaciones();
    this.cargarProfesores();
    this.cargarCursos();
    this.cargarEntidadData();
    this.updateMaxDate(); // Asegurar que se actualice al iniciar
  }

  // Función para actualizar maxDate a la fecha actual
  private updateMaxDate(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche
    this.maxDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD (2025-05-15)
    this.currentYear = today.getFullYear(); // Asegurar que sea 2025
    console.log(`maxDate actualizado: ${this.maxDate}, currentYear: ${this.currentYear}`);
  }

isValidDateFormat(dateStr: string): boolean {
    console.log(`Validando fecha: ${dateStr}`);
    
    if (!dateStr || dateStr.length !== 10) {
      console.log(`Fecha inválida: longitud incorrecta (${dateStr?.length || 0})`);
      return false;
    }

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) {
      console.log(`Fecha inválida: no coincide con el formato YYYY-MM-DD`);
      return false;
    }

    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) {
      console.log(`Fecha inválida: no se puede parsear a Date`);
      return false;
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const isValid =
      year >= 1900 &&
      year <= this.currentYear && // Rechazar años mayores a 2025
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= new Date(year, month, 0).getDate() &&
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day;

    if (!isValid) {
      if (year > this.currentYear) {
        this.notificationService.showNotification(
          `El año (${year}) no puede ser mayor al año actual (${this.currentYear}).`,
          'error'
        );
      } else if (month < 1 || month > 12) {
        this.notificationService.showNotification(
          `El mes (${month}) debe estar entre 1 y 12.`,
          'error'
        );
      } else if (day < 1 || day > new Date(year, month, 0).getDate()) {
        this.notificationService.showNotification(
          `El día (${day}) no es válido para el mes y año seleccionados.`,
          'error'
        );
      }
    }

    console.log(`Resultado de validación: ${isValid}`);
    return isValid;
  }

  onDateInput(event: Event, field: 'fechaInicio' | 'fechaFin'): void {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  console.log(`onDateInput: ${field} = ${value}`);

  // Normalizar y validar mientras se escribe
  const parts = value.split('-');
  if (parts.length > 0 && parts[0].length === 4) { // Validar año inmediatamente
    const year = parseInt(parts[0], 10);
    if (!isNaN(year) && year > this.currentYear) {
      this.notificationService.showNotification(
        `El año (${year}) no puede ser mayor al año actual (${this.currentYear}).`,
        'error'
      );
      input.value = ''; // Limpiar inmediatamente
      this.filters[field] = '';
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = false;
      this.cdr.detectChanges();
      return;
    }
  }

  // Validar fecha completa si se ingresó
  if (value.length === 10 && !this.isValidDateFormat(value)) {
    this.notificationService.showNotification(
      `Fecha inválida. El año no puede ser mayor a ${this.currentYear}. Use formato yyyy-mm-dd.`,
      'error'
    );
    input.value = ''; // Limpiar si es inválida
    this.filters[field] = '';
    this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = false;
    this.cdr.detectChanges();
  }
}

// Nueva función para manejar el evento blur (sin cambios, solo la mantengo)
onBlurDate(event: FocusEvent, field: 'fechaInicio' | 'fechaFin'): void {
    const input = event.target as HTMLInputElement;
    const value = input?.value || '';
    console.log(`onBlurDate: ${field} = ${value}`);
    this.onDateChange(value, field);
  }
  

onDateChange(value: string, field: 'fechaInicio' | 'fechaFin'): void {
    console.log(`onDateChange: ${field} = ${value}`);

    if (!value) {
      console.log(`${field} vacía, reseteando`);
      this.filters[field] = '';
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = true;
      this.cdr.detectChanges();
      return;
    }

    if (!this.isValidDateFormat(value)) {
      console.log(`Fecha inválida en ${field}: ${value}, limpiando campo`);
      this.filters[field] = '';
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = false;
      this.cdr.detectChanges();
      return;
    }

    const inputDate = new Date(value + 'T00:00:00');
    const maxDate = new Date(this.maxDate + 'T00:00:00');
    if (inputDate > maxDate) {
      this.notificationService.showNotification(
        `La fecha de ${field === 'fechaInicio' ? 'inicio' : 'fin'} no puede ser posterior a ${this.maxDate}.`,
        'error'
      );
      console.log(`Fecha futura en ${field}: ${value}, limpiando campo`);
      this.filters[field] = '';
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = false;
      this.cdr.detectChanges();
      return;
    }

    if (field === 'fechaFin' && this.filters.fechaInicio && this.isValidDateFormat(this.filters.fechaInicio)) {
      const startDate = new Date(this.filters.fechaInicio + 'T00:00:00');
      const endDate = new Date(value + 'T00:00:00');
      if (endDate < startDate) {
        this.notificationService.showNotification(
          'La fecha de fin no puede ser menor que la fecha de inicio.',
          'error'
        );
        console.log(`fechaFin < fechaInicio, limpiando fechaFin`);
        this.filters[field] = '';
        this.isValidFechaFin = false;
        this.cdr.detectChanges();
        return;
      }
    }

    console.log(`Fecha válida en ${field}: ${value}`);
    this.filters[field] = value;
    this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = true;
    this.cdr.detectChanges();
  }

  

validateDates(): boolean {
  console.log('Validando fechas antes de buscar:', {
    fechaInicio: this.filters.fechaInicio,
    fechaFin: this.filters.fechaFin
  });
  this.updateMaxDate();
  let isValid = true;

  // Validar fechaInicio
  if (this.filters.fechaInicio) {
    if (!this.isValidDateFormat(this.filters.fechaInicio)) {
      this.notificationService.showNotification(
        'Por favor, ingrese una fecha de inicio completa (día, mes y año).',
        'error'
      );
      console.log(`Fecha de inicio inválida: ${this.filters.fechaInicio}, limpiando`);
      this.filters.fechaInicio = '';
      this.isValidFechaInicio = false;
      isValid = false;
    } else if (new Date(this.filters.fechaInicio) > new Date(this.maxDate)) {
      this.notificationService.showNotification(
        'La fecha de inicio no puede ser futura.',
        'error'
      );
      console.log(`Fecha de inicio futura: ${this.filters.fechaInicio}, limpiando`);
      this.filters.fechaInicio = '';
      this.isValidFechaInicio = false;
      isValid = false;
    }
  }

  // Validar fechaFin
  if (this.filters.fechaFin) {
    if (!this.isValidDateFormat(this.filters.fechaFin)) {
      this.notificationService.showNotification(
        'Por favor, ingrese una fecha de fin completa (día, mes y año).',
        'error'
      );
      console.log(`Fecha de fin inválida: ${this.filters.fechaFin}, limpiando`);
      this.filters.fechaFin = '';
      this.isValidFechaFin = false;
      isValid = false;
    } else if (new Date(this.filters.fechaFin) > new Date(this.maxDate)) {
      this.notificationService.showNotification(
        'La fecha de fin no puede ser futura.',
        'error'
      );
      console.log(`Fecha de fin futura: ${this.filters.fechaFin}, limpiando`);
      this.filters.fechaFin = '';
      this.isValidFechaFin = false;
      isValid = false;
    }
  }

  // Validar que fechaFin no sea anterior a fechaInicio
  if (this.filters.fechaInicio && this.filters.fechaFin && isValid) {
    const startDate = new Date(this.filters.fechaInicio);
    const endDate = new Date(this.filters.fechaFin);
    if (endDate < startDate) {
      this.notificationService.showNotification(
        'La fecha de fin no puede ser menor que la fecha de inicio.',
        'error'
      );
      console.log(`fechaFin < fechaInicio, limpiando fechaFin`);
      this.filters.fechaFin = '';
      this.isValidFechaFin = false;
      isValid = false;
    }
  }

  if (!isValid) {
    console.log('Fechas inválidas detectadas, actualizando UI');
    this.cdr.detectChanges();
  }

  console.log(`Resultado de validateDates: ${isValid}`);
  return isValid;
}

isFormValid(): boolean {
  const fechaInicioValid = !this.filters.fechaInicio || this.isValidDateFormat(this.filters.fechaInicio);
  const fechaFinValid = !this.filters.fechaFin || this.isValidDateFormat(this.filters.fechaFin);
  const isValid = fechaInicioValid && fechaFinValid;

  console.log(`isFormValid: ${isValid}`, {
    fechaInicio: this.filters.fechaInicio,
    fechaFin: this.filters.fechaFin,
    fechaInicioValid,
    fechaFinValid,
    isValidFechaInicio: this.isValidFechaInicio,
    isValidFechaFin: this.isValidFechaFin
  });

  return isValid;
}

  private cargarEntidadData(): void {
    this.entidadService.obtenerEntidadList().subscribe({
      next: (entidades) => {
        if (entidades.length > 0) {
          const entidad = entidades[0];
          if (entidad.datosngs) {
            this.datosNGS = entidad.datosngs;
            this.niveles = this.datosNGS.niveles?.map(nivel => nivel.nombre) || [];
            this.onNivelChange();
          } else {
            this.notificationService.showNotification(
              'No se encontraron datos de niveles, grados y secciones',
              'info'
            );
          }
        } else {
          this.notificationService.showNotification(
            'No se encontraron entidades',
            'info'
          );
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showNotification(
          'Error al cargar datos de entidad',
          'error'
        );
        console.error('Error al cargar entidad:', err);
      }
    });
  }

  private updatePageSizeOptions(): void {
    const previousItemsPerPage = this.itemsPerPage;
    this.pageSizeOptions = [];
    const increment = 5;
    for (let i = increment; i <= this.totalAsignaciones; i += increment) {
      this.pageSizeOptions.push(i);
    }

    if (this.pageSizeOptions.length > 0) {
      if (!this.pageSizeOptions.includes(this.itemsPerPage)) {
        const validOption = this.pageSizeOptions
          .filter((option) => option <= this.totalAsignaciones)
          .reduce(
            (prev, curr) =>
              Math.abs(curr - this.itemsPerPage) < Math.abs(prev - this.itemsPerPage) ? curr : prev,
            this.pageSizeOptions[0]
          );
        this.itemsPerPage = validOption;
        localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
        console.log(
          `itemsPerPage cambiado de ${previousItemsPerPage} a ${this.itemsPerPage}`
        );
      }
    } else {
      this.pageSizeOptions = [5];
      this.itemsPerPage = 5;
      localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
      console.log(`itemsPerPage establecido a 5 porque no hay asignaciones`);
    }
  }

  onItemsPerPageChange(newSize: number): void {
    console.log(`onItemsPerPageChange: Cambiando itemsPerPage a ${newSize}`);
    this.itemsPerPage = newSize;
    localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
    this.page = 1;
    this.cargarAsignaciones();
  }

  cargarProfesores(): void {
    this.usuarioService.obtenerListaUsuario().subscribe({
      next: (profesores) => {
        this.profesores = profesores;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showNotification('Error al cargar profesores', 'error');
      }
    });
  }

  cargarCursos(): void {
    this.courseService.obtenerListaCursos(1, 100, 'nombre', 'asc').subscribe({
      next: (response) => {
        this.cursos = response.content;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showNotification('Error al cargar cursos', 'error');
      }
    });
  }

  onNivelChange(): void {
    this.grados = [];
    this.secciones = [];
    this.filters.grado = '';
    this.filters.seccion = '';

    if (this.filters.nivel && this.datosNGS) {
      const selectedNivel = this.datosNGS.niveles?.find(n => n.nombre === this.filters.nivel);
      this.grados = selectedNivel?.grados?.map(grado => grado.nombre) || [];
    }
    this.cdr.detectChanges();
  }

  onGradoChange(): void {
    this.secciones = [];
    this.filters.seccion = '';

    if (this.filters.nivel && this.filters.grado && this.datosNGS) {
      const selectedNivel = this.datosNGS.niveles?.find(n => n.nombre === this.filters.nivel);
      if (selectedNivel) {
        const selectedGrado = selectedNivel.grados?.find(g => g.nombre === this.filters.grado);
        this.secciones = selectedGrado?.secciones || [];
      }
    }
    this.cdr.detectChanges();
  }

  resetFilter(filter: string): void {
    if (filter === 'all') {
      this.filters = {
        profesorId: '',
        cursoId: '',
        grado: '',
        seccion: '',
        nivel: '',
        fechaInicio: '',
        fechaFin: '',
        fechaTipo: 'asignacion'
      };
      this.appliedFilters = null;
      this.grados = [];
      this.secciones = [];
      this.keyword = '';
      this.page = 1;
      this.cargarAsignaciones();
    } else {
      (this.filters as any)[filter] = filter === 'fechaTipo' ? 'asignacion' : '';
      if (filter === 'nivel') {
        this.grados = [];
        this.secciones = [];
        this.filters.grado = '';
        this.filters.seccion = '';
      } else if (filter === 'grado') {
        this.secciones = [];
        this.filters.seccion = '';
      }
    }
    this.cdr.detectChanges();
  }

  isKeywordValid(value: string): boolean {
    if (!value) return true;
    const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+( [a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$/;
    return regex.test(value.trim());
  }

  private lastValidValues: { [key: string]: string } = {
    profesorId: '',
    cursoId: ''
  };

  onInputChange(event: Event, field: 'profesorId' | 'cursoId'): void {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    if (newValue.startsWith(' ')) {
      input.value = this.lastValidValues[field];
      this.filters[field] = this.lastValidValues[field];
      this.notificationService.showNotification(
        'No se permiten espacios al inicio.',
        'info'
      );
      this.cdr.detectChanges();
      return;
    }

    newValue = newValue.replace(/\s+/g, ' ');

    if (newValue === '') {
      this.filters[field] = '';
      this.lastValidValues[field] = '';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    const intermediateRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+( [a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]*)*$/;
    if (!intermediateRegex.test(newValue)) {
      input.value = this.lastValidValues[field];
      this.filters[field] = this.lastValidValues[field];
      this.notificationService.showNotification(
        'Solo se permiten letras, números, acentos, ñ y un solo espacio entre palabras.',
        'info'
      );
      this.cdr.detectChanges();
      return;
    }

    this.filters[field] = newValue;
    this.lastValidValues[field] = newValue.trim();
    input.value = this.filters[field];
    this.cdr.detectChanges();
  }

  getMinFechaFin(): string {
    return this.filters.fechaInicio && this.isValidDateFormat(this.filters.fechaInicio) ? this.filters.fechaInicio : '';
  }

  onSortChange(event: { sortBy: string, sortDir: string }): void {
    this.sortBy = event.sortBy;
    this.sortDir = event.sortDir;
    this.page = 1;
    this.cargarAsignaciones();
  }

  cargarConteoAsignaciones(): void {
    this.profesorCursoService.obtenerConteoAsignaciones().subscribe({
      next: (count) => {
        this.totalAsignaciones = count;
        this.updatePageSizeOptions();
        this.totalPages = Math.ceil(this.totalAsignaciones / this.itemsPerPage);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.totalAsignaciones = 0;
        this.pageSizeOptions = [5];
        this.itemsPerPage = 5;
        localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
        this.notificationService.showNotification(
          'Error al cargar el conteo de asignaciones: ' + err.message,
          'error'
        );
        console.error('Error al cargar conteo:', err);
      }
    });
  }

  cargarAsignaciones(): void {
    this.isLoading = true;
    console.log('Cargando asignaciones con:', {
      page: this.page,
      itemsPerPage: this.itemsPerPage,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      filters: this.appliedFilters
    });

    if (this.appliedFilters) {
      this.profesorCursoService
        .buscarAsignaciones(this.appliedFilters, this.page, this.itemsPerPage, this.sortBy, this.sortDir)
        .subscribe({
          next: (response) => {
            console.log('Respuesta de buscarAsignaciones:', response);
            this.asignaciones = this.transformarDatos(response.content || []);
            this.totalAsignaciones = response.totalElements;
            this.totalPages = Math.ceil(this.totalAsignaciones / this.itemsPerPage);
            this.updatePageSizeOptions();
            if (this.page > this.totalPages) {
              this.page = 1;
              this.cargarAsignaciones();
              return;
            }
            this.cdr.detectChanges();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error en buscarAsignaciones:', err);
            this.asignaciones = [];
            this.totalPages = 1;
            this.notificationService.showNotification('Error al cargar asignaciones: ' + err.message, 'error');
            this.cdr.detectChanges();
            this.isLoading = false;
          }
        });
    } else {
      this.profesorCursoService
        .obtenerCourseList(this.page, this.itemsPerPage, this.sortBy, this.sortDir)
        .subscribe({
          next: (response) => {
            console.log('Respuesta de obtenerCourseList:', response);
            this.asignaciones = this.transformarDatos(response.content || []);
            this.totalAsignaciones = response.totalElements;
            this.totalPages = Math.ceil(this.totalAsignaciones / this.itemsPerPage);
            this.updatePageSizeOptions();
            if (this.page > this.totalPages) {
              this.page = 1;
              this.cargarAsignaciones();
              return;
            }
            this.cdr.detectChanges();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error en obtenerCourseList:', err);
            this.asignaciones = [];
            this.totalPages = 1;
            this.notificationService.showNotification('Error al cargar asignaciones: ' + err.message, 'error');
            this.cdr.detectChanges();
            this.isLoading = false;
          }
        });
    }
  }

  private transformarDatos(asignaciones: ProfesorCurso[]): any[] {
    return asignaciones.map(asignacion => ({
      ...asignacion,
      profesor: `${asignacion.usuario?.nombre || ''} ${asignacion.usuario?.apellidopaterno || ''}`.trim(),
      curso: asignacion.curso?.nombre || '',
      usuario: asignacion.usuario,
      cursoObj: asignacion.curso,
      nivel: asignacion.nivel || '',
      grado: asignacion.grado || '',
      seccion: asignacion.seccion || '',
      fechaActualizacion: asignacion.fechaActualizacion || null
    }));
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      console.log(`onPageChange: Cambiando a página ${page}`);
      this.page = page;
      this.cargarAsignaciones();
    }
  }

  openAddModal(): void {
    const dialogRef = this.dialog.open(ModalProfesorCursoComponent, {
      width: '600px',
      data: { isEditing: false }
    });

    dialogRef.afterClosed().subscribe((asignacionAgregada: ProfesorCurso) => {
      if (asignacionAgregada) {
        this.cargarAsignaciones();
        this.cargarConteoAsignaciones();
        this.notificationService.showNotification(
          'Asignación agregada con éxito',
          'success'
        );
      }
    });
  }

  openEditModal(asignacion: any): void {
    if (!asignacion.idProfesorCurso) {
      this.notificationService.showNotification(
        'La asignación no tiene un ID válido',
        'error'
      );
      return;
    }

    console.log('Datos enviados al modal:', {
      isEditing: true,
      idProfesorCurso: asignacion.idProfesorCurso,
      usuario: asignacion.usuario,
      curso: asignacion.cursoObj,
      nivel: asignacion.nivel,
      grado: asignacion.grado,
      seccion: asignacion.seccion
    });

    const dialogRef = this.dialog.open(ModalProfesorCursoComponent, {
      width: '600px',
      data: {
        isEditing: true,
        idProfesorCurso: asignacion.idProfesorCurso,
        usuario: asignacion.usuario,
        curso: asignacion.cursoObj,
        nivel: asignacion.nivel,
        grado: asignacion.grado,
        seccion: asignacion.seccion
      }
    });

    dialogRef.afterClosed().subscribe((asignacionActualizada: ProfesorCurso) => {
      if (asignacionActualizada) {
        this.cargarAsignaciones();
        this.cargarConteoAsignaciones();
        this.notificationService.showNotification(
          'Asignación actualizada con éxito',
          'success'
        );
      }
    });
  }

  eliminarAsignacion(idAsignacion: string): void {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '1px',
      height: '1px',
      data: { message: '¿Estás seguro de que quieres eliminar esta asignación?' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.profesorCursoService.eliminarCurso(idAsignacion).subscribe({
          next: () => {
            this.cargarAsignaciones();
            this.cargarConteoAsignaciones();
            this.notificationService.showNotification(
              'Asignación eliminada con éxito',
              'success'
            );
          },
          error: (err) => {
            this.notificationService.showNotification(
              'Error al eliminar asignación: ' + err.message,
              'error'
            );
            console.error('Error al eliminar asignación:', err);
          }
        });
      }
    });
  }

// Actualización de buscarAsignaciones
buscarAsignaciones(): void {
  console.log('Iniciando buscarAsignaciones con filtros:', this.filters);

  // Validar entradas de texto
  if (this.filters.profesorId && !this.isKeywordValid(this.filters.profesorId)) {
    this.notificationService.showNotification(
      'El nombre del profesor contiene caracteres no válidos.',
      'error'
    );
    console.log('Nombre de profesor inválido');
    return;
  }

  if (this.filters.cursoId && !this.isKeywordValid(this.filters.cursoId)) {
    this.notificationService.showNotification(
      'El nombre del curso contiene caracteres no válidos.',
      'error'
    );
    console.log('Nombre de curso inválido');
    return;
  }

  // Validar fechas y detener la búsqueda si son inválidas
  if (!this.validateDates()) {
    console.log('validateDates falló, deteniendo búsqueda');
    return;
  }

  this.isLoading = true;
  const filters = {
    profesorId: this.filters.profesorId ? this.filters.profesorId.trim() : undefined,
    cursoId: this.filters.cursoId ? this.filters.cursoId.trim() : undefined,
    grado: this.filters.grado ? this.filters.grado.toLowerCase() : undefined,
    seccion: this.filters.seccion ? this.filters.seccion.toLowerCase() : undefined,
    nivel: this.filters.nivel ? this.filters.nivel.toLowerCase() : undefined,
    fechaInicio: this.filters.fechaInicio && this.isValidDateFormat(this.filters.fechaInicio)
      ? new Date(this.filters.fechaInicio + 'T00:00:00').toISOString()
      : undefined,
    fechaFin: this.filters.fechaFin && this.isValidDateFormat(this.filters.fechaFin)
      ? new Date(this.filters.fechaFin + 'T00:00:00').toISOString()
      : undefined,
    fechaTipo: this.filters.fechaTipo || undefined
  };

  console.log('Filtros aplicados:', filters);
  this.appliedFilters = filters;

  this.profesorCursoService
    .buscarAsignaciones(filters, this.page, this.itemsPerPage, this.sortBy, this.sortDir)
    .subscribe({
      next: (resultado) => {
        console.log('Resultados recibidos:', resultado);
        this.asignaciones = this.transformarDatos(resultado.content);
        this.totalAsignaciones = resultado.totalElements;
        this.totalPages = Math.ceil(this.totalAsignaciones / this.itemsPerPage);
        this.updatePageSizeOptions();
        if (this.page > this.totalPages) {
          this.page = 1;
          this.buscarAsignaciones();
          return;
        }
        this.cdr.detectChanges();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error en la búsqueda:', err);
        this.notificationService.showNotification(
          'Error al buscar asignaciones. Verifique los filtros o contacte al administrador.',
          'error'
        );
        this.asignaciones = [];
        this.totalAsignaciones = 0;
        this.totalPages = 1;
        this.updatePageSizeOptions();
        this.isLoading = false;
      }
    });
}
  }
