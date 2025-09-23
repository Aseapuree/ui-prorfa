import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EntidadService } from '../../services/entidad.service';
import { Entidad, DatosNGS, DocumentoEntidad, Nivel, Grado, SeccionVacantes } from '../../interfaces/DTOEntidad';
import { HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule, AbstractControl } from '@angular/forms';
import { NotificationService } from '../../../campus/components/shared/notificaciones/notification.service';
import { NotificationComponent } from "../../../campus/components/shared/notificaciones/notification.component";

@Component({
  selector: 'app-entidad',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    GeneralLoadingSpinnerComponent,
    ReactiveFormsModule,
    FormsModule,
    NotificationComponent
  ],
  templateUrl: './entidad.component.html',
  styleUrls: ['./entidad.component.scss']
})
export class EntidadComponent implements OnInit {
  entidad: Entidad | null = null;
  loading = false;
  isEditing = false;
  isSaving = false;
  spinnerMessage: string = 'Cargando datos...';
  entidadForm!: FormGroup;

  constructor(
    private entidadService: EntidadService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const idUsuario = localStorage.getItem('IDUSER');
    if (idUsuario) {
      this.obtenerDatosEntidadPorUsuario(idUsuario);
    } else {
      this.notificationService.showNotification('Error: No se pudo identificar al usuario.', 'error');
    }
  }

  obtenerDatosEntidadPorUsuario(id: string): void {
    this.loading = true;
    this.spinnerMessage = 'Cargando datos de la entidad...';
    this.entidadService.obtenerEntidadPorUsuario(id).pipe(
      finalize(() => {
        this.loading = false;
        this.cdRef.detectChanges();
      })
    ).subscribe({
      next: entidad => {
        this.entidad = entidad;
        this.crearFormularioDeEntidad(entidad);
      },
      error: err => {
        this.notificationService.showNotification(`Error al cargar la entidad: ${err.message}`, 'error');
      }
    });
  }

  iniciarEdicion(): void {
    this.isEditing = true;
  }

  cancelarEdicion(): void {
    this.isEditing = false;
    if (this.entidad) {
      this.crearFormularioDeEntidad(this.entidad);
    }
  }

  guardarCambios(): void {
    if (!this.isDirtyValid(this.entidadForm)) {
      this.markDirtyAsTouched(this.entidadForm);
      this.notificationService.showNotification('Por favor, complete todos los campos requeridos que ha editado.', 'error');
      return;
    }
    if (!this.entidad || !this.entidad.identidad) {
      this.notificationService.showNotification('Error: No se puede identificar la entidad a actualizar.', 'error');
      return;
    }

    const patch = this.getDirtyValues(this.entidadForm);
    if (Object.keys(patch).length === 0) {
      this.notificationService.showNotification('No hay cambios para guardar.', 'info');
      this.isEditing = false;
      return;
    }

    // Convertir vacantes a número si están presentes en el patch
    if (patch.datosngs && patch.datosngs.niveles) {
      patch.datosngs.niveles.forEach((nivel: any) => {
        if (nivel.grados) {
          nivel.grados.forEach((grado: any) => {
            if (grado.secciones) {
              grado.secciones.forEach((seccion: any) => {
                if (seccion.vacantes !== undefined) {
                  seccion.vacantes = Number(seccion.vacantes);
                }
              });
            }
          });
        }
      });
    }

    this.isSaving = true;
    this.spinnerMessage = 'Guardando cambios...';
    this.entidadService.editarEntidad(this.entidad.identidad, patch).pipe(
      finalize(() => {
        this.isSaving = false;
        this.spinnerMessage = 'Cargando datos...';
      })
    ).subscribe({
      next: entidadActualizada => {
        this.entidad = entidadActualizada;
        this.isEditing = false;
        this.crearFormularioDeEntidad(entidadActualizada);
        this.notificationService.showNotification('Entidad actualizada correctamente.', 'success');
      },
      error: err => {
        this.notificationService.showNotification(`Error al guardar los cambios: ${err.message}`, 'error');
      }
    });
  }

  private isDirtyValid(control: AbstractControl): boolean {
    if (control instanceof FormGroup) {
      return Object.keys(control.controls).every(key => {
        const child = control.get(key)!;
        return this.isDirtyValid(child);
      });
    } else if (control instanceof FormArray) {
      return control.controls.every(child => this.isDirtyValid(child));
    } else {
      // FormControl
      if (control.dirty) {
        return control.valid;
      } else {
        return true;
      }
    }
  }

  private getDirtyValues(control: AbstractControl): any {
    const patch: any = {};

    if (control instanceof FormGroup) {
      Object.keys(control.controls).forEach(key => {
        const child = control.get(key)!;
        if (child.dirty) {
          if (child instanceof FormGroup) {
            const subPatch = this.getDirtyValues(child);
            if (Object.keys(subPatch).length > 0) {
              patch[key] = subPatch;
            }
          } else if (child instanceof FormArray) {
            patch[key] = child.value;
          } else {
            patch[key] = child.value;
          }
        }
      });
    }
    // No manejar FormArray directamente aquí, ya que se maneja en FormGroup
    return patch;
  }

  private markDirtyAsTouched(control: AbstractControl): void {
    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach(child => this.markDirtyAsTouched(child));
    } else if (control instanceof FormArray) {
      control.controls.forEach(child => this.markDirtyAsTouched(child));
    } else {
      if (control.dirty) {
        control.markAsTouched();
      }
    }
  }

  crearFormularioDeEntidad(entidad: Entidad): void {
    this.entidadForm = this.fb.group({
      nombreColegio: [entidad.nombreColegio, Validators.required],
      direccionColegio: [entidad.direccionColegio, Validators.required],
      rucColegio: [entidad.rucColegio, [Validators.required, Validators.pattern(/^\d{11}$/)]],
      razonSocial: [entidad.razonSocial, Validators.required],
      telefonoColegio: [entidad.telefonoColegio, [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      correoColegio: [entidad.correoColegio, [Validators.required, Validators.email]],
      logoColegio: [entidad.logoColegio, [Validators.required, this.urlValidator]],
      documentos: this.crearFormGroupDocumentos(entidad.documentos),
      datosngs: this.crearFormGroupDatosNgs(entidad.datosngs)
    });
  }

  urlValidator(control: any): { [key: string]: boolean } | null {
    if (control.value && !/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(control.value)) {
      return { 'invalidUrl': true };
    }
    return null;
  }

  crearFormGroupDocumentos(documentos?: DocumentoEntidad): FormGroup {
    return this.fb.group({
      necesarios: this.fb.group({
        documento1: [documentos?.necesarios?.documento1 ?? '', Validators.required],
        documento2: [documentos?.necesarios?.documento2 ?? '', Validators.required],
      }),
      adicionales: this.fb.group({
        intercambio: this.fb.group({
          documento1: [documentos?.adicionales?.intercambio?.documento1 ?? ''],
          documento2: [documentos?.adicionales?.intercambio?.documento2 ?? ''],
        }),
        discapacidad: this.fb.group({
          documento1: [documentos?.adicionales?.discapacidad?.documento1 ?? ''],
        })
      })
    });
  }

  crearFormGroupDatosNgs(datos?: DatosNGS): FormGroup {
    const nivelesArray = datos?.niveles?.map(nivel => this.crearFormGroupNivel(nivel)) || [];
    return this.fb.group({
      niveles: this.fb.array(nivelesArray, Validators.minLength(1))
    });
  }

  crearFormGroupNivel(nivel: Nivel): FormGroup {
    const gradosArray = nivel.grados?.map(grado => this.crearFormGroupGrado(grado)) || [];
    return this.fb.group({
      nombre: [nivel.nombre, Validators.required],
      grados: this.fb.array(gradosArray, Validators.minLength(1))
    });
  }

  crearFormGroupGrado(grado: Grado): FormGroup {
    const seccionesArray = grado.secciones?.map(seccion => this.crearFormGroupSeccion(seccion)) || [];
    return this.fb.group({
      nombre: [grado.nombre, Validators.required],
      secciones: this.fb.array(seccionesArray, Validators.minLength(1))
    });
  }

  crearFormGroupSeccion(seccion: SeccionVacantes): FormGroup {
    return this.fb.group({
      nombre: [seccion.nombre, Validators.required],
      vacantes: [seccion.vacantes ?? 0, [Validators.required, Validators.min(0)]]
    });
  }

  niveles(): FormArray {
    return this.entidadForm.get('datosngs.niveles') as FormArray;
  }

  grados(nivelIndex: number): FormArray {
    return this.niveles().at(nivelIndex).get('grados') as FormArray;
  }

  secciones(nivelIndex: number, gradoIndex: number): FormArray {
    return this.grados(nivelIndex).at(gradoIndex).get('secciones') as FormArray;
  }

  addNivel(): void {
    const nuevoNivel = this.fb.group({
      nombre: ['', Validators.required],
      grados: this.fb.array([], Validators.minLength(1))
    });
    this.niveles().push(nuevoNivel);
    this.niveles().markAsDirty();
  }

  addGrado(nivelIndex: number): void {
    const nuevoGrado = this.fb.group({
      nombre: ['', Validators.required],
      secciones: this.fb.array([], Validators.minLength(1))
    });
    this.grados(nivelIndex).push(nuevoGrado);
    this.grados(nivelIndex).markAsDirty();
  }

  addSeccion(nivelIndex: number, gradoIndex: number): void {
    const nuevaSeccion = this.fb.group({
      nombre: ['', Validators.required],
      vacantes: [0, [Validators.required, Validators.min(0)]]
    });
    this.secciones(nivelIndex, gradoIndex).push(nuevaSeccion);
    this.secciones(nivelIndex, gradoIndex).markAsDirty();
  }

  removeNivel(nivelIndex: number): void {
    this.niveles().removeAt(nivelIndex);
    this.niveles().markAsDirty();
  }

  removeGrado(nivelIndex: number, gradoIndex: number): void {
    this.grados(nivelIndex).removeAt(gradoIndex);
    this.grados(nivelIndex).markAsDirty();
  }

  removeSeccion(nivelIndex: number, gradoIndex: number, seccionIndex: number): void {
    this.secciones(nivelIndex, gradoIndex).removeAt(seccionIndex);
    this.secciones(nivelIndex, gradoIndex).markAsDirty();
  }
}
