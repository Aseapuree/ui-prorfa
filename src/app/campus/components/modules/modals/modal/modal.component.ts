import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInput, MatInputModule } from '@angular/material/input'
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../../../services/course.service';
import { ModalService } from './modal.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Curso } from '../../../../interface/curso';

const MATERIAL_MODULES = [
  MatDialogModule,
  MatFormFieldModule, // Agregar para mat-error y mat-label
  MatInputModule,     // Agregar para matInput
  MatButtonModule,
  MatDialogContent
];

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule, MATERIAL_MODULES],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements OnInit {
  contactForm!: FormGroup;

  private readonly _fb = inject(FormBuilder);
  private readonly _matDialog = inject(MAT_DIALOG_DATA);
  private readonly _contactSVC = inject(CourseService);
  private readonly _modalSvc = inject(ModalService);
  private readonly _dialogRef = inject(MatDialogRef<ModalComponent>);

  ngOnInit(): void {
    this._buildForm();
    if (this._matDialog.isEditing && this._matDialog) {
      this.contactForm.patchValue({
        idCurso: this._matDialog.idCurso,
        nombre: this._matDialog.nombre,
        descripcion: this._matDialog.descripcion,
        abreviatura: this._matDialog.abreviatura,
      });
    }
  }

  async onSubmit() {
    if (this.contactForm.invalid) return;

    const curso: Curso = this.contactForm.value;

    if (this._matDialog.isEditing && curso.idCurso) {
      this._contactSVC.actualizarCurso(curso.idCurso, curso).subscribe({
        next: (cursoActualizado) => {
          this._dialogRef.close(cursoActualizado); // Cerrar el modal y devolver el curso actualizado
        },
        error: (err) => {
          console.error('Error al actualizar curso:', err);
        },
      });
    } else {
      this._contactSVC.agregarCurso(curso).subscribe({
        next: (cursoAgregado) => {
          this._dialogRef.close(cursoAgregado); // Cerrar el modal y devolver el curso agregado
        },
        error: (err) => {
          console.error('Error al agregar curso:', err);
        },
      });
    }
  }

  getTitle(): string {
    return this._matDialog.isEditing ? 'Editar Curso' : 'Agregar Curso';
  }

  private _buildForm(): void {
    this.contactForm = this._fb.group({
      idCurso: [''],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      abreviatura: ['', Validators.required],
    });
  }
}

  
