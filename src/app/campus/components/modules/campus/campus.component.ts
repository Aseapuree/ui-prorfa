import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/card/card.component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { ProfesorCursoService } from '../../../services/profesor-curso.service';
import { ProfesorCurso } from '../../../interface/ProfesorCurso'; 
import { lastValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { UserData, ValidateService } from '../../../../core/services/validateAuth.service'
import { UsuarioService } from '../../../services/usuario.service';
import { AlumnoCursoService } from '../../../services/alumno-curso.service';
import { AlumnoCurso } from '../../../interface/AlumnoCurso';
import { SesionService } from '../../../services/sesion.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { GeneralLoadingSpinnerComponent } from '../../../../general/components/spinner/spinner.component';

@Component({
  selector: 'app-campus',
  standalone: true,
  imports: [RouterModule, CardComponent, HttpClientModule, CommonModule, NgxPaginationModule, MatButtonModule, MatDialogModule,PaginationComponent,GeneralLoadingSpinnerComponent],
  providers: [ProfesorCursoService, AlumnoCursoService],
  templateUrl: './campus.component.html',
  styleUrl: './campus.component.scss'
})
export class CampusComponent implements OnInit {
  public page: number = 1;
  profesorcursos: ProfesorCurso[] = [];
  alumnocursos: AlumnoCurso[] = [];
  idAuth: string | null = null;
  rolUsuario: string | null = null;
  niveles: { nivel: string; cursos: ProfesorCurso[]; sesiones: number }[] = [];
  hasCursos: boolean = false;
  isLoading: boolean = false; // Propiedad para controlar el spinner

  constructor(
    private profesorCursoService: ProfesorCursoService,
    private sesionService: SesionService,
    private alumnoCursoService: AlumnoCursoService,
    private authService: ValidateService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true; // Activa el spinner al iniciar
    try {
      const userData: UserData = await lastValueFrom(this.authService.getUserData());
      console.log('Datos del usuario:', userData);

      this.idAuth = userData?.data?.id;
      this.rolUsuario = userData?.data?.rol || null;
      if (!this.idAuth) {
        console.error('No se encontró el id_auth del usuario');
        this.isLoading = false; // Desactiva el spinner si hay error
        return;
      }

      console.log('idAuth:', this.idAuth);
      localStorage.setItem('idAuth', this.idAuth);

      if (this.rolUsuario === 'Profesor') {
        const usuarioId = await lastValueFrom(this.usuarioService.getUsuarioByIdAuth(this.idAuth));
        console.log('usuarioId:', usuarioId);
        if (usuarioId) {
          localStorage.setItem('usuarioId', usuarioId);
          await this.obtenerCursosPorProfesor(usuarioId);
          await this.prepararNiveles();
          this.hasCursos = this.niveles.length > 0;
        } else {
          console.error('No se encontró el ID del usuario autenticado para el profesor');
        }
      } else if (this.rolUsuario === 'Alumno') {
        await this.obtenerCursosPorAlumno();
      } else {
        console.warn('Rol no reconocido:', this.rolUsuario);
      }
    } catch (error) {
      console.error('Error al inicializar el componente:', error);
    } finally {
      this.isLoading = false; // Desactiva el spinner al finalizar
    }
  }

  async obtenerCursosPorProfesor(usuarioId: string): Promise<void> {
    this.isLoading = true; // Activa el spinner
    try {
      const rawResponse = await lastValueFrom(
        this.profesorCursoService.obtenerCursosPorProfesor(usuarioId)
      );
      console.log('Respuesta cruda del backend:', rawResponse);

      this.profesorcursos = Array.isArray(rawResponse) ? rawResponse : [];
      console.log('Cursos del profesor (mapeados):', this.profesorcursos);
    } catch (error) {
      console.error('Error al obtener los cursos del profesor:', error);
      this.profesorcursos = [];
    } finally {
      this.isLoading = false; // Desactiva el spinner
    }
  }

  async obtenerCursosPorAlumno(): Promise<void> {
    this.isLoading = true; // Activa el spinner
    try {
      this.alumnocursos = await lastValueFrom(
        this.alumnoCursoService.obtenerCursosPorAlumno(this.idAuth!)
      );
      console.log('Cursos del alumno:', this.alumnocursos);
    } catch (error) {
      console.error('Error al obtener los cursos del alumno:', error);
    } finally {
      this.isLoading = false; // Desactiva el spinner
    }
  }

  async prepararNiveles(): Promise<void> {
    this.isLoading = true; // Activa el spinner
    try {
      console.log('Preparando niveles con cursos:', this.profesorcursos);

      const primariaCursos = this.profesorcursos.filter(curso =>
        curso.nivel?.toLowerCase() === 'primaria'
      );

      const secundariaCursos = this.profesorcursos.filter(curso =>
        curso.nivel?.toLowerCase() === 'secundaria'
      );

      console.log('Cursos Primaria:', primariaCursos);
      console.log('Cursos Secundaria:', secundariaCursos);

      this.niveles = [];

      if (primariaCursos.length > 0) {
        const sesionesPrimaria = await this.contarSesiones(primariaCursos);
        this.niveles.push({
          nivel: 'Primaria',
          cursos: primariaCursos,
          sesiones: sesionesPrimaria,
        });
      }

      if (secundariaCursos.length > 0) {
        const sesionesSecundaria = await this.contarSesiones(secundariaCursos);
        this.niveles.push({
          nivel: 'Secundaria',
          cursos: secundariaCursos,
          sesiones: sesionesSecundaria,
        });
      }

      console.log('Niveles preparados:', this.niveles);
    } finally {
      this.isLoading = false; // Desactiva el spinner
    }
  }

  async contarSesiones(cursos: ProfesorCurso[]): Promise<number> {
    let totalSesiones = 0;
    for (const curso of cursos) {
      if (curso.idProfesorCurso) {
        try {
          const sesiones = await lastValueFrom(
            this.sesionService.obtenerSesionesPorCurso(curso.idProfesorCurso)
          );
          totalSesiones += sesiones.length;
        } catch (error) {
          console.error(`Error al obtener sesiones para el curso ${curso.idProfesorCurso}:`, error);
        }
      }
    }
    return totalSesiones;
  }

  seleccionarCurso(curso: ProfesorCurso | AlumnoCurso): void {
    if (this.rolUsuario === 'Profesor') {
      const profesorCurso = curso as ProfesorCurso;
      const grado = profesorCurso.grado ?? '';
      const seccion = profesorCurso.seccion ?? '';
      const nivel = profesorCurso.nivel ?? ''; // Ya no necesitamos inferir el nivel
      const idCurso = profesorCurso.curso?.idCurso ?? '';

      if (grado && seccion && nivel && idCurso) {
        localStorage.setItem('grado', grado);
        localStorage.setItem('seccion', seccion);
        localStorage.setItem('nivel', nivel);
        localStorage.setItem('idCurso', idCurso);

        console.log('Curso seleccionado (Profesor):', {
          idProfesorCurso: profesorCurso.idProfesorCurso,
          idCurso,
          grado,
          seccion,
          nivel,
        });

        this.router.navigate(['/sesiones/profesor', profesorCurso.idProfesorCurso]);
      } else {
        console.error('Datos incompletos para el curso:', {
          idCurso,
          grado,
          seccion,
          nivel,
        });
      }
    } else if (this.rolUsuario === 'Alumno') {
      const alumnoCurso = curso as AlumnoCurso;
      if (alumnoCurso.idCurso) {
        localStorage.setItem('idCurso', alumnoCurso.idCurso);
        localStorage.setItem('grado', alumnoCurso.grado?.toString() || '');
        localStorage.setItem('seccion', alumnoCurso.seccion || '');
        localStorage.setItem('nivel', alumnoCurso.nivel || '');

        console.log('Curso seleccionado (Alumno):', alumnoCurso);
        this.router.navigate(['/sesiones/alumno', alumnoCurso.idCurso]);
      } else {
        console.error('Datos incompletos para el curso:', alumnoCurso);
      }
    }
  }

  navigateToGrados(nivel: string): void {
    this.router.navigate(['/campus/grados', nivel]);
  }
}