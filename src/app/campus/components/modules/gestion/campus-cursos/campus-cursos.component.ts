import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CourseService } from '../../../../services/course.service';
import { Curso } from '../../../../interface/Curso';
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
  totalPages: number = 2; // Inicializamos en 0 y lo calcularemos dinámicamente
  cursos: Curso[] = [];
  keyword: string = '';

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
    this.cargarCursos();
  }
  

  previousPage() {
    if (this.page > 1) {
      this.page--;
    }
  }
  
  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

   // Hacer funcionar el
   cargarCursos(): void {
    this.courseService.obtenerListaCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos || [];
        this.totalPages = Math.ceil(this.cursos.length / 12);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cursos = [];
        this.totalPages = 0;
        this.notificationService.showNotification('Error al cargar cursos', 'error');
        this.cdr.detectChanges();
      },
    });
  }


  openAddModal(): void {
    const dialogRef = this.dialog.open(ModalComponent, {
      width: '600px',
      data: { isEditing: false },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const nuevoCurso: Curso = {
          nombre: result.nombre,
          descripcion: result.descripcion,
          grado: result.grado,
        };

        this.courseService.agregarCurso(nuevoCurso).subscribe({
          next: (cursoAgregado) => {
            this.cursos.push(cursoAgregado); // Agregar el nuevo curso a la lista localmente
            this.totalPages = Math.ceil(this.cursos.length / 12);
            this.notificationService.showNotification('Curso agregado con éxito', 'success');
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.notificationService.showNotification('Error al agregar curso', 'error');
            console.error('Error al agregar curso:', err);
          },
        });
      }
    });
  }
  
  openEditModal(curso: Curso): void {
    if (!curso.idCurso) {
      this.notificationService.showNotification('El curso no tiene un ID válido', 'error');
      return;
    }

    const dialogRef = this.dialog.open(ModalComponent, {
      width: '600px',
      data: { ...curso, isEditing: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const cursoEditado: Partial<Curso> = {
          nombre: result.nombre,
          descripcion: result.descripcion,
          grado: result.grado,
        };

        this.courseService.actualizarCurso(curso.idCurso!, cursoEditado).subscribe({
          next: () => {
            this.cargarCursos(); // Recargar la lista de cursos
            this.notificationService.showNotification('Curso actualizado con éxito', 'success');
          },
          error: (err) => {
            this.notificationService.showNotification('Error al actualizar curso', 'error');
            console.error('Error al actualizar curso:', err);
          },
        });
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
            this.notificationService.showNotification('Curso eliminado con éxito', 'error'); // Rojo para eliminación
          },
          error: (err) => {
            this.notificationService.showNotification('Error al eliminar curso', 'error');
            console.error('Error al eliminar curso:', err);
          },
        });
      }
    });
  }
   
  
  buscarCursos() {
    if (!this.keyword.trim()) {
      this.cargarCursos(); // Si no hay keyword, cargar todos los cursos
      return;
    }

    this.courseService.buscarCursos(this.keyword).subscribe({
      next: (resultado) => {
        this.cursos = resultado;
        this.totalPages = Math.ceil(this.cursos.length / 12);
        this.page = 1;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showNotification('Error al buscar cursos', 'error');
        console.error('Error en la búsqueda:', err);
      },
    });
  }
  
}