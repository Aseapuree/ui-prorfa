import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogContent, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Curso } from '../../../../interface/curso';
import { Usuario, ProfesorCurso } from '../../../../interface/ProfesorCurso';
import { CourseService } from '../../../../services/course.service';
import { ProfesorCursoService } from '../../../../services/profesor-curso.service';
import { UsuarioService } from '../../../../services/usuario.service';


const MATERIAL_MODULES = [
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatSelectModule,
  MatDialogContent
];

@Component({
  selector: 'app-modal-profesor-curso',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MATERIAL_MODULES],
  templateUrl: './modal-profesor-curso.component.html',
  styleUrl: './modal-profesor-curso.component.scss'
})
export class ModalProfesorCursoComponent implements OnInit {
  contactForm!: FormGroup;
  usuarios: Usuario[] = [];
  cursos: Curso[] = [];

  private readonly _fb = inject(FormBuilder);
  private readonly _matDialog = inject(MAT_DIALOG_DATA);
  private readonly _profesorCursoService = inject(ProfesorCursoService);
  private readonly _usuarioService = inject(UsuarioService);
  private readonly _courseService = inject(CourseService);
  private readonly _dialogRef = inject(MatDialogRef<ModalProfesorCursoComponent>);

  ngOnInit(): void {
    this._buildForm();
    this.loadUsuarios();
    this.loadCursos();

    if (this._matDialog.isEditing && this._matDialog) {
      this.contactForm.patchValue({
        idProfesorCurso: this._matDialog.idProfesorCurso,
        usuario: this._matDialog.usuario, // El objeto usuario completo
        curso: this._matDialog.curso,     // El objeto curso completo
        grado: this._matDialog.grado,
        seccion: this._matDialog.seccion,
        nivel: this._matDialog.nivel
      });
    }
  }

  private loadUsuarios(): void {
    this._usuarioService.obtenerListaUsuario().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        // Si estamos en modo edición, seleccionamos el usuario correcto
        if (this._matDialog.isEditing && this._matDialog.usuario) {
          const usuarioSeleccionado = this.usuarios.find(
            (u) => u.idusuario === this._matDialog.usuario.idusuario
          );
          if (usuarioSeleccionado) {
            this.contactForm.patchValue({ usuario: usuarioSeleccionado });
          }
        }
      },
      error: (err) => console.error('Error loading usuarios:', err)
    });
  }

  private loadCursos(): void {
    this._courseService.obtenerListaCursos(1, 100, 'nombre', 'asc').subscribe({
      next: (response) => {
        this.cursos = response.content;
        // Si estamos en modo edición, seleccionamos el curso correcto
        if (this._matDialog.isEditing && this._matDialog.curso) {
          const cursoSeleccionado = this.cursos.find(
            (c) => c.idCurso === this._matDialog.curso.idCurso
          );
          if (cursoSeleccionado) {
            this.contactForm.patchValue({ curso: cursoSeleccionado });
          }
        }
      },
      error: (err) => console.error('Error al cargar cursos:', err)
    });
  }

  async onSubmit() {
    if (this.contactForm.invalid) return;

    const asignacion: ProfesorCurso = this.contactForm.value;

    if (this._matDialog.isEditing && asignacion.idProfesorCurso) {
      this._profesorCursoService.editarCurso(asignacion.idProfesorCurso, asignacion).subscribe({
        next: (asignacionActualizada) => {
          this._dialogRef.close(asignacionActualizada);
        },
        error: (err) => console.error('Error al actualizar asignación:', err)
      });
    } else {
      this._profesorCursoService.agregarCurso(asignacion).subscribe({
        next: (asignacionAgregada) => {
          this._dialogRef.close(asignacionAgregada);
        },
        error: (err) => console.error('Error al agregar asignación:', err)
      });
    }
  }

  getTitle(): string {
    return this._matDialog.isEditing ? 'Editar Asignación' : 'Agregar Asignación';
  }

  private _buildForm(): void {
    this.contactForm = this._fb.group({
      idProfesorCurso: [''],
      usuario: ['', Validators.required],
      curso: ['', Validators.required],
      grado: ['', Validators.required],
      seccion: ['', Validators.required],
      nivel: ['', Validators.required]
    });
  }
}
