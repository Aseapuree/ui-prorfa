import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog'; // Importar MatDialogModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { SesionService } from '../../../../services/sesion.service';
import { MatButtonModule } from '@angular/material/button';
import { DTOActividad } from '../../../../interface/DTOActividad';

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatDialogModule,
  MatButtonModule,
  MatProgressSpinnerModule,
];

@Component({
  selector: 'app-modal-actividad',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ...MATERIAL_MODULES], // Agregar MatDialogModule
  templateUrl: './modal-actividad.component.html',
  styleUrl: './modal-actividad.component.scss'
})
export class ModalActividadComponent implements OnInit {
  formulario: FormGroup;
  archivoSeleccionado: File | null = null;
  tipoContenido: 'introducciones' | 'materiales' | 'actividades';
  cargando: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ModalActividadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tipo: 'introducciones' | 'materiales' | 'actividades', sesionId: string },
    private fb: FormBuilder,
    private sesionService: SesionService
  ) {
    this.tipoContenido = data.tipo;
    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    console.log('Datos recibidos en el modal:', this.data);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'video/mp4', 'video/avi', 'video/quicktime'];
      if (allowedTypes.includes(file.type)) {
        this.archivoSeleccionado = file;
      } else {
        alert('Tipo de archivo no permitido. Solo se permiten PDFs y videos (MP4, AVI, MOV).');
        this.archivoSeleccionado = null;
      }
    }
  }

  agregarContenido(): void {
    if (this.formulario.invalid || !this.archivoSeleccionado) {
      alert('Por favor, completa todos los campos y selecciona un archivo.');
      return;
    }
  
    this.cargando = true;
  
    const formData = new FormData();
    const actividad: DTOActividad = {
      actividadNombre: this.formulario.get('nombre')?.value,
      infoMaestra: {
        descripcion: this.tipoContenido === 'introducciones' ? 'Introducción' :
                     this.tipoContenido === 'materiales' ? 'Material' : 'Actividad'
      }
    };
    formData.append('actividad', new Blob([JSON.stringify(actividad)], { type: 'application/json' }));
    formData.append('archivo', this.archivoSeleccionado);
  
    console.log('Datos enviados al backend:', { sesionId: this.data.sesionId, actividad, archivo: this.archivoSeleccionado.name });
  
    this.sesionService.agregarActividad(this.data.sesionId, formData).subscribe({
      next: () => {
        this.cargando = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al agregar actividad:', err);
        alert('Error al agregar contenido. Inténtalo de nuevo. Detalle: ' + err.message);
      },
    });
  }
  cerrarModal(): void {
    this.dialogRef.close(false);
  }

  
}