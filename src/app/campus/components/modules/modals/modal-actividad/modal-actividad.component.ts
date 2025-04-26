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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatDialogModule,
  MatButtonModule,
  MatProgressSpinnerModule,
  MatDatepickerModule,
  MatNativeDateModule,
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
    // Inicializar el formulario con fechas solo si es tipo 'actividades'
    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      fechaInicio: [null, this.tipoContenido === 'actividades' ? Validators.required : null],
      fechaFin: [null, this.tipoContenido === 'actividades' ? Validators.required : null],
    }, {
      validators: this.tipoContenido === 'actividades' ? this.dateValidators() : null
    });
  }

  ngOnInit(): void {
    console.log('Modal abierto en modo:', this.esEdicion ? 'Edición' : 'Agregar', 'Tipo:', this.tipoContenido, 'Datos:', this.data);
    if (this.esEdicion && this.data.actividad) {
      this.formulario.patchValue({
        nombre: this.data.actividad.actividadNombre,
        fechaInicio: this.data.actividad.fechaInicio && this.tipoContenido === 'actividades' ? new Date(this.data.actividad.fechaInicio) : null,
        fechaFin: this.data.actividad.fechaFin && this.tipoContenido === 'actividades' ? new Date(this.data.actividad.fechaFin) : null,
      });
      console.log('Formulario inicializado con:', this.formulario.value);
    }
  }

  // Validaciones personalizadas para las fechas (solo para actividades)
  dateValidators() {
    return (formGroup: FormGroup) => {
      const fechaInicio = formGroup.get('fechaInicio')?.value;
      const fechaFin = formGroup.get('fechaFin')?.value;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalizar a medianoche

      if (fechaInicio) {
        const fechaInicioDate = new Date(fechaInicio);
        if (fechaInicioDate > today) {
          formGroup.get('fechaInicio')?.setErrors({ futureDate: true });
        } else {
          formGroup.get('fechaInicio')?.setErrors(null);
        }
      }

      if (fechaInicio && fechaFin) {
        const fechaInicioDate = new Date(fechaInicio);
        const fechaFinDate = new Date(fechaFin);
        if (fechaFinDate <= fechaInicioDate) {
          formGroup.get('fechaFin')?.setErrors({ invalidEndDate: true });
        } else {
          formGroup.get('fechaFin')?.setErrors(null);
        }
      }
    };
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'video/mp4', 'video/avi', 'video/quicktime'];
      if (allowedTypes.includes(file.type)) {
        this.archivoSeleccionado = file;
        this.alertMessage = null;
        console.log('Archivo seleccionado:', file.name);
      } else {
        this.archivoSeleccionado = null;
        this.alertMessage = 'Tipo de archivo no permitido. Solo se permiten PDFs y videos (MP4, AVI, MOV).';
        this.alertType = 'error';
        console.error('Archivo no permitido:', file.type);
      }
    }
  }

  // Extraer el nombre del archivo desde la URL
  getFileNameFromUrl(url: string | undefined): string {
    if (!url) return 'Archivo desconocido';
    const parts = url.split('/');
    return parts[parts.length - 2] || 'Archivo desconocido';
  }

  agregarContenido(): void {
    console.log('Intentando guardar. Formulario válido:', this.formulario.valid, 'Valores:', this.formulario.value);
    if (this.formulario.invalid) {
      this.alertMessage = 'Por favor, completa todos los campos requeridos.';
      this.alertType = 'error';
      console.error('Formulario inválido:', this.formulario.errors);
      return;
    }

    if (!this.archivoSeleccionado && !this.esEdicion) {
      this.alertMessage = 'Por favor, selecciona un archivo válido.';
      this.alertType = 'error';
      console.error('No se seleccionó archivo en modo agregar');
      return;
    }

    this.cargando = true;
    this.alertMessage = null;
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

    // Solo incluir fechas si el tipo es 'actividades'
    if (this.tipoContenido === 'actividades') {
      actividad.fechaInicio = this.formatDate(this.formulario.get('fechaInicio')?.value);
      actividad.fechaFin = this.formatDate(this.formulario.get('fechaFin')?.value);
    }

    console.log('Datos de actividad a enviar:', actividad);
    formData.append('actividad', new Blob([JSON.stringify(actividad)], { type: 'application/json' }));
    if (this.archivoSeleccionado) {
      formData.append('archivo', this.archivoSeleccionado);
      console.log('Archivo incluido en formData:', this.archivoSeleccionado.name);
    }

    const request = this.esEdicion
      ? this.sesionService.editarActividad(this.data.sesionId, this.data.actividad!.idActividad!, formData)
      : this.sesionService.agregarActividad(this.data.sesionId, formData);

    request.subscribe({
      next: () => {
        this.cargando = false;
        this.dialogRef.close(true);
        console.log('Actividad guardada exitosamente');
      },
      error: (err) => {
        this.cargando = false;
        this.alertMessage = `Error al procesar contenido. Detalle: ${err.message}`;
        this.alertType = 'error';
        console.error('Error al guardar actividad:', err);
      },
    });
  }

  // Convertir fecha a formato ISO 8601 (YYYY-MM-DDThh:mm:ss)
  formatDate(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  cerrarModal(): void {
    this.dialogRef.close(false);
  }
}