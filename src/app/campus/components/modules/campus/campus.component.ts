import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/card/card.component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { ProfesorCursoService } from '../../../services/profesor-curso.service';
import { ProfesorCurso } from '../../../interface/profesor-curso';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-campus',
  standalone: true,
  imports: [RouterModule, CardComponent, HttpClientModule, CommonModule, NgxPaginationModule],
  providers: [ProfesorCursoService],
  templateUrl: './campus.component.html',
  styleUrl: './campus.component.scss'
})
export class CampusComponent implements OnInit {
  public page!: number;
  profesorcursos: ProfesorCurso[] = [];

  constructor(private profesorCursoService: ProfesorCursoService) {}

  async ngOnInit(): Promise<void> {
    await this.obtenerCurso();
  }

  async obtenerCurso(): Promise<void> {
    try {
      this.profesorcursos = await lastValueFrom(this.profesorCursoService.obtenerCourseList());
    } catch (error) {
      console.error('Error al obtener los cursos', error);
    }
  }
}
