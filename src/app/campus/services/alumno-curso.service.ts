// src/app/services/alumno-curso.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AlumnoCurso } from '../interface/AlumnoCurso';

@Injectable({
  providedIn: 'root'
})
export class AlumnoCursoService {
  private urlBase = "http://localhost:8080/v1/alumno-curso";

  constructor(private clienteHttp: HttpClient) { }

  
  obtenerCursosPorAlumno(usuarioId: string): Observable<AlumnoCurso[]> {
    return this.clienteHttp.get<any>(`${this.urlBase}/listar-por-alumno/${usuarioId}`, { withCredentials: true })
      .pipe(
        map(response => {
          console.log("Cursos del alumno cargados correctamente:", response);
          return response.data;
        }),
        catchError(error => {
          console.error('Error al obtener los cursos del alumno:', error);
          const errorMessage = error.statusText || 'Error al cargar los cursos';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Nuevo método para obtener el idCurso a partir de idAlumnoCurso
 // En alumno-curso.service.ts
obtenerCursoIdPorAlumnoCurso(idAlumnoCurso: string): Observable<string> {
  return this.clienteHttp.get<any>(`${this.urlBase}/curso-id/${idAlumnoCurso}`, { withCredentials: true })
    .pipe(
      map(response => {
        console.log("ID del curso obtenido:", response.data);
        return response.data; // Devuelve el UUID como string
      }),
      catchError(error => {
        console.error('Error al obtener el ID del curso:', error);
        return throwError(() => new Error('Error al obtener el ID del curso'));
      })
    );
}
}