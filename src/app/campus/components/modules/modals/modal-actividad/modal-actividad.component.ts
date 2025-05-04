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
import { DateAdapter, MAT_DATE_FORMATS, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatDialogModule,
  MatButtonModule,
  MatProgressSpinnerModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatSelectModule,
];

@Component({
  selector: 'app-modal-actividad',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,AlertComponent, ...MATERIAL_MODULES], // Agregar MatDialogModule
  templateUrl: './modal-actividad.component.html',
  styleUrl: './modal-actividad.component.scss',
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
    this.formulario = this.fb.group(
      {
        nombre: ['', Validators.required],
        fechaInicio: [
          null,
          this.tipoContenido === 'actividades' ? Validators.required : null,
        ],
        horaInicio: [
          null,
          this.tipoContenido === 'actividades' ? Validators.required : null,
        ],
        fechaFin: [
          null,
          this.tipoContenido === 'actividades' ? Validators.required : null,
        ],
        horaFin: [
          null,
          this.tipoContenido === 'actividades' ? Validators.required : null,
        ],
        presencial: [
          { value: this.tipoContenido === 'actividades' ? null : false, disabled: this.esEdicion }, // Valor inicial: false si no es actividad
          this.tipoContenido === 'actividades' ? Validators.required : null,
        ],
      },
      {
        validators: this.tipoContenido === 'actividades' ? this.dateValidators() : null,
      }
    );
  }

  ngOnInit(): void {
    console.log(
      'Modal abierto en modo:',
      this.esEdicion ? 'Edición' : 'Agregar',
      'Tipo:',
      this.tipoContenido,
      'Datos:',
      this.data
    );
    if (this.esEdicion && this.data.actividad) {
      const fechaInicio = this.data.actividad.fechaInicio
        ? new Date(this.data.actividad.fechaInicio)
        : null;
      const fechaFin = this.data.actividad.fechaFin
        ? new Date(this.data.actividad.fechaFin)
        : null;
      this.formulario.patchValue({
        nombre: this.data.actividad.actividadNombre,
        fechaInicio: fechaInicio,
        horaInicio: fechaInicio
          ? `${String(fechaInicio.getUTCHours()).padStart(2, '0')}:${String(fechaInicio.getUTCMinutes()).padStart(2, '0')}`
          : null,
        fechaFin: fechaFin,
        horaFin: fechaFin
          ? `${String(fechaFin.getUTCHours()).padStart(2, '0')}:${String(fechaFin.getUTCMinutes()).padStart(2, '0')}`
          : null,
        presencial: this.data.actividad.presencial,
      });
      console.log('Formulario inicializado con:', this.formulario.value);
    }
  }

  dateValidators() {
    return (formGroup: FormGroup) => {
      const fechaInicio = formGroup.get('fechaInicio')?.value;
      const horaInicio = formGroup.get('horaInicio')?.value;
      const fechaFin = formGroup.get('fechaFin')?.value;
      const horaFin = formGroup.get('horaFin')?.value;
      const today = new Date();

      if (fechaInicio && horaInicio) {
        const fechaInicioDate = this.combineDateAndTime(fechaInicio, horaInicio);
        if (fechaInicioDate > today) {
          formGroup.get('fechaInicio')?.setErrors({ futureDate: true });
        } else {
          formGroup.get('fechaInicio')?.setErrors(null);
        }
      }

      if (fechaInicio && horaInicio && fechaFin && horaFin) {
        const fechaInicioDate = this.combineDateAndTime(fechaInicio, horaInicio);
        const fechaFinDate = this.combineDateAndTime(fechaFin, horaFin);

        if (fechaFinDate <= fechaInicioDate) {
          formGroup.get('fechaFin')?.setErrors({ invalidEndDate: true });
        } else {
          formGroup.get('fechaFin')?.setErrors(null);
        }
      }
    };
  }

  combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combinedDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      0,
      0
    ));
    return combinedDate;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'text/plain', // Nuevo: Soporte para .txt
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Nuevo: Soporte para .docx
      ];
      if (allowedTypes.includes(file.type)) {
        this.archivoSeleccionado = file;
        this.alertMessage = null;
        console.log('Archivo seleccionado:', file.name);
      } else {
        this.archivoSeleccionado = null;
        this.alertMessage =
          'Tipo de archivo no permitido. Solo se permiten PDFs, videos (MP4, AVI, MOV), TXT y DOCX.';
        this.alertType = 'error';
        console.error('Archivo no permitido:', file.type);
      }
    }
  }

  getFileNameFromUrl(url: string | undefined): string {
    if (!url) return 'Archivo desconocido';
    const parts = url.split('/');
    return parts[parts.length - 2] || 'Archivo desconocido';
  }

  

  agregarContenido(): void {
    console.log(
      'Intentando guardar. Formulario válido:',
      this.formulario.valid,
      'Valores:',
      this.formulario.value
    );
  
    // Si no es una actividad, ignorar el control presencial para la validación
    if (this.tipoContenido !== 'actividades') {
      this.formulario.get('presencial')?.clearValidators();
      this.formulario.get('presencial')?.updateValueAndValidity();
    }
  
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
      fechaInicio: null,
      fechaFin: null,
      presencial: this.tipoContenido === 'actividades' ? this.formulario.get('presencial')?.value : null,
    };
  
    if (this.tipoContenido === 'actividades') {
      const fechaInicio = this.formulario.get('fechaInicio')?.value;
      const horaInicio = this.formulario.get('horaInicio')?.value;
      const fechaFin = this.formulario.get('fechaFin')?.value;
      const horaFin = this.formulario.get('horaFin')?.value;
  
      if (fechaInicio && horaInicio) {
        const fechaInicioDate = this.combineDateAndTime(fechaInicio, horaInicio);
        actividad.fechaInicio = fechaInicioDate.toISOString();
      }
  
      if (fechaFin && horaFin) {
        const fechaFinDate = this.combineDateAndTime(fechaFin, horaFin);
        actividad.fechaFin = fechaFinDate.toISOString();
      }
    }
  
    console.log('Datos de actividad a enviar:', actividad);
    formData.append(
      'actividad',
      new Blob([JSON.stringify(actividad)], { type: 'application/json' })
    );
    if (this.archivoSeleccionado) {
      formData.append('archivo', this.archivoSeleccionado);
      console.log(
        'Archivo incluido en formData:',
        this.archivoSeleccionado.name
      );
    }
  
    const request = this.esEdicion
      ? this.sesionService.editarActividad(
          this.data.sesionId,
          this.data.actividad!.idActividad!,
          formData
        )
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

  cerrarModal(): void {
    this.dialogRef.close(false);
  }

  onDateChange(field: string, event: any): void {
    console.log(`Fecha seleccionada para ${field}:`, event.value);
  }
}