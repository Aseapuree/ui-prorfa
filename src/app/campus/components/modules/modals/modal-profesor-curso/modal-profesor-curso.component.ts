import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogContent, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Curso } from '../../../../interface/curso';
import { ProfesorCurso } from '../../../../interface/ProfesorCurso';
import { Usuario } from '../../../../interface/usuario';
import { CourseService } from '../../../../services/course.service';
import { ProfesorCursoService } from '../../../../services/profesor-curso.service';
import { UsuarioService } from '../../../../services/usuario.service';
import { DatosNGS, SeccionVacantes } from '../../../../../matricula/interfaces/DTOEntidad';
import { EntidadService } from '../../../../../matricula/services/entidad.service';
import { NotificationComponent } from '../../../shared/notificaciones/notification.component';
import { NotificationService } from '../../../shared/notificaciones/notification.service';
import { forkJoin } from 'rxjs';

const MATERIAL_MODULES = [
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatSelectModule,
  MatDialogContent
];

@Component({
  selector: 'app-modal-profesor-curso',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MATERIAL_MODULES],
  templateUrl: './modal-profesor-curso.component.html',
  styleUrl: './modal-profesor-curso.component.scss'
})
export class ModalProfesorCursoComponent implements OnInit {
  contactForm!: FormGroup;
  usuarios: Usuario[] = [];
  cursos: Curso[] = [];
  niveles: string[] = [];
  grados: string[] = [];
  secciones: SeccionVacantes[] = [];
  datosNGS: DatosNGS | null = null;

  private readonly _fb = inject(FormBuilder);
  private readonly _matDialog = inject(MAT_DIALOG_DATA);
  private readonly _profesorCursoService = inject(ProfesorCursoService);
  private readonly _usuarioService = inject(UsuarioService);
  private readonly _courseService = inject(CourseService);
  private readonly _entidadService = inject(EntidadService);
  private readonly _dialogRef = inject(MatDialogRef<ModalProfesorCursoComponent>);
  private readonly _notificationService = inject(NotificationService);

  ngOnInit(): void {
    this._buildForm();
    this.loadData();
  }

  private _buildForm(): void {
    this.contactForm = this._fb.group({
      idProfesorCurso: [''],
      usuario: [null, Validators.required],
      curso: [null, Validators.required],
      nivel: ['', Validators.required],
      grado: ['', Validators.required],
      seccion: ['', Validators.required]
    });

    this.contactForm.get('nivel')?.valueChanges.subscribe(nivel => {
      this.onNivelChange(nivel);
    });

    this.contactForm.get('grado')?.valueChanges.subscribe(grado => {
      this.onGradoChange(grado);
    });
  }

  private loadData(): void {
    forkJoin({
      usuarios: this._usuarioService.obtenerListaUsuario(),
      cursos: this._courseService.obtenerListaCursos(1, 100, 'nombre', 'asc'),
      entidades: this._entidadService.obtenerEntidadList()
    }).subscribe({
      next: ({ usuarios, cursos, entidades }) => {
        // Filtrar usuarios para incluir solo aquellos con rol "Profesor"
        this.usuarios = usuarios.filter(usuario => usuario.rol?.nombreRol?.toLowerCase() === 'profesor');

        if (this.usuarios.length === 0) {
          this._notificationService.showNotification(
            'No se encontraron usuarios con el rol de Profesor',
            'info'
          );
        }

        // Cargar cursos
        this.cursos = cursos.content;

        // Cargar datos de entidad
        if (entidades.length > 0) {
          const entidad = entidades[0];
          if (entidad.datosngs) {
            this.datosNGS = entidad.datosngs;
            this.niveles = this.datosNGS.niveles?.map(nivel => nivel.nombre) || [];
          } else {
            this._notificationService.showNotification(
              'No se encontraron datos de niveles, grados y secciones',
              'info'
            );
          }
        } else {
          this._notificationService.showNotification(
            'No se encontraron entidades',
            'info'
          );
        }

        // Si está en modo edición, cargar valores iniciales
        if (this._matDialog.isEditing) {
          this.loadEditData();
        }
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this._notificationService.showNotification(
          'Error al cargar datos iniciales',
          'error'
        );
      }
    });
  }

  private loadEditData(): void {
    if (this._matDialog.isEditing) {
      this.contactForm.patchValue({
        idProfesorCurso: this._matDialog.idProfesorCurso
      });

      if (this._matDialog.usuario) {
        const usuarioSeleccionado = this.usuarios.find(
          u => u.idusuario === this._matDialog.usuario.idusuario
        );
        if (usuarioSeleccionado) {
          this.contactForm.patchValue({ usuario: usuarioSeleccionado });
        } else {
          this._notificationService.showNotification(
            'El usuario seleccionado no está disponible o no tiene el rol de Profesor',
            'error'
          );
        }
      }

      if (this._matDialog.curso) {
        const cursoSeleccionado = this.cursos.find(
          c => c.idCurso === this._matDialog.curso.idCurso
        );
        if (cursoSeleccionado) {
          this.contactForm.patchValue({ curso: cursoSeleccionado });
        }
      }

      if (this._matDialog.nivel) {
        this.contactForm.patchValue({ nivel: this._matDialog.nivel });
        this.onNivelChange(this._matDialog.nivel);
        setTimeout(() => {
          if (this._matDialog.grado) {
            this.contactForm.patchValue({ grado: this._matDialog.grado });
            this.onGradoChange(this._matDialog.grado);
            setTimeout(() => {
              if (this._matDialog.seccion) {
                this.contactForm.patchValue({ seccion: this._matDialog.seccion });
              }
            }, 0);
          }
        }, 0);
      }
    }
  }

  onNivelChange(nivel: string): void {
    this.grados = [];
    this.secciones = [];
    this.contactForm.patchValue({ grado: '', seccion: '' });

    if (nivel && this.datosNGS) {
      const selectedNivel = this.datosNGS.niveles?.find(n => n.nombre === nivel);
      this.grados = selectedNivel?.grados?.map(grado => grado.nombre) || [];
    }
  }

  onGradoChange(grado: string): void {
    this.secciones = [];
    this.contactForm.patchValue({ seccion: '' });

    if (grado && this.datosNGS) {
      const selectedNivel = this.datosNGS.niveles?.find(
        n => n.nombre === this.contactForm.get('nivel')?.value
      );
      if (selectedNivel) {
        const selectedGrado = selectedNivel.grados?.find(g => g.nombre === grado);
        this.secciones = selectedGrado?.secciones || [];
      }
    }
  }

  async onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this._notificationService.showNotification('Por favor, corrige los errores en el formulario.', 'error');
      return;
    }

    const asignacion: ProfesorCurso = {
      idProfesorCurso: this.contactForm.get('idProfesorCurso')?.value,
      usuario: this.contactForm.get('usuario')?.value,
      curso: this.contactForm.get('curso')?.value,
      nivel: this.contactForm.get('nivel')?.value,
      grado: this.contactForm.get('grado')?.value,
      seccion: this.contactForm.get('seccion')?.value
    };

    if (this._matDialog.isEditing && asignacion.idProfesorCurso) {
      this._profesorCursoService.editarCurso(asignacion).subscribe({
        next: (asignacionActualizada) => {
          this._notificationService.showNotification('Asignación actualizada con éxito', 'success');
          this._dialogRef.close(asignacionActualizada);
        },
        error: (err) => {
          console.error('Error al actualizar asignación:', err);
          this._notificationService.showNotification('Error al actualizar asignación: ' + err.message, 'error');
        }
      });
    } else {
      this._profesorCursoService.agregarCurso(asignacion).subscribe({
        next: (asignacionAgregada) => {
          this._notificationService.showNotification('Asignación agregada con éxito', 'success');
          this._dialogRef.close(asignacionAgregada);
        },
        error: (err) => {
          console.error('Error al agregar asignación:', err);
          this._notificationService.showNotification('Error al agregar asignación: ' + err.message, 'error');
        }
      });
    }
  }

  getTitle(): string {
    return this._matDialog.isEditing ? 'Editar Asignación' : 'Agregar Asignación';
  }
}