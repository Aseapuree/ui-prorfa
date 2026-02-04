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
import { GeneralLoadingSpinnerComponent } from '../../../../general/components/spinner/spinner.component';
import { PaginationComponent } from '../../../../general/components/pagination/pagination.component';

@Component({
  selector: 'app-campus',
  standalone: true,
  imports: [RouterModule, CardComponent, HttpClientModule, CommonModule, MatButtonModule, MatDialogModule,PaginationComponent,GeneralLoadingSpinnerComponent],
  providers: [ProfesorCursoService, AlumnoCursoService],
  templateUrl: './campus.component.html',
  styleUrl: './campus.component.scss'
})
export class CampusComponent implements OnInit {
  public page: number = 1;
  public itemsPerPage: number = 4;
  public totalPages: number = 1; 
  profesorcursos: ProfesorCurso[] = [];
  alumnocursos: AlumnoCurso[] = [];
  idAuth: string | null = null;
  rolUsuario: string | null = null;
  niveles: { nivel: string; cursos: ProfesorCurso[]; sesiones: number }[] = [];
  hasCursos: boolean = false;
  isLoading: boolean = false;

  constructor(
    private profesorCursoService: ProfesorCursoService,
    private sesionService: SesionService,
    private alumnoCursoService: AlumnoCursoService,
    private authService: ValidateService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      const userData: UserData = await lastValueFrom(this.authService.getUserData());
      console.log('Datos del usuario:', userData);

      this.idAuth = userData?.data?.id;
      this.rolUsuario = userData?.data?.rol || null;
      if (!this.idAuth) {
        console.error('No se encontró el id_auth del usuario');
        this.isLoading = false;
        return;
      }

      console.log('idAuth:', this.idAuth);
      localStorage.setItem('idAuth', this.idAuth);

      if (this.rolUsuario === 'Profesor') {
        const usuarioId = await lastValueFrom(
          this.usuarioService.getUsuarioByIdAuth(this.idAuth)
        );
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
      this.isLoading = false;
    }
  }

  async obtenerCursosPorProfesor(usuarioId: string): Promise<void> {
    this.isLoading = true;
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
      this.isLoading = false;
    }
  }

  async obtenerCursosPorAlumno(): Promise<void> {
    this.isLoading = true;
    try {
      this.alumnocursos = await lastValueFrom(
        this.alumnoCursoService.obtenerCursosPorAlumno(this.idAuth!)
      );
      console.log('Cursos del alumno:', this.alumnocursos);
      this.updateTotalPages();
    } catch (error) {
      console.error('Error al obtener los cursos del alumno:', error);
      this.alumnocursos = [];
      this.updateTotalPages();
    } finally {
      this.isLoading = false;
    }
  }

  async prepararNiveles(): Promise<void> {
    this.isLoading = true;
    try {
      console.log('Preparando niveles con cursos:', this.profesorcursos);

      const primariaCursos = this.profesorcursos.filter(
        (curso) => curso.nivel?.toLowerCase() === 'primaria'
      );

      const secundariaCursos = this.profesorcursos.filter(
        (curso) => curso.nivel?.toLowerCase() === 'secundaria'
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
      this.isLoading = false;
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
          console.error(
            `Error al obtener sesiones para el curso ${curso.idProfesorCurso}:`,
            error
          );
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
      const nivel = profesorCurso.nivel ?? '';
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

  updateTotalPages(): void {
    this.totalPages = Math.ceil(this.alumnocursos.length / this.itemsPerPage);
    if (this.page > this.totalPages && this.totalPages > 0) {
      this.page = 1;
    }
    console.log(
      `Total páginas actualizadas: ${this.totalPages}, página actual: ${this.page}`
    );
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      console.log(`Cambiando a página: ${page}`);
      this.page = page;
    }
  }
}