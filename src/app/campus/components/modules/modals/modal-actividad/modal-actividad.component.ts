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
import { AlertComponent } from '../../../shared/alert/alert.component';

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
  imports: [ReactiveFormsModule, CommonModule,AlertComponent, ...MATERIAL_MODULES], // Agregar MatDialogModule
  templateUrl: './modal-actividad.component.html',
  styleUrl: './modal-actividad.component.scss'
})
export class ModalActividadComponent implements OnInit {
  formulario: FormGroup;
  archivoSeleccionado: File | null = null;
  tipoContenido: 'introducciones' | 'materiales' | 'actividades';
  cargando: boolean = false;
  esEdicion: boolean = false;
  alertMessage: string | null = null;
  alertType: 'error' | 'warning' = 'error';

  constructor(
    public dialogRef: MatDialogRef<ModalActividadComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      tipo: 'introducciones' | 'materiales' | 'actividades';
      sesionId: string;
      actividad?: DTOActividad;
    },
    private fb: FormBuilder,
    private sesionService: SesionService
  ) {
    this.tipoContenido = data.tipo;
    this.esEdicion = !!data.actividad;
    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.esEdicion && this.data.actividad) {
      this.formulario.patchValue({
        nombre: this.data.actividad.actividadNombre,
      });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'video/mp4', 'video/avi', 'video/quicktime'];
      if (allowedTypes.includes(file.type)) {
        this.archivoSeleccionado = file;
        this.alertMessage = null; // Limpiar mensaje si el archivo es válido
      } else {
        this.archivoSeleccionado = null;
        this.alertMessage = 'Tipo de archivo no permitido. Solo se permiten PDFs y videos (MP4, AVI, MOV).';
        this.alertType = 'error';
      }
    }
  }

  agregarContenido(): void {
    if (this.formulario.invalid || (!this.archivoSeleccionado && !this.esEdicion)) {
      this.alertMessage = 'Por favor, completa todos los campos y selecciona un archivo.';
      this.alertType = 'error';
      return;
    }

    this.cargando = true;
    this.alertMessage = null; // Limpiar mensaje antes de enviar
    const formData = new FormData();
    const actividad: DTOActividad = {
      actividadNombre: this.formulario.get('nombre')?.value,
      infoMaestra: {
        descripcion:
          this.tipoContenido === 'introducciones'
            ? 'Introducción'
            : this.tipoContenido === 'materiales'
            ? 'Material'
            : 'Actividad',
      },
    };

    formData.append('actividad', new Blob([JSON.stringify(actividad)], { type: 'application/json' }));
    if (this.archivoSeleccionado) {
      formData.append('archivo', this.archivoSeleccionado);
    }

    const request = this.esEdicion
      ? this.sesionService.editarActividad(this.data.sesionId, this.data.actividad!.idActividad!, formData)
      : this.sesionService.agregarActividad(this.data.sesionId, formData);

    request.subscribe({
      next: () => {
        this.cargando = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.cargando = false;
        this.alertMessage = `Error al procesar contenido. Detalle: ${err.message}`;
        this.alertType = 'error';
      },
    });
  }

  cerrarModal(): void {
    this.dialogRef.close(false);
  }
}