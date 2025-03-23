import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { CourseService } from '../../../../services/course.service';
import { ModalSesionService } from './modal-sesion.service';
import { Sesion } from '../../../../interface/sesion';
import { SesionService } from '../../../../services/sesion.service';

const MATERIAL_MODULES = [MatLabel, MatFormField, MatInput, MatDialogModule, MatButtonModule]

@Component({
  selector: 'app-modal-sesion',
  standalone: true,
  imports: [ReactiveFormsModule, MATERIAL_MODULES],
  templateUrl: './modal-sesion.component.html',
  styleUrl: './modal-sesion.component.scss'
})
export class ModalSesionComponent implements OnInit{
  sesionForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sesionService: SesionService,
    public dialogRef: MatDialogRef<ModalSesionComponent>
  ) {}

  ngOnInit(): void {
    this._buildForm();
    if (this.data.isEditing && this.data.sesion) {
      this.sesionForm.patchValue(this.data.sesion);
    }
  }

  private _buildForm(): void {
    this.sesionForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.sesionForm.invalid) {
      return;
    }
  
    const sesionData = {
      ...this.sesionForm.value,
      idSesion: this.data.isEditing ? this.data.sesion.idSesion : undefined, // Incluir ID al editar
      profesorGuardar: this.data.idProfesorCurso,
    };
  
    console.log('Datos enviados:', sesionData);
  
    if (this.data.isEditing) {
      this.sesionService.editarSesion(this.data.sesion.idSesion, sesionData).subscribe({
        next: (response) => {
          console.log('Sesión editada:', response);
          this.dialogRef.close(true);
        },
        error: (err) => console.error('Error al editar sesión:', err),
      });
    } else {
      this.sesionService.agregarSesion(sesionData).subscribe({
        next: (response) => {
          console.log('Sesión agregada:', response);
          this.dialogRef.close(true);
        },
        error: (err) => console.error('Error al agregar sesión:', err),
      });
    }
  }
}
