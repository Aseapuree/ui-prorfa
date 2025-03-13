import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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

  private USUARIO_FIJO = {
    idusuario: 'b3a0a7fe-e4cc-432d-aa2a-41eab72779c6',
    idusuariorol: '07c8f96d-d127-41fa-98fb-7af4e4711597',
    nombre: 'Ronal',
    apellidopaterno: 'Quintos',
    apellidomaterno: 'Muñoz',
    idtipodoc: '29c2c5c3-2fc9-4410-ab24-52a8114f9c05'
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      this.nivel = params['nivel'];
      this.grado = +params['grado'];


      this.http.get(`http://localhost:8080/v1/matriculas/asignarSeccion/${this.grado}`, { responseType: 'text' })
        .subscribe({
          next: (resp) => this.seccion = resp,
          error: () => this.seccion = 'SIN VACANTE'
        });
    });

    this.crearFormulario();
  }

  crearFormulario(): void {
    this.formMatricula = this.fb.group({
      apoderado: this.fb.group({
        nombre: ['', Validators.required],
        apellidoPaterno: ['', Validators.required],
        apellidoMaterno: ['', Validators.required],
        tipoDocumento: ['', Validators.required],
        numeroDocumento: ['', Validators.required],
        telefono: ['', Validators.required],
        relacionEstudiante: ['', Validators.required],
        fechaNacimiento: ['', Validators.required],
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

  onSubmit(): void {
    if (this.formMatricula.invalid) {
      this.formMatricula.markAllAsTouched();
      return;
    }

    const apoderadoData = this.formMatricula.value.apoderado;
    const alumnoData = this.formMatricula.value.alumno;


    this.http.post<any>('http://localhost:8080/v1/apoderados/agregar', apoderadoData)
    .subscribe({
      next: (apoderadoResp) => {
        const idApoderado = apoderadoResp.data ? apoderadoResp.data.idapoderado : apoderadoResp.id;
        console.log('Apoderado guardado:', idApoderado);

        this.http.post<any>('http://localhost:8080/v1/alumnos/agregar', alumnoData)
          .subscribe({
            next: (alumnoResp) => {
              const idAlumno = alumnoResp.data ? alumnoResp.data.idalumno : alumnoResp.id;
              console.log('Alumno guardado:', idAlumno);

              const dtoMatricula = {
                idusuario: this.USUARIO_FIJO.idusuario,
                idapoderado: idApoderado,
                idalumno: idAlumno,
                nivel: this.nivel,
                grado: this.grado,
                seccion: this.seccion
              };

              this.http.post<any>('http://localhost:8080/v1/matriculas/agregar', dtoMatricula)
                .subscribe({
                  next: (matriculaResp) => {
                    console.log('Matrícula guardada:', matriculaResp);
                    alert('¡Matrícula registrada con éxito!');
                    this.router.navigate(['/']);
                  },
                  error: (err) => {
                    console.error('Error al guardar matrícula:', err);
                    alert('Error al guardar matrícula');
                  }
                });
            },
            error: (err) => {
              console.error('Error al guardar alumno:', err);
              alert('Error al guardar alumno');
            }
          });
      },
      error: (err) => {
        console.error('Error al guardar apoderado:', err);
        alert('Error al guardar apoderado');
      }
    });
  }
}
