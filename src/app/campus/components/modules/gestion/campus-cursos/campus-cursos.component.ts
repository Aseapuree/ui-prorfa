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


@Component({
  selector: 'app-campus-cursos',
  standalone: true,
  imports: [RouterModule, HttpClientModule,CommonModule, NgxPaginationModule, FontAwesomeModule, FormsModule,NotificationComponent],
  providers: [CourseService],
  templateUrl: './campus-cursos.component.html',
  styleUrl: './campus-cursos.component.scss'
})
export class CampusCursosComponent {
  public page: number = 1;
  public itemsPerPage: number = 12;
  totalPages: number = 1;
  cursos: Curso[] = [];
  keyword: string = '';
  totalCursos: number = 0;

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
    this.cargarConteoCursos();
    this.cargarCursos();
  }

  cargarConteoCursos(): void {
    this.courseService.obtenerConteoCursos().subscribe({
      next: (count) => {
        this.totalCursos = count;
        this.totalPages = Math.ceil(this.totalCursos / this.itemsPerPage);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.totalCursos = 0;
        this.notificationService.showNotification(
          'Error al cargar el conteo de cursos: ' + err.message,
          'error'
        );
        console.error('Error al cargar conteo:', err);
      },
    });
  }

  cargarCursos(): void {
    this.courseService.obtenerListaCursos(this.page, this.itemsPerPage).subscribe({
      next: (response) => {
        this.cursos = response.content || [];
        this.totalCursos = response.totalElements;
        this.totalPages = Math.ceil(this.totalCursos / this.itemsPerPage);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cursos = [];
        this.totalPages = 1;
        this.notificationService.showNotification(
          'Error al cargar cursos: ' + err.message,
          'error'
        );
        this.cdr.detectChanges();
      },
    });
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.cargarCursos();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.cargarCursos();
    }
  }

  onPageChange(page: number) {
    this.page = page;
    this.cargarCursos();
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

  buscarCursos() {
    if (!this.keyword.trim()) {
      this.cargarCursos();
      return;
    }

    this.courseService.buscarCursos(this.keyword).subscribe({
      next: (resultado) => {
        this.cursos = resultado;
        this.totalPages = Math.ceil(this.cursos.length / this.itemsPerPage);
        this.page = 1;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showNotification(
          'Error al buscar cursos: ' + err.message,
          'error'
        );
        console.error('Error en la búsqueda:', err);
      },
    });
  }
}