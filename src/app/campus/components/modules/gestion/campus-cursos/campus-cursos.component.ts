import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CourseService } from '../../../../services/course.service';
import { lastValueFrom } from 'rxjs';
import { Curso } from '../../../../interface/curso';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campus-cursos',
  standalone: true,
  imports: [RouterModule, HttpClientModule,CommonModule],
  providers: [CourseService],
  templateUrl: './campus-cursos.component.html',
  styleUrl: './campus-cursos.component.scss'
})
export class CampusCursosComponent {

  cursos: Curso[] = [];

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.courseService.obtenerCourseList().subscribe({
      next: (cursos) => this.cursos = cursos,
      error: (err) => console.error('Error al cargar cursos:', err)
    });
  }
}
