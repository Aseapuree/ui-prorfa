// src/app/services/alumno-curso.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AlumnoCurso } from '../interface/AlumnoCurso';

@Injectable({
  providedIn: 'root'
})
export class AlumnoCursoService {
    private urlBase = 'http://localhost:8080/v1/alumnos';

  constructor(private clienteHttp: HttpClient) {}

  obtenerCursosPorAlumno(idAuth: string): Observable<AlumnoCurso[]> {
    return this.clienteHttp
      .get<{ code: number; message: string; data: { code: number; message: string; data: AlumnoCurso[] }[] }>(
        `${this.urlBase}/cursos/${idAuth}`,
        { withCredentials: true }
      )
      .pipe(
        map(response => {
          console.log('Respuesta cruda del backend:', response); // Inspeccionar respuesta
          const cursos = response.data.flatMap(item => item.data);
          console.log('Cursos mapeados:', cursos); // Inspeccionar cursos
          return cursos;
        }),
        catchError(error => {
          console.error('Error al obtener los cursos del alumno', error);
          return throwError(() => new Error('Error al cargar los cursos'));
        })
      );
  }
}