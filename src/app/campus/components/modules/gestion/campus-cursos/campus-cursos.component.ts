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


@Component({
  selector: 'app-campus-cursos',
  standalone: true,
  imports: [RouterModule,GeneralLoadingSpinnerComponent,TooltipComponent,PaginationComponent, HttpClientModule,CommonModule, NgxPaginationModule, FontAwesomeModule, FormsModule,NotificationComponent],
  providers: [CourseService],
  templateUrl: './campus-cursos.component.html',
  styleUrl: './campus-cursos.component.scss'
})
export class CampusCursosComponent {
  public page: number = 1;
  public itemsPerPage: number = 5; // Valor inicial
  public pageSizeOptions: number[] = []; // Opciones dinámicas para el selector
  totalPages: number = 1;
  cursos: Curso[] = [];
  keyword: string = '';
  totalCursos: number = 0;
  private lastValidKeyword: string = '';
  sortBy: string = 'fechaCreacion';
  sortDir: string = 'asc';
  isLoading: boolean = false;
  

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
    // Cargar itemsPerPage desde localStorage si existe
    const savedItemsPerPage = localStorage.getItem('itemsPerPage');
    if (savedItemsPerPage) {
      this.itemsPerPage = parseInt(savedItemsPerPage, 10);
    }
    this.cargarConteoCursos();
    this.cargarCursos();
  }

  // Calcular opciones dinámicas para el selector de itemsPerPage
  // Calcular opciones dinámicas para el selector de itemsPerPage
  private updatePageSizeOptions(): void {
    const previousItemsPerPage = this.itemsPerPage;
    this.pageSizeOptions = [];
    const increment = 5;
    for (let i = increment; i <= this.totalCursos; i += increment) {
      this.pageSizeOptions.push(i);
    }

    // Asegurar que itemsPerPage sea válido sin resetearlo innecesariamente
    if (this.pageSizeOptions.length > 0) {
      // Mantener itemsPerPage si es válido, de lo contrario usar la opción más cercana
      if (!this.pageSizeOptions.includes(this.itemsPerPage)) {
        // Buscar la opción más cercana que sea menor o igual a totalCursos
        const validOption = this.pageSizeOptions
          .filter(option => option <= this.totalCursos)
          .reduce((prev, curr) => (Math.abs(curr - this.itemsPerPage) < Math.abs(prev - this.itemsPerPage) ? curr : prev), this.pageSizeOptions[0]);
        this.itemsPerPage = validOption;
        localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
        console.log(`itemsPerPage cambiado de ${previousItemsPerPage} a ${this.itemsPerPage} porque no estaba en pageSizeOptions:`, this.pageSizeOptions);
      }
    } else {
      this.pageSizeOptions = [5]; // Opción por defecto si no hay cursos
      this.itemsPerPage = 5;
      localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
      console.log(`itemsPerPage establecido a 5 porque no hay cursos. pageSizeOptions:`, this.pageSizeOptions);
    }
  }

  // Actualizar itemsPerPage cuando el usuario selecciona una nueva opción
  onItemsPerPageChange(newSize: number): void {
    console.log(`onItemsPerPageChange: Cambiando itemsPerPage a ${newSize}`);
    this.itemsPerPage = newSize;
    localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
    this.page = 1; // Reiniciar a la primera página
    this.cargarCursos();
  }

  // Validar si el keyword cumple con el regex (para búsqueda)
  isKeywordValid(): boolean {
    if (!this.keyword) return true; // Permitir campo vacío
    const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+( [a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$/;
    return regex.test(this.keyword.trim());
  }

  // Manejar la entrada del usuario
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    // Bloquear espacios al inicio
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

    // Normalizar el valor: reemplazar múltiples espacios por un solo espacio
    newValue = newValue.replace(/\s+/g, ' ');

    // Si el valor está vacío, permitirlo
    if (newValue === '') {
      this.keyword = '';
      this.lastValidKeyword = '';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    // Permitir un espacio después de una palabra como estado intermedio
    const intermediateRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+( [a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]*)*$/;
    if (!intermediateRegex.test(newValue)) {
      // Restaurar el último valor válido
      input.value = this.lastValidKeyword;
      this.keyword = this.lastValidKeyword;
      this.notificationService.showNotification(
        'Solo se permiten letras, números, acentos, ñ y un solo espacio entre palabras.',
        'info'
      );
      this.cdr.detectChanges();
      return;
    }

    // Si el valor es válido, actualizar keyword y lastValidKeyword
    this.keyword = newValue;
    this.lastValidKeyword = newValue.trim(); // Guardar versión sin espacio final
    input.value = this.keyword; // Asegurar que el input refleja el valor válido
    this.cdr.detectChanges();
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
            // Asegurar que la página actual sea válida
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
        // Paginación manual: tomar los elementos de la página actual
        const startIndex = (this.page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.cursos = resultado.slice(startIndex, endIndex);
        this.updatePageSizeOptions();
        // Asegurar que la página actual sea válida
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