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
    TableComponent
  ],
  providers: [ProfesorCursoService],
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

  // Variables de filtros
  profesores: Usuario[] = [];
  cursos: Curso[] = [];
  filters = {
    profesorId: '',
    cursoId: '',
    grado: '',
    seccion: '',
    nivel: '',
    fechaInicio: '' as string | undefined,
    fechaFin: '' as string | undefined,
    fechaTipo: 'asignacion'
  };
  niveles = ['primaria', 'secundaria'];
  grados: string[] = [];
  secciones = ['A', 'B', 'C', 'D'];
  fechaTipos = [
    { value: 'asignacion', label: 'Fecha Asignación' },
    { value: 'actualizacion', label: 'Fecha Actualización' }
  ];

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
    // Acción de "Imprimir" (comentada)
    /*
    {
      name: 'Imprimir',
      icon: ['fas', 'print'],
      tooltip: 'Imprimir asignación',
      action: (asignacion: any) => this.imprimirAsignacion(asignacion.idProfesorCurso);
      hoverColor: 'table-action-print-hover'
    }
    */
  ];

  constructor(
    private profesorCursoService: ProfesorCursoService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private courseService: CourseService,
    private usuarioService: UsuarioService
  ) {}

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
      },
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
    if (this.filters.nivel === 'primaria') {
      this.grados = ['1', '2', '3', '4', '5', '6'];
    } else if (this.filters.nivel === 'secundaria') {
      this.grados = ['1', '2', '3', '4', '5'];
    } else {
      this.grados = [];
    }
    this.filters.grado = '';
    this.filters.seccion = '';
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
      this.keyword = '';
      this.page = 1;
      this.cargarAsignaciones();
    } else {
      (this.filters as any)[filter] = filter === 'fechaTipo' ? 'asignacion' : '';
      if (filter === 'nivel') {
        this.grados = [];
        this.filters.grado = '';
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

  validateDates(): boolean {
    if (this.filters.fechaInicio && this.filters.fechaFin) {
      const startDate = new Date(this.filters.fechaInicio);
      const endDate = new Date(this.filters.fechaFin);
      if (endDate < startDate) {
        this.notificationService.showNotification(
          'La fecha de fin no puede ser menor que la fecha de inicio.',
          'error'
        );
        return false;
      }
    }
    return true;
  }

  getMinFechaFin(): string {
    return this.filters.fechaInicio || '';
  }

  cambiarOrdenamiento(columna: string): void {
    if (this.sortBy === columna) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = columna;
      this.sortDir = 'asc';
    }
    this.page = 1;
    this.cargarAsignaciones();
  }

  // Manejar el evento sortChange del TableComponent
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
      },
    });
  }

  cargarAsignaciones(): void {
    this.isLoading = true;
    console.log('Cargando asignaciones con:', {
      page: this.page,
      itemsPerPage: this.itemsPerPage,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      filters: this.appliedFilters,
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
          },
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
          },
        });
    }
  }

  // Transformar datos para aplanar propiedades anidadas
  private transformarDatos(asignaciones: ProfesorCurso[]): any[] {
    return asignaciones.map(asignacion => ({
      ...asignacion,
      profesor: `${asignacion.usuario?.nombre || ''} ${asignacion.usuario?.apellidopaterno || ''}`.trim(),
      curso: asignacion.curso?.nombre || '',
      fechaActualizacion: asignacion.fechaActualizacion || null // Permitir null para mostrar 'Sin actualizar'
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

    const dialogRef = this.dialog.open(ModalProfesorCursoComponent, {
      width: '600px',
      data: { ...asignacion, isEditing: true }
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

  buscarAsignaciones(): void {
    if (this.filters.profesorId && !this.isKeywordValid(this.filters.profesorId)) {
      this.notificationService.showNotification(
        'El nombre del profesor contiene caracteres no válidos.',
        'info'
      );
      return;
    }

    if (this.filters.cursoId && !this.isKeywordValid(this.filters.cursoId)) {
      this.notificationService.showNotification(
        'El nombre del curso contiene caracteres no válidos.',
        'info'
      );
      return;
    }

    if (!this.validateDates()) {
      return;
    }

    this.isLoading = true;
    const filters = {
      profesorId: this.filters.profesorId ? this.filters.profesorId.trim() : undefined,
      cursoId: this.filters.cursoId ? this.filters.cursoId.trim() : undefined,
      grado: this.filters.grado ? this.filters.grado.toLowerCase() : undefined,
      seccion: this.filters.seccion ? this.filters.seccion.toLowerCase() : undefined,
      nivel: this.filters.nivel ? this.filters.nivel.toLowerCase() : undefined,
      fechaInicio: this.filters.fechaInicio ? new Date(this.filters.fechaInicio).toISOString() : undefined,
      fechaFin: this.filters.fechaFin ? new Date(this.filters.fechaFin).toISOString() : undefined,
      fechaTipo: this.filters.fechaTipo || undefined,
    };

    this.appliedFilters = filters;

    console.log('Enviando solicitud con:', {
      filters,
      page: this.page,
      itemsPerPage: this.itemsPerPage,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
    });

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
        },
      });
  }
}
