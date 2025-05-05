import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CourseService } from '../../../../services/course.service';
import { Curso } from '../../../../interface/curso';
import { CommonModule } from '@angular/common';
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
import { ColumnConfig, TableComponent } from '../../../../../general/components/table/table.component';


@Component({
  selector: 'app-campus-cursos',
  standalone: true,
  imports: [RouterModule,TableComponent,GeneralLoadingSpinnerComponent,TooltipComponent,PaginationComponent, HttpClientModule,CommonModule, NgxPaginationModule, FontAwesomeModule, FormsModule,NotificationComponent],
  providers: [CourseService],
  templateUrl: './campus-cursos.component.html',
  styleUrl: './campus-cursos.component.scss'
})
export class CampusCursosComponent {
  public page: number = 1;
  public itemsPerPage: number = 5;
  public pageSizeOptions: number[] = [];
  totalPages: number = 1;
  cursos: Curso[] = [];
  keyword: string = '';
  totalCursos: number = 0;
  private lastValidKeyword: string = '';
  sortBy: string = 'fechaCreacion';
  sortDir: string = 'asc';
  isLoading: boolean = false;

  // Configuración de columnas para la tabla: sortable true mostar para habilitar el ordenamiento, type: text para texto, date para fecha
  // maxWidth: 150 para limitar el ancho de la columna
  tableColumns: ColumnConfig[] = [
    { field: 'nombre', header: 'Nombre', maxWidth: 150, sortable: true, type: 'text' },
    { field: 'descripcion', header: 'Descripción', maxWidth: 200, sortable: true, type: 'text' },
    { field: 'abreviatura', header: 'Abreviatura', maxWidth: 100, sortable: false, type: 'text' },
    { field: 'fechaCreacion', header: 'Fecha de Creación', maxWidth: 120, sortable: true, type: 'date' },
    { field: 'fechaActualizacion', header: 'Fecha Actualización', maxWidth: 120, sortable: true, type: 'date' }
  ];

  constructor(
    private modalService: ModalService,
    private courseService: CourseService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  private readonly _dialog = inject(MatDialog);
  private readonly _courseSVC = inject(CourseService);

  ngOnInit(): void {
    const savedItemsPerPage = localStorage.getItem('itemsPerPage');
    if (savedItemsPerPage) {
      this.itemsPerPage = parseInt(savedItemsPerPage, 10);
    }
    this.cargarConteoCursos();
    this.cargarCursos();
  }

  private updatePageSizeOptions(): void {
    const previousItemsPerPage = this.itemsPerPage;
    this.pageSizeOptions = [];
    const increment = 5;
    for (let i = increment; i <= this.totalCursos; i += increment) {
      this.pageSizeOptions.push(i);
    }

    if (this.pageSizeOptions.length > 0) {
      if (!this.pageSizeOptions.includes(this.itemsPerPage)) {
        const validOption = this.pageSizeOptions
          .filter(option => option <= this.totalCursos)
          .reduce((prev, curr) => (Math.abs(curr - this.itemsPerPage) < Math.abs(prev - this.itemsPerPage) ? curr : prev), this.pageSizeOptions[0]);
        this.itemsPerPage = validOption;
        localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
        console.log(`itemsPerPage cambiado de ${previousItemsPerPage} a ${this.itemsPerPage}`);
      }
    } else {
      this.pageSizeOptions = [5];
      this.itemsPerPage = 5;
      localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
      console.log(`itemsPerPage establecido a 5 porque no hay cursos`);
    }
  }

  onItemsPerPageChange(newSize: number): void {
    console.log(`onItemsPerPageChange: Cambiando itemsPerPage a ${newSize}`);
    this.itemsPerPage = newSize;
    localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
    this.page = 1;
    this.cargarCursos();
  }

  isKeywordValid(): boolean {
    if (!this.keyword) return true;
    const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+( [a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$/;
    return regex.test(this.keyword.trim());
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    if (newValue.startsWith(' ')) {
      input.value = this.lastValidKeyword;
      this.keyword = this.lastValidKeyword;
      this.notificationService.showNotification(
        'No se permiten espacios al inicio.',
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

    const intermediateRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+( [a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]*)*$/;
    if (!intermediateRegex.test(newValue)) {
      input.value = this.lastValidKeyword;
      this.keyword = this.lastValidKeyword;
      this.notificationService.showNotification(
        'Solo se permiten letras, números, acentos, ñ y un solo espacio entre palabras.',
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

  onSortChange(event: { sortBy: string, sortDir: string }): void {
    this.sortBy = event.sortBy;
    this.sortDir = event.sortDir;
    this.page = 1;
    this.cargarCursos();
  }

  cargarConteoCursos(): void {
    this.courseService.obtenerConteoCursos().subscribe({
      next: (count) => {
        this.totalCursos = count;
        this.updatePageSizeOptions();
        this.totalPages = Math.ceil(this.totalCursos / this.itemsPerPage);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.totalCursos = 0;
        this.pageSizeOptions = [5];
        this.itemsPerPage = 5;
        localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
        this.notificationService.showNotification('Error al cargar el conteo de cursos: ' + err.message, 'error');
        console.error('Error al cargar conteo:', err);
      },
    });
  }

  cargarCursos(): void {
    this.isLoading = true;

    if (this.keyword.trim()) {
      this.buscarCursos();
    } else {
      this.courseService
        .obtenerListaCursos(this.page, this.itemsPerPage, this.sortBy, this.sortDir)
        .subscribe({
          next: (response) => {
            this.cursos = response.content || [];
            this.totalCursos = response.totalElements;
            this.totalPages = Math.ceil(this.totalCursos / this.itemsPerPage);
            this.updatePageSizeOptions();
            if (this.page > this.totalPages) {
              this.page = 1;
              this.cargarCursos();
              return;
            }
            this.cdr.detectChanges();
            this.isLoading = false;
          },
          error: (err) => {
            this.cursos = [];
            this.totalPages = 1;
            this.notificationService.showNotification('Error al cargar cursos: ' + err.message, 'error');
            this.cdr.detectChanges();
            this.isLoading = false;
          },
        });
    }
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
      this.cargarCursos();
    }
  }

  openAddModal(): void {
    const dialogRef = this.dialog.open(ModalComponent, {
      width: '600px',
      data: { isEditing: false },
    });

    dialogRef.afterClosed().subscribe((cursoAgregado: Curso) => {
      if (cursoAgregado) {
        this.cargarCursos();
        this.cargarConteoCursos();
        this.notificationService.showNotification(
          'Curso agregado con éxito',
          'success'
        );
      }
    });
  }

  openEditModal(curso: Curso): void {
    if (!curso.idCurso) {
      this.notificationService.showNotification(
        'El curso no tiene un ID válido',
        'error'
      );
      return;
    }

    const dialogRef = this.dialog.open(ModalComponent, {
      width: '600px',
      data: { ...curso, isEditing: true },
    });

    dialogRef.afterClosed().subscribe((cursoActualizado: Curso) => {
      if (cursoActualizado) {
        this.cargarCursos();
        this.cargarConteoCursos();
        this.notificationService.showNotification(
          'Curso actualizado con éxito',
          'success'
        );
      }
    });
  }

  eliminarCurso(idCurso: string): void {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '1px',
      height: '1px',
      data: { message: '¿Estás seguro de que quieres eliminar este curso?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.courseService.eliminarCurso(idCurso).subscribe({
          next: () => {
            this.cargarCursos();
            this.cargarConteoCursos();
            this.notificationService.showNotification(
              'Curso eliminado con éxito',
              'success'
            );
          },
          error: (err) => {
            this.notificationService.showNotification(
              'Error al eliminar curso: ' + err.message,
              'error'
            );
            console.error('Error al eliminar curso:', err);
          },
        });
      }
    });
  }

  buscarCursos(): void {
    if (!this.isKeywordValid()) {
      this.notificationService.showNotification(
        'El término de búsqueda no es válido. Use solo letras, números, acentos, ñ y un solo espacio entre palabras.',
        'info'
      );
      return;
    }

    if (!this.keyword.trim()) {
      this.cargarCursos();
      return;
    }

    this.isLoading = true;
    this.courseService.buscarCursos(this.keyword.trim(), this.sortBy, this.sortDir).subscribe({
      next: (resultado) => {
        this.totalCursos = resultado.length;
        this.totalPages = Math.ceil(this.totalCursos / this.itemsPerPage);
        const startIndex = (this.page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.cursos = resultado.slice(startIndex, endIndex);
        this.updatePageSizeOptions();
        if (this.page > this.totalPages) {
          this.page = 1;
          this.buscarCursos();
          return;
        }
        this.cdr.detectChanges();
        this.isLoading = false;
      },
      error: (err) => {
        this.cursos = [];
        this.totalCursos = 0;
        this.totalPages = 1;
        this.notificationService.showNotification('Error al buscar cursos: ' + err.message, 'error');
        console.error('Error en la búsqueda:', err);
        this.isLoading = false;
      },
    });
  }
}