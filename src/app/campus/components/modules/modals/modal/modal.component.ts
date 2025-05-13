import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInput, MatInputModule } from '@angular/material/input'
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field'
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CourseService } from '../../../../services/course.service';
import { ModalService } from './modal.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Competencia, Curso } from '../../../../interface/curso';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationService } from '../../../shared/notificaciones/notification.service';

const MATERIAL_MODULES = [
  MatDialogModule,
  MatFormFieldModule, // Agregar para mat-error y mat-label
  MatInputModule,     // Agregar para matInput
  MatButtonModule,
  MatDialogContent,
  FontAwesomeModule
];

// Validador personalizado para requerir al menos una competencia
function minCompetenciasValidator(min: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const formArray = control as FormArray;
    return formArray.length >= min ? null : { minCompetencias: { required: min, actual: formArray.length } };
  };
}

// Validador personalizado para el regex (sin números)
function regexValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value?.trim() || '';
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+( [a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$/;
    return value === '' || regex.test(value) ? null : { invalidFormat: true };
  };
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule, MATERIAL_MODULES],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements OnInit {
  contactForm!: FormGroup;
  isReadOnly: boolean = false;
  private lastValidValues: { [key: string]: string } = {
    nombre: '',
    abreviatura: '',
    descripcion: '',
  };
  private lastValidCompetencias: string[] = []; // Almacena valores válidos para competencias

  private readonly _fb = inject(FormBuilder);
  private readonly _matDialog = inject(MAT_DIALOG_DATA);
  private readonly _contactSVC = inject(CourseService);
  private readonly _modalSvc = inject(ModalService);
  private readonly _dialogRef = inject(MatDialogRef<ModalComponent>);
  private readonly _notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.isReadOnly = this._matDialog.isReadOnly || false;
    this._buildForm();
    if (this._matDialog) {
      this.contactForm.patchValue({
        idCurso: this._matDialog.idCurso,
        nombre: this._matDialog.nombre,
        descripcion: this._matDialog.descripcion,
        abreviatura: this._matDialog.abreviatura,
      });
      this.lastValidValues = {
        nombre: this._matDialog.nombre || '',
        abreviatura: this._matDialog.abreviatura || '',
        descripcion: this._matDialog.descripcion || '',
      };
      // Cargar competencias existentes
      if (this._matDialog.competencias && Array.isArray(this._matDialog.competencias)) {
        const competenciasFormArray = this.contactForm.get('competencias') as FormArray;
        this._matDialog.competencias.forEach((competencia: Competencia) => {
          if (competencia && typeof competencia.nombre === 'string') {
            competenciasFormArray.push(this._fb.group({
              nombre: [competencia.nombre, !this.isReadOnly ? [Validators.required, regexValidator()] : []]
            }));
            this.lastValidCompetencias.push(competencia.nombre);
          }
        });
      }
      this.contactForm.updateValueAndValidity();
      console.log('Formulario inicial:', this.contactForm.value, 'Válido:', this.contactForm.valid, 'Errores:', this.contactForm.errors);
    }
  }

  get competencias(): FormArray {
    return this.contactForm.get('competencias') as FormArray;
  }

  addCompetencia(): void {
    this.competencias.push(this._fb.group({
      nombre: ['', [Validators.required, regexValidator()]]
    }));
    this.lastValidCompetencias.push('');
    this.contactForm.updateValueAndValidity();
    console.log('Después de agregar competencia:', this.contactForm.value, 'Válido:', this.contactForm.valid, 'Errores:', this.contactForm.errors);
  }

  removeCompetencia(index: number): void {
    this.competencias.removeAt(index);
    this.lastValidCompetencias.splice(index, 1);
    this.contactForm.updateValueAndValidity();
    console.log('Después de eliminar competencia:', this.contactForm.value, 'Válido:', this.contactForm.valid, 'Errores:', this.contactForm.errors);
  }

  onInputChange(event: Event, field: string, index?: number): void {
    if (this.isReadOnly) return;

    const input = event.target as HTMLInputElement;
    let newValue = input.value;
    console.log(`Input para ${field}${index !== undefined ? `[${index}]` : ''}:`, newValue);

    // Normalizar espacios
    newValue = newValue.replace(/\s+/g, ' ').trimStart();

    if (newValue === '') {
      if (index !== undefined) {
        this.competencias.at(index).get('nombre')?.setValue('');
        this.lastValidCompetencias[index] = '';
      } else {
        this.contactForm.get(field)?.setValue('');
        this.lastValidValues[field] = '';
      }
      this.contactForm.updateValueAndValidity();
      return;
    }

    const intermediateRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+( [a-zA-ZáéíóúÁÉÍÓÚñÑ]*)*$/;
    if (!intermediateRegex.test(newValue)) {
      const lastValidValue = index !== undefined ? this.lastValidCompetencias[index] || '' : this.lastValidValues[field];
      if (index !== undefined) {
        this.competencias.at(index).get('nombre')?.setValue(lastValidValue);
        this.competencias.at(index).get('nombre')?.markAsTouched();
      } else {
        this.contactForm.get(field)?.setValue(lastValidValue);
        this.contactForm.get(field)?.markAsTouched();
      }
      this._notificationService.showNotification(
        'Solo se permiten letras, acentos, ñ y un solo espacio entre palabras.',
        'info'
      );
      console.log(`Valor no válido, restaurando a: ${lastValidValue}`);
      this.contactForm.updateValueAndValidity();
      return;
    }

    // Actualizar el valor en el FormControl
    if (index !== undefined) {
      this.competencias.at(index).get('nombre')?.setValue(newValue);
      this.lastValidCompetencias[index] = newValue;
    } else {
      this.contactForm.get(field)?.setValue(newValue);
      this.lastValidValues[field] = newValue;
    }
    console.log(`Valor actualizado para ${field}${index !== undefined ? `[${index}]` : ''}:`, newValue);
    this.contactForm.updateValueAndValidity();
  }

  async onSubmit() {
    if (this.contactForm.invalid) {
      console.log('Formulario inválido:', this.contactForm.errors, this.contactForm.value);
      this.contactForm.markAllAsTouched();
      const competenciasFormArray = this.contactForm.get('competencias') as FormArray;
      competenciasFormArray.controls.forEach((group, index) => {
        console.log(`Competencia ${index}:`, group.value, 'Válido:', group.valid, 'Errores:', group.errors);
      });
      this._notificationService.showNotification('Por favor, corrige los errores en el formulario.', 'error');
      return;
    }

    const curso: Curso = this.contactForm.value;
    console.log('Enviando curso:', curso);

    if (this._matDialog.isEditing && curso.idCurso) {
      this._contactSVC.actualizarCurso(curso.idCurso, curso).subscribe({
        next: (cursoActualizado) => {
          this._dialogRef.close(cursoActualizado);
          this._notificationService.showNotification('Curso actualizado con éxito.', 'success');
        },
        error: (err) => {
          console.error('Error al actualizar curso:', err);
          this._notificationService.showNotification('Error al actualizar curso: ' + err.message, 'error');
        },
      });
    } else {
      this._contactSVC.agregarCurso(curso).subscribe({
        next: (cursoAgregado) => {
          this._dialogRef.close(cursoAgregado);
          this._notificationService.showNotification('Curso agregado con éxito.', 'success');
        },
        error: (err) => {
          console.error('Error al agregar curso:', err);
          this._notificationService.showNotification('Error al agregar curso: ' + err.message, 'error');
        },
      });
    }
  }

  getTitle(): string {
    if (this.isReadOnly) return 'Detalles del Curso';
    return this._matDialog.isEditing ? 'Editar Curso' : 'Agregar Curso';
  }

  private _buildForm(): void {
    this.contactForm = this._fb.group({
      idCurso: [''],
      nombre: ['', this.isReadOnly ? [] : [Validators.required, regexValidator()]],
      descripcion: ['', this.isReadOnly ? [] : [Validators.required, regexValidator()]],
      abreviatura: ['', this.isReadOnly ? [] : [Validators.required, regexValidator()]],
      competencias: this._fb.array([], this.isReadOnly || this._matDialog.isEditing ? [] : [minCompetenciasValidator(1)])
    });
  }
}

  
