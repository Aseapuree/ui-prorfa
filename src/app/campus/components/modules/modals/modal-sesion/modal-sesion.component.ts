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
import { NotificationService } from '../../../shared/notificaciones/notification.service';
import { AlertComponent } from '../../../shared/alert/alert.component';
import { CommonModule } from '@angular/common';

const MATERIAL_MODULES = [MatLabel, MatFormField, MatInput, MatDialogModule, MatButtonModule]

@Component({
  selector: 'app-modal-sesion',
  standalone: true,
  imports: [ReactiveFormsModule, MATERIAL_MODULES,AlertComponent, CommonModule],
  templateUrl: './modal-sesion.component.html',
  styleUrl: './modal-sesion.component.scss'
})
export class ModalSesionComponent implements OnInit{
  sesionForm!: FormGroup;
  titleError: string | null = null; // Para almacenar el mensaje de error del título duplicado

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sesionService: SesionService,
    public dialogRef: MatDialogRef<ModalSesionComponent>,
    private notificationService: NotificationService
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

    // Limpiar el mensaje de error cuando el usuario cambie el título
    this.sesionForm.get('titulo')?.valueChanges.subscribe(() => {
      this.titleError = null;
    });
  }

  onSubmit(): void {
    if (this.sesionForm.invalid) {
      let errorMessages: string[] = [];
      if (this.sesionForm.get('titulo')?.hasError('required')) {
        errorMessages.push('El título es requerido');
      }
      if (this.sesionForm.get('descripcion')?.hasError('required')) {
        errorMessages.push('La descripción es requerida');
      }
      this.notificationService.showNotification(errorMessages.join(' y '), 'error');
      return;
    }
  
    const sesionData: Sesion = {
      ...this.sesionForm.value,
      idSesion: this.data.isEditing ? this.data.sesion.idSesion : undefined,
      profesorGuardar: this.data.idProfesorCurso,
    };
  
    if (this.data.isEditing) {
      this.sesionService.editarSesion(this.data.sesion.idSesion, sesionData).subscribe({
        next: (response) => {
          this.notificationService.showNotification('Sesión actualizada con éxito', 'success');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error al editar la sesión';
          if (errorMessage.includes('Ya existe una sesión con el título')) {
            this.titleError = errorMessage;
          } else {
            this.notificationService.showNotification(errorMessage, 'error');
          }
          console.error('Error al editar sesión:', err);
        },
      });
    } else {
      this.sesionService.agregarSesion(sesionData).subscribe({
        next: (response) => {
          this.notificationService.showNotification('Sesión agregada con éxito', 'success');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error al agregar la sesión';
          if (errorMessage.includes('Ya existe una sesión con el título')) {
            this.titleError = errorMessage;
          } else {
            this.notificationService.showNotification(errorMessage, 'error');
          }
          console.error('Error al agregar sesión:', err);
        },
      });
    }
  }
}

