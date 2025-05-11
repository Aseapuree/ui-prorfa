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

  private readonly _fb = inject(FormBuilder);
  private readonly _matDialog = inject(MAT_DIALOG_DATA);
  private readonly _contactSVC = inject(CourseService);
  private readonly _modalSvc = inject(ModalService);
  private readonly _dialogRef = inject(MatDialogRef<ModalComponent>);

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
      // Cargar competencias existentes
      if (this._matDialog.competencias && Array.isArray(this._matDialog.competencias)) {
        const competenciasFormArray = this.contactForm.get('competencias') as FormArray;
        this._matDialog.competencias.forEach((competencia: Competencia) => {
          if (competencia && typeof competencia.nombre === 'string') {
            competenciasFormArray.push(this._fb.group({
              nombre: [competencia.nombre, this._matDialog.isEditing && !this.isReadOnly ? Validators.required : []]
            }));
          }
        });
      }
      // Forzar actualización del estado del formulario
      this.contactForm.updateValueAndValidity();
      console.log('Formulario inicial:', this.contactForm.value, 'Válido:', this.contactForm.valid, 'Errores:', this.contactForm.errors);
    }
  }

  get competencias(): FormArray {
    return this.contactForm.get('competencias') as FormArray;
  }

  addCompetencia(): void {
    this.competencias.push(this._fb.group({
      nombre: ['', Validators.required]
    }));
    // Forzar actualización del estado del formulario
    this.contactForm.updateValueAndValidity();
    console.log('Después de agregar competencia:', this.contactForm.value, 'Válido:', this.contactForm.valid, 'Errores:', this.contactForm.errors);
  }

  removeCompetencia(index: number): void {
    this.competencias.removeAt(index);
    // Forzar actualización del estado del formulario
    this.contactForm.updateValueAndValidity();
    console.log('Después de eliminar competencia:', this.contactForm.value, 'Válido:', this.contactForm.valid, 'Errores:', this.contactForm.errors);
  }

  async onSubmit() {
    if (this.contactForm.invalid) {
      console.log('Formulario inválido:', this.contactForm.errors, this.contactForm.value);
      this.contactForm.markAllAsTouched();
      // Depurar errores en competencias
      const competenciasFormArray = this.contactForm.get('competencias') as FormArray;
      competenciasFormArray.controls.forEach((group, index) => {
        console.log(`Competencia ${index}:`, group.value, 'Válido:', group.valid, 'Errores:', group.errors);
      });
      return;
    }

    const curso: Curso = this.contactForm.value;

    if (this._matDialog.isEditing && curso.idCurso) {
      this._contactSVC.actualizarCurso(curso.idCurso, curso).subscribe({
        next: (cursoActualizado) => {
          this._dialogRef.close(cursoActualizado);
        },
        error: (err) => {
          console.error('Error al actualizar curso:', err);
        },
      });
    } else {
      this._contactSVC.agregarCurso(curso).subscribe({
        next: (cursoAgregado) => {
          this._dialogRef.close(cursoAgregado);
        },
        error: (err) => {
          console.error('Error al agregar curso:', err);
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
      nombre: ['', this.isReadOnly ? [] : Validators.required],
      descripcion: ['', this.isReadOnly ? [] : Validators.required],
      abreviatura: ['', this.isReadOnly ? [] : Validators.required],
      competencias: this._fb.array([], this.isReadOnly || this._matDialog.isEditing ? [] : [minCompetenciasValidator(1)])
    });
  }
}

  
