import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { CardComponent } from '../../../shared/card/card.component';
import { ProfesorCursoService } from '../../../../services/profesor-curso.service';
import { lastValueFrom } from 'rxjs';
import { ProfesorCurso } from '../../../../interface/profesor-curso';

@Component({
  selector: 'app-campus-alumno',
  standalone: true,
  imports: [RouterModule, CardComponent, HttpClientModule, CommonModule, NgxPaginationModule, MatButtonModule, MatDialogModule],
  providers: [ProfesorCursoService],
  templateUrl: './campus-alumno.component.html',
  styleUrl: './campus-alumno.component.scss'
})

export class CampusAlumnoComponent implements OnInit {
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
    } catch (error) {
      console.error('Error al obtener los cursos', error);
    }
  }

}

