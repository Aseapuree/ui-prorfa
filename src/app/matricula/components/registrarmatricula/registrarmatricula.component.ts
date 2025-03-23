import { MatriculaService } from './../../services/matricula.service';
import { AlumnoService } from './../../services/alumno.service';
import { ApoderadoService } from './../../services/apoderado.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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

  mostrarFormularioApoderado: boolean = true;

  usuario = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || '{}');

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
    this.formMatricula = this.fb.group({
      dniBusqueda: [''],
      apoderado: this.fb.group({
        nombre: ['', Validators.required],
        apellidoPaterno: ['', Validators.required],
        apellidoMaterno: ['', Validators.required],
        tipoDocumento: ['', Validators.required],
        numeroDocumento: ['', Validators.required],
        telefono: ['', Validators.required],
        relacionEstudiante: ['', Validators.required],
        direccion: ['', Validators.required],
        correo: ['', [Validators.required, Validators.email]]
      }),
      alumno: this.fb.group({
        nombre: ['', Validators.required],
        apellidoPaterno: ['', Validators.required],
        apellidoMaterno: ['', Validators.required],
        tipoDocumento: ['', Validators.required],
        numeroDocumento: ['', Validators.required],
        fechaNacimiento: ['', Validators.required],
        direccion: ['', Validators.required]
      })
    });
  }


  buscarApoderado(): void {
    const dni = this.formMatricula.get('dniBusqueda')?.value;
    if (!dni) return;

    this.apoderadoService.buscarPorNumeroDocumento(dni).subscribe({
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
      this.apoderadoService.buscarPorNumeroDocumento(apoderadoData.numeroDocumento) :
      this.apoderadoService.agregarApoderado(apoderadoData);

    apoderadoObs.subscribe({
      next: (apoderadoResp) => {
        const idApoderado = apoderadoResp.idapoderado || apoderadoResp.idapoderado;
        this.alumnoService.agregarAlumno(alumnoData).subscribe({
          next: (alumnoResp: any) => {
            const idAlumno = alumnoResp.idalumno || alumnoResp.id;

            const matriculaRequest = {
              idusuario: this.usuario.idusuario,
              idapoderado: idApoderado,
              idalumno: idAlumno,
              nivel: this.nivel,
              grado: this.grado,
              seccion: this.seccion
            };

            this.matriculaService.agregarMatricula(matriculaRequest).subscribe({
              next: () => {
                alert('¡Matrícula registrada con éxito!');
                this.router.navigate(['/']);
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
