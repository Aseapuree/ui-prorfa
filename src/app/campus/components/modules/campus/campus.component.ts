import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/card/card.component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { ProfesorCursoService } from '../../../services/profesor-curso.service';
import { ProfesorCurso } from '../../../interface/ProfesorCurso'; 
import { lastValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { UserData, ValidateService } from '../../../../services/validateAuth.service';
import { UsuarioService } from '../../../services/usuario.service';
import { AlumnoCursoService } from '../../../services/alumno-curso.service';
import { AlumnoCurso } from '../../../interface/AlumnoCurso';

@Component({
  selector: 'app-campus',
  standalone: true,
  imports: [RouterModule, CardComponent, HttpClientModule, CommonModule, NgxPaginationModule, MatButtonModule, MatDialogModule],
  providers: [ProfesorCursoService, AlumnoCursoService],
  templateUrl: './campus.component.html',
  styleUrl: './campus.component.scss'
})
export class CampusComponent implements OnInit {
  public page: number = 1;
  profesorcursos: ProfesorCurso[] = [];
  alumnocursos: AlumnoCurso[] = []; // Lista para cursos de alumnos
  usuarioId: string | null = null; // ID del usuario autenticado
  rolUsuario: string | null = null; // Rol del usuario autenticado

  constructor(
    private profesorCursoService: ProfesorCursoService,
    private alumnoCursoService: AlumnoCursoService, // Inyectar el servicio
    private authService: ValidateService, // Inyecta el servicio
    private usuarioService: UsuarioService // Inyecta el nuevo servicio
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Obtener los datos del usuario autenticado
      const userData: UserData = await lastValueFrom(this.authService.getUserData());
      console.log('Datos del usuario:', userData);

      // Extraer el id_auth y el rol
      const idAuth = userData?.data?.id;
      this.rolUsuario = userData?.data?.rol || null;
      if (!idAuth) {
        console.error('No se encontró el id_auth del usuario');
        return;
      }

      // Obtener el idusuario a partir del id_auth
      this.usuarioId = await lastValueFrom(this.usuarioService.getUsuarioByIdAuth(idAuth));
      console.log('usuarioId obtenido:', this.usuarioId);

      if (this.usuarioId) {
        localStorage.setItem('usuarioId', this.usuarioId);
        // Cargar cursos según el rol del usuario
        if (this.rolUsuario === 'Profesor') {
          await this.obtenerCursosPorProfesor();
        } else if (this.rolUsuario === 'Alumno') {
          await this.obtenerCursosPorAlumno();
        } else {
          console.warn('Rol no reconocido:', this.rolUsuario);
        }
      } else {
        console.error('No se encontró el ID del usuario autenticado');
      }
    } catch (error) {
      console.error('Error al inicializar el componente:', error);
    }
  }

  // Obtener cursos del profesor
  async obtenerCursosPorProfesor(): Promise<void> {
    try {
      this.profesorcursos = await lastValueFrom(this.profesorCursoService.obtenerCursosPorProfesor(this.usuarioId!));
      console.log("Cursos del profesor: ", this.profesorcursos);
    } catch (error) {
      console.error('Error al obtener los cursos del profesor', error);
    }
  }

  // Obtener cursos del alumno
  async obtenerCursosPorAlumno(): Promise<void> {
    try {
      this.alumnocursos = await lastValueFrom(this.alumnoCursoService.obtenerCursosPorAlumno(this.usuarioId!));
      console.log("Cursos del alumno: ", this.alumnocursos);
    } catch (error) {
      console.error('Error al obtener los cursos del alumno', error);
    }
  }

  // Obtener cursos
  async obtenerCurso(): Promise<void> {
    try {
      this.profesorcursos = await lastValueFrom(this.profesorCursoService.obtenerCourseList());
      console.log("PROFESOR CURSOS: ", this.profesorcursos)
    } catch (error) {
      console.error('Error al obtener los cursos', error);
    }
  }

  // Agregar curso
  async agregarCurso(nuevoCurso: ProfesorCurso): Promise<void> {
    try {
      const cursoGuardado = await lastValueFrom(this.profesorCursoService.agregarCurso(nuevoCurso));
      this.profesorcursos.push(cursoGuardado);
      console.log("Curso agregado correctamente", cursoGuardado);
    } catch (error) {
      console.error("Error al agregar el curso", error);
    }
  }

  // Editar curso
  async editarCurso(id: string, cursoEditado: ProfesorCurso): Promise<void> {
    try {
      await lastValueFrom(this.profesorCursoService.editarCurso(id, cursoEditado));
      this.profesorcursos = this.profesorcursos.map(curso => curso.idProfesorCurso === id ? cursoEditado : curso);
      console.log("Curso editado correctamente");
    } catch (error) {
      console.error("Error al editar el curso", error);
    }
  }

  // Eliminar curso
  async eliminarCurso(id: string): Promise<void> {
    try {
      await lastValueFrom(this.profesorCursoService.eliminarCurso(id));
      this.profesorcursos = this.profesorcursos.filter(curso => curso.idProfesorCurso !== id);
      console.log("Curso eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar el curso", error);
    }
  }

}
