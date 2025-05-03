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
    TooltipComponent
  ],
  providers: [ProfesorCursoService],
  templateUrl: './profesor-curso.component.html',
  styleUrl: './profesor-curso.component.scss'
})
export class ProfesorCursoComponent implements OnInit {
  public page: number = 1;
  public itemsPerPage: number = 6;
  public pageSizeOptions: number[] = []; // Opciones dinámicas para el selector
  totalPages: number = 1;
  asignaciones: ProfesorCurso[] = [];
  keyword: string = '';
  totalAsignaciones: number = 0;
  private lastValidKeyword: string = '';
  sortBy: string = 'fechaAsignacion';
  sortDir: string = 'asc';
  isLoading: boolean = false;
  appliedFilters: any = null; // Almacena los filtros aplicados

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
    fechaTipo: 'asignacion' // Default to asignacion
  };
  niveles = ['primaria', 'secundaria'];
  grados: string[] = [];
  secciones = ['A', 'B', 'C', 'D'];
  fechaTipos = [
    { value: 'asignacion', label: 'Fecha Asignación' },
    { value: 'actualizacion', label: 'Fecha Actualización' }
  ];


  constructor(
    private profesorCursoService: ProfesorCursoService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private courseService: CourseService,
    private usuarioService: UsuarioService,
  ) {}

  private readonly _dialog = inject(MatDialog);

  ngOnInit(): void {
    // Cargar itemsPerPage desde localStorage si existe
    const savedItemsPerPage = localStorage.getItem('itemsPerPage');
    if (savedItemsPerPage) {
      this.itemsPerPage = parseInt(savedItemsPerPage, 10);
    }
    this.cargarConteoAsignaciones();
    this.cargarAsignaciones();
    this.cargarProfesores();
    this.cargarCursos();
  }

  // Calcular opciones dinámicas para el selector de itemsPerPage
  private updatePageSizeOptions(): void {
    const previousItemsPerPage = this.itemsPerPage;
    this.pageSizeOptions = [];
    const increment = 5;
    for (let i = increment; i <= this.totalAsignaciones; i += increment) {
      this.pageSizeOptions.push(i);
    }

    // Asegurar que itemsPerPage sea válido sin resetearlo innecesariamente
    if (this.pageSizeOptions.length > 0) {
      // Mantener itemsPerPage si es válido, de lo contrario usar la opción más cercana
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
          `itemsPerPage cambiado de ${previousItemsPerPage} a ${this.itemsPerPage} porque no estaba en pageSizeOptions:`,
          this.pageSizeOptions
        );
      }
    } else {
      this.pageSizeOptions = [5]; // Opción por defecto si no hay asignaciones
      this.itemsPerPage = 5;
      localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
      console.log(
        `itemsPerPage establecido a 5 porque no hay asignaciones. pageSizeOptions:`,
        this.pageSizeOptions
      );
    }
  }

  // Actualizar itemsPerPage cuando el usuario selecciona una nueva opción
  onItemsPerPageChange(newSize: number): void {
    console.log(`onItemsPerPageChange: Cambiando itemsPerPage a ${newSize}`);
    this.itemsPerPage = newSize;
    localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
    this.page = 1; // Reiniciar a la primera página
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
    this.filters.grado = ''; // Reset grado
    this.filters.seccion = ''; // Reset sección
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
      this.appliedFilters = null; // Limpiar filtros aplicados
      this.grados = [];
      this.keyword = '';
      this.page = 1; // Reiniciar página
      this.cargarAsignaciones(); // Recargar asignaciones después de limpiar filtros
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

  isKeywordValid(): boolean {
    if (!this.keyword) return true;
    const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+( [a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$/;
    return regex.test(this.keyword.trim());
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;
    newValue = newValue.replace(/\s+/g, ' ').trimStart();
    this.keyword = newValue;
    if (newValue && !this.isKeywordValid()) {
      this.notificationService.showNotification(
        'Solo se permiten letras, números, acentos, ñ y un solo espacio entre palabras.',
        'info'
      );
    } else {
      this.lastValidKeyword = newValue.trim();
    }
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
    return true; // Permitir casos con solo fechaInicio o solo fechaFin
  }

  getMinFechaFin(): string {
    return this.filters.fechaInicio || '';
  }

  convertirFechaInicio(fecha: string): void {
    if (fecha) {
      // Convertir la fecha a formato ISO completo (agregar hora 00:00:00)
      this.filters.fechaInicio = `${fecha}T00:00:00`;
    } else {
      this.filters.fechaInicio = undefined;
    }
  }

  convertirFechaFin(fecha: string): void {
    if (fecha) {
      // Convertir la fecha a formato ISO completo (agregar hora 23:59:59 para incluir todo el día)
      this.filters.fechaFin = `${fecha}T23:59:59`;
    } else {
      this.filters.fechaFin = undefined;
    }
  }

  cambiarOrdenamiento(columna: string): void {
    if (this.sortBy === columna) {
      // Cambiar dirección si es la misma columna
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      // Establecer nueva columna y dirección ascendente por defecto
      this.sortBy = columna;
      this.sortDir = 'asc';
    }
    this.page = 1; // Reiniciar a la primera página
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
            this.asignaciones = response.content || [];
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
            this.asignaciones = response.content || [];
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

  openEditModal(asignacion: ProfesorCurso): void {
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
    if (!this.isKeywordValid()) {
      this.notificationService.showNotification('El término de búsqueda no es válido.', 'info');
      return;
    }

    if (!this.validateDates()) {
      return;
    }

    this.isLoading = true;
    const filters = {
      keyword: this.keyword.trim() || undefined,
      profesorId: this.filters.profesorId || undefined,
      cursoId: this.filters.cursoId || undefined,
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
          this.asignaciones = resultado.content;
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
