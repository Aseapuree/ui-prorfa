import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Competencia, Curso } from '../interface/curso';
import { response } from 'express';
import { DTOResponse } from '../interface/DTOResponse';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private urlBase = "http://localhost:8080/v1/cursos";


  constructor(private clienteHttp: HttpClient) { }


  obtenerListaCursos(page: number, size: number, sortBy: string, sortDir: string): Observable<{ content: Curso[], totalElements: number }> {
    return this.clienteHttp
      .get<{ data: { content: Curso[], totalElements: number } }>(
        `${this.urlBase}/listar?page=${page - 1}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
        { withCredentials: true }
      )
      .pipe(
        map(response => ({
          content: response.data.content,
          totalElements: response.data.totalElements
        }))
      );
  }

  agregarCurso(curso: Curso): Observable<Curso> {
    return this.clienteHttp
      .post<DTOResponse<Curso>>(`${this.urlBase}/agregar`, curso, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.code !== 201) {
            throw new Error(response.message || 'Error al agregar el curso');
          }
          return response.data;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en agregarCurso:', error);
          return throwError(() => new Error(error.message || 'Error al agregar el curso'));
        })
      );
  }

  actualizarCurso(curso: Curso): Observable<Curso> {
    return this.clienteHttp
      .put<DTOResponse<Curso>>(`${this.urlBase}/editar`, curso, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.code !== 200) {
            throw new Error(response.message || 'Error al actualizar el curso');
          }
          return response.data;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en actualizarCurso:', error);
          return throwError(() => new Error(error.message || 'Error al actualizar el curso'));
        })
      );
}

  eliminarCurso(id: string): Observable<void> {
    return this.clienteHttp.delete<void>(`${this.urlBase}/eliminar/${id}`,{withCredentials:true});
  }

  buscarCursos(keyword: string, sortBy: string = 'fechaCreacion', sortDir: string = 'asc'): Observable<Curso[]> {
    return this.clienteHttp
      .get<{ data: Curso[] }>(`${this.urlBase}/buscar?keyword=${keyword}&sortBy=${sortBy}&sortDir=${sortDir}`, { withCredentials: true })
      .pipe(
        map(response => response.data)
      );
  }

  obtenerConteoCursos(): Observable<number> {
    return this.clienteHttp.get<DTOResponse<number>>(`${this.urlBase}/contar`, { withCredentials: true })
      .pipe(map(response => response.data));
  }
  

  // Nuevo método para obtener competencias de un curso
  obtenerCompetenciasPorCurso(idCurso: string): Observable<Competencia[]> {
    return this.clienteHttp
      .get<{ data: Competencia[] }>(`${this.urlBase}/${idCurso}/competencias`, { withCredentials: true })
      .pipe(
        map(response => response.data),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener competencias:', error);
          return throwError(() => new Error(error.message || 'Error al obtener competencias'));
        })
      );
  }

  obtenerListaCursosSinOrden(page: number, size: number): Observable<{ content: Curso[], totalElements: number }> {
  return this.clienteHttp
    .get<{ data: { content: Curso[], totalElements: number } }>(
      `${this.urlBase}/listar?page=${page - 1}&size=${size}`,
      { withCredentials: true }
    )
    .pipe(
      map(response => ({
        content: response.data.content,
        totalElements: response.data.totalElements
      }))
    );
}
}