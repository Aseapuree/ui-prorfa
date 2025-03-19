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

@Component({
  selector: 'app-campus',
  standalone: true,
  imports: [RouterModule, CardComponent, HttpClientModule, CommonModule, NgxPaginationModule, MatButtonModule, MatDialogModule],
  providers: [ProfesorCursoService],
  templateUrl: './campus.component.html',
  styleUrl: './campus.component.scss'
})
export class CampusComponent implements OnInit {
  public page: number = 1;
  profesorcursos: ProfesorCurso[] = [];

  constructor(
    private profesorCursoService: ProfesorCursoService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.obtenerCurso();
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
