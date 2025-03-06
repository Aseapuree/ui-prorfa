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


@Component({
  selector: 'app-campus-cursos',
  standalone: true,
  imports: [RouterModule, HttpClientModule,CommonModule, NgxPaginationModule, FontAwesomeModule, FormsModule],
  providers: [CourseService],
  templateUrl: './campus-cursos.component.html',
  styleUrl: './campus-cursos.component.scss'
})
export class CampusCursosComponent {
  public page: number = 1;
  totalPages: number = 2;
  cursos: Curso[] = [];
  keyword: string = '';

  constructor(
    private modalService: ModalService,
    private courseService: CourseService,
    private dialog: MatDialog, 
    private cdr: ChangeDetectorRef
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


  openAddModal() {
    const dialogRef = this.dialog.open(ModalComponent, {
      width: '600px',
      data: { isEditing: false }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const nuevoCurso: Curso = {
          nombre: result.nombre,
          descripcion: result.descripcion,
          grado: result.grado
          // No incluir fechaCreacion ni fechaActualizacion
        };
  
        this.courseService.agregarCurso(nuevoCurso).subscribe({
          next: () => this.cargarCursos(),
          error: (err) => console.error('Error al agregar curso:', err)
        });
      }
    });
  }
  
  
  openEditModal(curso: Curso) {
    console.log("Curso a editar:", curso); // Verificar el curso antes de editar
  
    if (!curso.idCurso) {
      console.error("El curso no tiene un ID definido:", curso);
      return;
    }
  
    const dialogRef = this.dialog.open(ModalComponent, {
      width: '600px',
      data: { ...curso, isEditing: true }
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const cursoEditado: Partial<Curso> = {
          nombre: result.nombre,
          descripcion: result.descripcion,
          grado: result.grado
        };
  
        this.courseService.actualizarCurso(curso.idCurso!, cursoEditado).subscribe({
          next: () => {
            this.cargarCursos();
            console.log('Curso actualizado correctamente');
          },
          error: (err) => console.error('Error al actualizar curso:', err),
        });
      }
    });
  }
  
  

eliminarCurso(idCurso: string): void {
  const dialogRef = this._dialog.open(DialogoConfirmacionComponent, {
    width: '1px',
    height: '1px',
    data: { message: '¿Estás seguro de que quieres eliminar este curso?' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this._courseSVC.eliminarCurso(idCurso).subscribe({
        next: () => {
          this.cargarCursos();
          console.log('Curso eliminado correctamente');
        },
        error: (err) => console.error('Error al eliminar curso:', err)
      });
    }
  });
}
    // Hacer funcionar el
    cargarCursos(): void {
      console.log("Cargando cursos...");
      this.courseService.obtenerListaCursos().subscribe({
        next: (cursos) => {
          console.log("Cursos obtenidos:", cursos);
          this.cursos = cursos; // Actualiza la lista de cursos
          this.cdr.detectChanges(); // 👈 Forzar la actualización de la vista
        },
        error: (err) => console.error('Error al cargar cursos:', err)
      });
    }
    
  
  
  buscarCursos() {
    console.log("Buscando cursos con keyword:", this.keyword);
    this.courseService.buscarCursos(this.keyword).subscribe(
      (resultado) => {
        console.log("Resultados de la búsqueda:", resultado);
        this.cursos = resultado;
        this.page = 1; 
        this.cdr.detectChanges(); 
      },
      (error) => console.error("Error en la búsqueda:", error)
    );
  }
  
}