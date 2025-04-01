import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ApoderadoService } from './../../services/apoderado.service';
import { AlumnoService } from './../../services/alumno.service';
import { MatriculaService } from './../../services/matricula.service';

function documentLengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) return null;
    const idtipodoc = control.parent.get('idtipodoc')?.value;
    const value: string = control.value;
    if (!value) return null;
    if (idtipodoc === '29c2c5c3-2fc9-4410-ab24-52a8114f9c05') {
      return value.length === 8 ? null : { invalidLength: { requiredLength: 8, actualLength: value.length } };
    } else if (idtipodoc === 'fa65a599-60fd-43e1-85e2-7a95f3cf072e') {
      return value.length <= 20 ? null : { invalidLength: { requiredMax: 20, actualLength: value.length } };
    }
    return null;
  };
}

function minAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < minAge ? { minAge: { requiredAge: minAge, actualAge: age } } : null;
  };
}

@Component({
  selector: 'app-registrar-matricula',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrarmatricula.component.html',
  styleUrls: ['./registrarmatricula.component.scss']
})
export class RegistrarMatriculaComponent implements OnInit {
  formMatricula!: FormGroup;
  nivel!: string;
  grado!: number;
  seccion!: string;
  apoderadoEncontrado: any = null;
  mostrarFormularioApoderado: boolean = false;

  // Usuario fijo
  usuario = { idusuario: '0765bb4e-7cc4-4743-9eca-f7ebb3c1f624' };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apoderadoService: ApoderadoService,
    private alumnoService: AlumnoService,
    private matriculaService: MatriculaService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.nivel = params['nivel'];
      this.grado = +params['grado'];

      this.matriculaService.asignarSeccion(this.grado).subscribe({
        next: (seccion: string) => this.seccion = seccion,
        error: () => this.seccion = 'SIN VACANTE'
      });
    });
    this.crearFormulario();
  }

  crearFormulario(): void {
    const soloLetrasPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    this.formMatricula = this.fb.group({
      dniBusqueda: [''],
      apoderado: this.fb.group({
        tipoDocumento: ['29c2c5c3-2fc9-4410-ab24-52a8114f9c05', Validators.required],
        numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]+$'), documentLengthValidator()]],
        nombre: ['', [Validators.required, Validators.pattern(soloLetrasPattern)]],
        apellidoPaterno: ['', [Validators.required, Validators.pattern(soloLetrasPattern)]],
        apellidoMaterno: ['', [Validators.required, Validators.pattern(soloLetrasPattern)]],
        telefono: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.minLength(9), Validators.maxLength(9)]],
        relacionEstudiante: ['', Validators.required],
        direccion: ['', Validators.required],
        correo: ['', [Validators.required, Validators.email]],
        fechaNacimiento: ['', [Validators.required, minAgeValidator(18)]]
      }),
      alumno: this.fb.group({
        nombre: ['', [Validators.required, Validators.pattern(soloLetrasPattern)]],
        apellidoPaterno: ['', [Validators.required, Validators.pattern(soloLetrasPattern)]],
        apellidoMaterno: ['', [Validators.required, Validators.pattern(soloLetrasPattern)]],
        tipoDocumento: ['', Validators.required],
        numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]+$'), documentLengthValidator()]],
        fechaNacimiento: ['', [Validators.required, minAgeValidator(4)]],
        direccion: ['', Validators.required]
      })
    });

    this.formMatricula.get('apoderado.idtipodoc')?.valueChanges.subscribe(() => {
      this.formMatricula.get('apoderado.numeroDocumento')?.updateValueAndValidity();
    });
    this.formMatricula.get('alumno.idtipodoc')?.valueChanges.subscribe(() => {
      this.formMatricula.get('alumno.numeroDocumento')?.updateValueAndValidity();
    });
  }

  getNumeroDocumentoMaxLength(groupName: string): number {
    const group = this.formMatricula.get(groupName);
    if (group) {
      const tipo = group.get('idtipodoc')?.value;
      if (tipo === '29c2c5c3-2fc9-4410-ab24-52a8114f9c05') {
        return 8;
      } else if (tipo === 'fa65a599-60fd-43e1-85e2-7a95f3cf072e') {
        return 20;
      }
    }
    return 100;
  }

  buscarApoderado(): void {
    const idtipodoc = this.formMatricula.get('apoderado.idtipodoc')?.value;
    const numeroDocumento = this.formMatricula.get('apoderado.numeroDocumento')?.value;
    if (!idtipodoc || !numeroDocumento) return;

    this.apoderadoService.buscarPorNumeroDocumento(idtipodoc, numeroDocumento).subscribe({
      next: (apoderado) => {
        this.apoderadoEncontrado = apoderado;
        this.formMatricula.patchValue({ apoderado: apoderado });
        this.mostrarFormularioApoderado = false;
      },
      error: err => {
        console.error('Error al buscar el apoderado:', err);
        this.apoderadoEncontrado = null;
        this.mostrarFormularioApoderado = true;
        alert('Apoderado no encontrado. Ingrese los datos manualmente.');
      }
    });
  }

  onSubmit(): void {
    if (this.formMatricula.invalid) {
      this.formMatricula.markAllAsTouched();
      return;
    }

    const formData = this.formMatricula.value;
    const apoderadoData = this.apoderadoEncontrado ? this.apoderadoEncontrado : formData.apoderado;
    const alumnoData = formData.alumno;

    const apoderadoObs = this.apoderadoEncontrado ?
      this.apoderadoService.buscarPorNumeroDocumento(apoderadoData.tipoDocumento, apoderadoData.numeroDocumento) :
      this.apoderadoService.agregarApoderado(apoderadoData);

    apoderadoObs.subscribe({
      next: (apoderadoResp) => {
        const idApoderado = apoderadoResp.idapoderado;
        this.alumnoService.agregarAlumno(alumnoData).subscribe({
          next: (alumnoResp: any) => {
            const idAlumno = alumnoResp.idalumno;
            const matriculaRequest = {
              idusuario: { idusuario: this.usuario.idusuario },
              idapoderado: { idapoderado: idApoderado },
              idalumno: { idalumno: idAlumno },
              nivel: this.nivel,
              grado: this.grado,
              seccion: this.seccion
            };

            this.matriculaService.agregarMatricula(matriculaRequest).subscribe({
              next: () => {
                alert('¡Matrícula registrada con éxito!');
                this.router.navigate(['/comprobantes']);
              },
              error: err => {
                console.error('Error al registrar la matrícula:', err);
                alert('Error al registrar la matrícula.');
              }
            });
          },
          error: err => {
            console.error('Error al registrar el alumno:', err);
            alert('Error al registrar el alumno.');
          }
        });
      },
      error: err => {
        console.error('Error al registrar el apoderado:', err);
        alert('Error al registrar el apoderado.');
      }
    });
  }
}
