import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog'; // Importar MatDialogModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { SesionService } from '../../../../services/sesion.service';
import { MatButtonModule } from '@angular/material/button';

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
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private sesionService: SesionService
  ) {
    this.tipoContenido = data.tipo;
    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    console.log('ModalActividadComponent iniciado'); // Depuración
    console.log('Datos recibidos en el modal:', this.data); // Depuración
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
    formData.append('archivo', this.archivoSeleccionado);
    formData.append('nombre', this.formulario.get('nombre')?.value);
    formData.append('sesionId', this.data.sesionId);

    switch (this.tipoContenido) {
      case 'introducciones':
        this.sesionService.agregarIntroduccion(formData).subscribe({
          next: () => {
            this.cargando = false;
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.cargando = false;
            console.error('Error al agregar introducción:', err);
            alert('Error al agregar introducción. Inténtalo de nuevo.');
          },
        });
        break;

      case 'materiales':
        this.sesionService.agregarMaterial(formData).subscribe({
          next: () => {
            this.cargando = false;
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.cargando = false;
            console.error('Error al agregar material:', err);
            alert('Error al agregar material. Inténtalo de nuevo.');
          },
        });
        break;

      case 'actividades':
        this.sesionService.agregarActividad(formData).subscribe({
          next: () => {
            this.cargando = false;
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.cargando = false;
            console.error('Error al agregar actividad:', err);
            alert('Error al agregar actividad. Inténtalo de nuevo.');
          },
        });
        break;

      default:
        console.error('Tipo de contenido no válido');
        this.cargando = false;
        alert('Tipo de contenido no válido.');
        break;
    }
  }

  cerrarModal(): void {
    this.dialogRef.close(false);
  }
}