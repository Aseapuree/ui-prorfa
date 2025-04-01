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
  obtenerCursoIdPorAlumnoCurso(idAlumnoCurso: string): Observable<string> {
  return this.obtenerCursosPorAlumno(idAlumnoCurso).pipe(
    map((alumnoCursos: AlumnoCurso[]) => {
      const alumnoCurso = alumnoCursos.find(ac => ac.idAlumnoCurso === idAlumnoCurso);
      if (!alumnoCurso || !alumnoCurso.curso?.idCurso) {
        throw new Error('No se encontró el curso para este idAlumnoCurso');
      }
      return alumnoCurso.curso.idCurso;
    }),
    catchError(error => {
      console.error('Error al obtener el ID del curso:', error);
      return throwError(() => new Error('Error al obtener el ID del curso'));
    })
  );
}
}