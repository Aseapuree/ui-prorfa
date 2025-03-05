import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogModule } from '@angular/material/dialog';
import { MatInput } from '@angular/material/input'
import { MatFormField, MatLabel } from '@angular/material/form-field'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../../../services/course.service';
import { ModalService } from './modal.service';
import { MatButtonModule } from '@angular/material/button';

const MATERIAL_MODULES = [MatLabel, MatFormField, MatInput, MatDialogModule, MatButtonModule]

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [ReactiveFormsModule, MATERIAL_MODULES],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements OnInit {
  contactForm!: FormGroup;

  private readonly _fb = inject(FormBuilder);
  private readonly _matDialog = inject(MAT_DIALOG_DATA);
  private readonly _contactSVC = inject(CourseService);
  private readonly _modalSvc = inject(ModalService);

  ngOnInit(): void {
    console.log('ModalComponent iniciado'); // Depuración
    this._builForm();
    console.log("Datos recibidos en el modal:", this._matDialog); // Depuración: Verifica los datos
  
    if (this._matDialog.isEditing && this._matDialog.data) {
      const curso = this._matDialog.data;
      console.log("Curso recibido para editar:", curso); // Depuración: Verifica el ID
      this.contactForm.patchValue({
        ...curso,
        fechaCreacion: curso.fechaCreacion ? new Date(curso.fechaCreacion).toISOString().split('T')[0] : '',
        fechaActualizacion: curso.fechaActualizacion ? new Date(curso.fechaActualizacion).toISOString().split('T')[0] : '',
      });
    }
  }
  

  async onSubmit() {
    const curso = this.contactForm.value;
    console.log("Datos del formulario antes de formatear:", curso); // Depuración
  
    // Formatear fechas correctamente
    curso.fechaCreacion = curso.fechaCreacion ? new Date(curso.fechaCreacion).toISOString().slice(0, 19) : null;
    curso.fechaActualizacion = new Date().toISOString().slice(0, 19);
  
    console.log("Datos del formulario después de formatear:", curso); // Depuración
  
    if (this._matDialog.isEditing) {
      if (curso.idCurso) {
        console.log("Editando curso:", curso); // Depuración
  
        // Enviar campos
        const datosParaEnviar = {
          idCurso: curso.idCurso,
          nombre: curso.nombre,
          descripcion: curso.descripcion,
          grado: curso.grado,
          fechaCreacion: curso.fechaCreacion,
          fechaActualizacion: curso.fechaActualizacion
        };
  
        this._contactSVC.actualizarCurso(curso.idCurso, datosParaEnviar).subscribe({
          next: () => this._modalSvc.closeModal(),
          error: (err) => console.error('Error al actualizar curso:', err)
        });
      } else {
        console.error('ID no definido');
      }
    } else {
      console.log("Agregando curso:", curso); 
      this._contactSVC.agregarCurso(curso).subscribe({
        next: () => this._modalSvc.closeModal(),
        error: (err) => console.error('Error al agregar curso:', err)
      });
    }
  }
  

  getTitle(): string {
    return this._matDialog.isEditing ? 'Editar Curso' : 'Agregar Curso';
  }

  private _builForm(): void {
    this.contactForm = this._fb.group({
      idCurso: [this._matDialog?.idCurso || ''],
      nombre: [this._matDialog?.nombre || '', Validators.required],
      descripcion: [this._matDialog?.descripcion || '', Validators.required],
      grado: [this._matDialog?.grado || '', Validators.required],
      fechaCreacion: [this._matDialog?.fechaCreacion || '', Validators.required],
      fechaActualizacion: [this._matDialog?.fechaActualizacion || '']
    });
  
    // Formatear fechaCreacion si está presente
    if (this._matDialog?.fechaCreacion) {
      const fechaCreacionFormateada = new Date(this._matDialog.fechaCreacion).toISOString().slice(0, 16);
      this.contactForm.patchValue({ fechaCreacion: fechaCreacionFormateada });
    }
  }

 
  
}

  
