import { HttpClientModule } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CourseService } from '../../../../services/course.service';
import { Competencia, Curso } from '../../../../interface/curso';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ModalComponent } from '../../modals/modal/modal.component';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../modals/modal/modal.service';
import { DialogoConfirmacionComponent } from '../../modals/dialogo-confirmacion/dialogo-confirmacion.component';
import { NotificationComponent } from '../../../shared/notificaciones/notification.component';
import { NotificationService } from '../../../shared/notificaciones/notification.service';
import { PaginationComponent } from '../../../../../general/components/pagination/pagination.component';
import { TooltipComponent } from '../../../../../general/components/tooltip/tooltip.component';
import { GeneralLoadingSpinnerComponent } from '../../../../../general/components/spinner/spinner.component';
import { PreviewContentComponent } from '../../modals/preview-content/preview-content.component';
import {
  ActionConfig,
  ColumnConfig,
  TableComponent,
} from '../../../../../general/components/table/table.component';
import {
  SEARCH_INTERMEDIATE_REGEX,
  SEARCH_NO_NUMBERS_INTERMEDIATE_REGEX,
  SEARCH_NO_NUMBERS_REGEX,
  SEARCH_REGEX,
  SEARCH_VALIDATION_MESSAGES,
} from '../../../../../general/components/const/const';
import {
  AuditmodalComponent,
  ModalButton,
} from '../../modals/auditmodal/auditmodal.component';
import { CursoFormComponent } from '../../modals/curso-form/curso-form.component';
import { ConfirmDeleteComponent } from '../../modals/confirm-delete/confirm-delete.component'; // ← Crea este archivo
import { log } from 'node:console';

@Component({
  selector: 'app-campus-cursos',
  standalone: true,
  imports: [
    RouterModule,
    PreviewContentComponent,
    TableComponent,
    GeneralLoadingSpinnerComponent,
    TooltipComponent,
    PaginationComponent,
    HttpClientModule,
    CommonModule,
    NgxPaginationModule,
    FontAwesomeModule,
    FormsModule,
    NotificationComponent,
    CursoFormComponent, // ← AÑADIR
    ConfirmDeleteComponent, // ← AÑADIR
    AuditmodalComponent,
  ],
  providers: [CourseService],
  templateUrl: './campus-cursos.component.html',
  styleUrl: './campus-cursos.component.scss',
})
export class CampusCursosComponent {
  cursos: Curso[] = [];
  keyword: string = '';
  totalCursos: number = 0;
  private lastValidKeyword: string = '';
  sortBy: string = 'fechaCreacion';
  sortDir: string = 'asc';
  isLoading: boolean = false;
  showModal: boolean = false;
  selectedCurso: Curso | null = null;
  selectedField: string = '';
  formattedCompetencias: string = '';
  page: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  ngOnInit(): void {
  if (isPlatformBrowser(this.platformId)) {
    const saved = localStorage.getItem('itemsPerPageCursos');
    this.itemsPerPage = saved ? parseInt(saved, 5) : 5;
  }
  this.cargarCursos();
}

  // En tu componente
  modal = {
    open: false,
    type: 'form' as 'form' | 'confirm' | 'preview', // ← AÑADIMOS 'preview'
    title: '',
    data: null as any,
    isReadOnly: false,
    size: '',
    buttons: [] as ModalButton[],
  };

  openAddModal() {
    this.modal = {
      open: true,
      type: 'form',
      title: 'Agregar Curso',
      data: {
        nombre: '',
        abreviatura: '',
        descripcion: '',
        competencias: [],
      },
      isReadOnly: false,
      size: 'max-w-xl',
      buttons: [], // ← Deja vacío, el formulario maneja los botones
    };
  }

  openEditModal(curso: Curso) {
    this.modal = {
      open: true,
      type: 'form',
      title: 'Editar Curso',
      data: {
        ...curso,
        competencias: Array.isArray(curso.competencias)
          ? curso.competencias
          : [],
      },
      isReadOnly: false,
      size: 'max-w-xl',
      buttons: [],
    };
  }

  openDeleteModal(curso: Curso) {
    this.selectedCurso = curso;
    this.modal = {
      open: true,
      type: 'confirm',
      title: 'Confirmar eliminación',
      data: null,
      isReadOnly: false,
      size: 'max-w-md',
      buttons: [],
    };
  }

  onFormSubmit(curso: Curso) {
    console.log('Formulario enviado (1 sola vez):', curso);

    // ASEGURAR QUE COMPETENCIAS EXISTA Y SEA ARRAY
    const competencias = (curso.competencias || [])
      .map((c) => ({ ...c, nombre: c.nombre?.trim() || '' }))
      .filter((c) => c.nombre.length > 0);

    curso.competencias = competencias;

    if (curso.idCurso) {
      this.courseService.actualizarCurso(curso).subscribe({
        next: () => {
          this.closeModal();
          this.cargarCursos();
          this.notificationService.showNotification(
            'Curso actualizado',
            'success'
          );
        },
        error: (err) => {
          this.notificationService.showNotification(
            'Error: ' + err.message,
            'error'
          );
        },
      });
    } else {
      this.courseService.agregarCurso(curso).subscribe({
        next: () => {
          this.closeModal();
          this.cargarCursos();
          this.notificationService.showNotification(
            'Curso agregado',
            'success'
          );
        },
        error: (err) => {
          this.notificationService.showNotification(
            'Error: ' + err.message,
            'error'
          );
        },
      });
    }
  }

  onConfirmDelete() {
    if (this.selectedCurso?.idCurso) {
      this.courseService.eliminarCurso(this.selectedCurso.idCurso).subscribe({
        next: () => {
          this.closeModal();
          this.cargarCursos();
          this.notificationService.showNotification(
            'Curso eliminado con éxito',
            'success'
          );
        },
        error: (err) => {
          this.notificationService.showNotification(
            'Error al eliminar: ' + err.message,
            'error'
          );
        },
      });
    }
  }

  closeModal() {
    this.modal = {
      open: false,
      type: 'form',
      title: '',
      data: null,
      isReadOnly: false,
      size: '',
      buttons: [],
    };
  }

  tableColumns: ColumnConfig[] = [
    {
      field: 'nombre',
      header: 'Nombre',
      maxWidth: 150,
      sortable: true,
      type: 'text',
    },
    {
      field: 'abreviatura',
      header: 'Abreviatura',
      maxWidth: 100,
      sortable: false,
      type: 'text',
    },
    {
      field: 'descripcion',
      header: 'Descripción',
      maxWidth: 200,
      sortable: true,
      type: 'text',
      preview: true, // Habilitar vista previa con ícono de ojo
      transform: (value: string | undefined) => {
        if (!value) return '';
        const words = value.split(' ').slice(0, 4).join(' ');
        return value.split(' ').length > 4 ? `${words}...` : words;
      },
    },
    {
      field: 'competencias',
      header: 'Competencias',
      maxWidth: 250,
      sortable: false,
      type: 'text',
      preview: true,
      transform: (value: Competencia[] | undefined) => {
        if (!value || value.length === 0) return 'Sin competencias';
        return value[0].nombre?.substring(0, 18) + '...';
      },
    },
    {
      field: 'fechaCreacion',
      header: 'Fecha de Creación',
      maxWidth: 120,
      sortable: true,
      type: 'date',
    },
    {
      field: 'fechaActualizacion',
      header: 'Fecha Actualización',
      maxWidth: 120,
      sortable: true,
      type: 'date',
    },
  ];

  tableActions: ActionConfig[] = [
    {
      name: 'Editar',
      icon: ['fas', 'pencil'],
      tooltip: 'Editar curso', // ← AÑADIR
      action: (curso: Curso) => this.openEditModal(curso),
    },
    {
      name: 'Eliminar',
      icon: ['fas', 'trash'],
      tooltip: 'Eliminar curso', // ← AÑADIR
      action: (curso: Curso) => this.openDeleteModal(curso),
    },
  ];

  constructor(
    private modalService: ModalService,
    private courseService: CourseService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}


  // Manejar el clic en el ícono de ojo para mostrar el modal
  // Actualiza onPreviewClick
  onPreviewClick(event: { item: Curso; field: string }): void {
    const curso = event.item;
    const field = event.field;

    let title = '';
    let data: any = null;
    let size = 'max-w-lg';

    if (field === 'descripcion') {
      title = 'Descripción completa';
      data = {
        field: 'descripcion',
        content: curso.descripcion || 'Sin descripción',
      };
      size = 'max-w-2xl';
    }

    if (field === 'competencias') {
      title = `Competencias del curso: ${curso.nombre}`;
      data = {
        field: 'competencias',
        curso: curso,
      };
      size = 'max-w-xl';
    }

    this.modal = {
      open: true,
      type: 'preview',
      title,
      data,
      isReadOnly: true,
      size,
      buttons: [],
    };
  }

  onPageChange(page: number): void {
  this.page = page;
  this.cargarCursos();
}

onItemsPerPageChange(newSize: number): void {
  this.itemsPerPage = newSize;
  this.page = 1;
  this.cargarCursos();
}

  isKeywordValid(): boolean {
    if (!this.keyword) return true;
    return SEARCH_NO_NUMBERS_REGEX.test(this.keyword.trim());
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    if (newValue.startsWith(' ')) {
      input.value = this.lastValidKeyword;
      this.keyword = this.lastValidKeyword;
      this.notificationService.showNotification(
        SEARCH_VALIDATION_MESSAGES.NO_LEADING_SPACE,
        'info'
      );
      this.cdr.detectChanges();
      return;
    }

    newValue = newValue.replace(/\s+/g, ' ');

    if (newValue === '') {
      this.keyword = '';
      this.lastValidKeyword = '';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    if (!SEARCH_NO_NUMBERS_INTERMEDIATE_REGEX.test(newValue)) {
      input.value = this.lastValidKeyword;
      this.keyword = this.lastValidKeyword;
      this.notificationService.showNotification(
        SEARCH_VALIDATION_MESSAGES.NO_NUMBERS_INVALID_FORMAT,
        'info'
      );
      this.cdr.detectChanges();
      return;
    }

    this.keyword = newValue;
    this.lastValidKeyword = newValue.trim();
    input.value = this.keyword;
    this.cdr.detectChanges();
  }

  onSortChange(event: { sortBy: string; sortDir: string }): void {
    this.sortBy = event.sortBy;
    this.sortDir = event.sortDir;

    // Ordenar los datos localmente (sin llamar al backend)
    this.sortCursosLocalmente();

    // Solo si NO estás en búsqueda, reseteas a página 1
    if (!this.keyword.trim()) {
      this.page = 1;
    }
  }

  private sortCursosLocalmente(): void {
    if (this.cursos.length === 0) return;

    const direction = this.sortDir === 'asc' ? 1 : -1;

    this.cursos = [...this.cursos].sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof Curso];
      let bValue: any = b[this.sortBy as keyof Curso];

      // Manejo especial para fechas
      if (
        this.sortBy === 'fechaCreacion' ||
        this.sortBy === 'fechaActualizacion'
      ) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Manejo para strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Manejo para valores nulos/undefined
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
  }

  /*cargarConteoCursos(): void {
    this.courseService.obtenerConteoCursos().subscribe({
      next: (count) => {
        this.totalCursos = count;
        this.totalPages = Math.ceil(this.totalCursos / this.itemsPerPage);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.totalCursos = 0;
        this.itemsPerPage = 5;
        localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
        this.notificationService.showNotification(
          'Error al cargar el conteo de cursos: ' + err.message,
          'error'
        );
        console.error('Error al cargar conteo:', err);
      },
    });
  }*/

  cargarCursos(): void {
  this.isLoading = true;

  if (this.keyword.trim()) {
    this.buscarCursos();
    return;
  }

  this.courseService
    .obtenerListaCursosSinOrden(this.page, this.itemsPerPage)
    .subscribe({
      next: (response) => {
        this.cursos = response.content || [];
        this.totalCursos = response.totalElements;
        this.totalPages = Math.ceil(this.totalCursos / this.itemsPerPage);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cursos = [];
        this.totalCursos = 0;
        this.notificationService.showNotification('Error al cargar cursos', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  buscarCursos(): void {
  if (!this.isKeywordValid()) {
    this.notificationService.showNotification(
      SEARCH_VALIDATION_MESSAGES.NO_NUMBERS_INVALID_FORMAT,
      'info'
    );
    return;
  }

  if (!this.keyword.trim()) {
    this.cargarCursos();
    return;
  }

  this.isLoading = true;

  this.courseService
    .buscarCursos(this.keyword.trim(), this.sortBy, this.sortDir)
    .subscribe({
      next: (resultado) => {
        this.cursos = resultado;
        this.totalCursos = resultado.length;
        this.totalPages = Math.ceil(this.totalCursos / this.itemsPerPage);

        if (resultado.length === 0) {
          this.notificationService.showNotification(
            'No se encontraron cursos.',
            'info'
          );
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cursos = [];
        this.totalCursos = 0;
        this.notificationService.showNotification('Error en búsqueda', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
}

  openViewModal(curso: Curso) {
    this.modal = {
      open: true,
      type: 'form',
      title: 'Detalle del Curso',
      data: { ...curso, competencias: curso.competencias || [] },
      isReadOnly: true, // ← MODO SOLO LECTURA
      size: 'max-w-2xl',
      buttons: [], // El formulario pone "Cancelar" solo
    };
  }
}