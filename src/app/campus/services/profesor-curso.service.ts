import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ProfesorCurso } from '../interface/ProfesorCurso'; 
import { DTOResponse } from '../interface/DTOResponse';

@Injectable({
  providedIn: 'root'
})
export class ProfesorCursoService {

  private urlBase = "http://localhost:8080/v1/profesor-curso";

  constructor(private clienteHttp: HttpClient) { }

  // Listar asignaciones con paginación
  obtenerListaAsignaciones(page: number, size: number): Observable<{ content: ProfesorCurso[], totalElements: number }> {
    return this.clienteHttp
      .get<DTOResponse<{ content: ProfesorCurso[], totalElements: number }>>(
        `${this.urlBase}/listar?page=${page - 1}&size=${size}`,
        { withCredentials: true }
      )
      .pipe(
        map(response => ({
          content: response.data.content,
          totalElements: response.data.totalElements
        })),
        catchError(error => {
          console.error('Error al listar asignaciones:', error);
          return throwError(() => new Error('Error al cargar las asignaciones'));
        })
      );
  }

  // Obtener cursos de un profesor específico
  obtenerCursosPorProfesor(usuarioId: string): Observable<ProfesorCurso[]> {
    return this.clienteHttp.get<any>(`${this.urlBase}/listar-por-profesor/${usuarioId}`, { withCredentials: true })
      .pipe(
        map(response => {
          console.log('Respuesta del backend:', response); // Depura la respuesta
          return response.data; // Asegúrate de que response.data contiene los cursos
        }),
        catchError(error => {
          console.error('Error al obtener los cursos del profesor', error);
          return throwError(() => new Error('Error al cargar los cursos'));
        })
      );
  }

   // Obtener lista de asignaciones con paginación
   obtenerCourseList(page: number, size: number, sortBy: string, sortDir: string): Observable<{ content: ProfesorCurso[], totalElements: number }> {
    return this.clienteHttp
      .get<DTOResponse<{ content: ProfesorCurso[], totalElements: number }>>(
        `${this.urlBase}/listar?page=${page - 1}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
        { withCredentials: true }
      )
      .pipe(
        map(response => ({
          content: response.data.content,
          totalElements: response.data.totalElements
        })),
        catchError(error => {
          console.error('Error al obtener asignaciones:', error);
          return throwError(() => new Error('Error al cargar las asignaciones'));
        })
      );
  }

 // Agregar una nueva asignación
 agregarCurso(profesorCurso: ProfesorCurso): Observable<ProfesorCurso> {
  return this.clienteHttp
    .post<{ data: ProfesorCurso }>(`${this.urlBase}/agregar`, profesorCurso, { withCredentials: true })
    .pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error al agregar asignación:', error);
        return throwError(() => new Error('Error al agregar la asignación'));
      })
    );
}

// Editar una asignación existente
editarCurso(id: string, profesorCurso: ProfesorCurso): Observable<ProfesorCurso> {
  return this.clienteHttp
    .put<{ data: ProfesorCurso }>(`${this.urlBase}/editar/${id}`, profesorCurso, { withCredentials: true })
    .pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error al editar asignación:', error);
        return throwError(() => new Error('Error al editar la asignación'));
      })
    );
}

// Eliminar una asignación
eliminarCurso(id: string): Observable<void> {
  return this.clienteHttp
    .delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true })
    .pipe(
      catchError(error => {
        console.error('Error al eliminar asignación:', error);
        return throwError(() => new Error('Error al eliminar la asignación'));
      })
    );
}

// Buscar asignaciones por palabra clave
buscarAsignaciones(filters: {
  keyword?: string,
  profesorId?: string,
  cursoId?: string,
  grado?: string,
  seccion?: string,
  nivel?: string,
  fechaInicio?: string,
  fechaFin?: string,
  fechaTipo?: string
}): Observable<ProfesorCurso[]> {
  let params = new HttpParams();
  if (filters.keyword) params = params.set('palabraClave', filters.keyword); // Ajusta según el backend
  if (filters.profesorId) params = params.set('profesorId', filters.profesorId);
  if (filters.cursoId) params = params.set('cursoId', filters.cursoId);
  if (filters.grado) params = params.set('grado', filters.grado);
  if (filters.seccion) params = params.set('seccion', filters.seccion);
  if (filters.nivel) params = params.set('nivel', filters.nivel);
  if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
  if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);
  if (filters.fechaTipo) params = params.set('fechaTipo', filters.fechaTipo);

  console.log('Parámetros de la solicitud:', params.toString()); // Depuración

  return this.clienteHttp
    .get<{ data: ProfesorCurso[] }>(`${this.urlBase}/buscar`, { params, withCredentials: true })
    .pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error al buscar asignaciones:', error);
        return throwError(() => new Error('Error al buscar asignaciones'));
      })
    );
}

// Obtener conteo de asignaciones
obtenerConteoAsignaciones(): Observable<number> {
  return this.clienteHttp
    .get<{ data: number }>(`${this.urlBase}/contar`, { withCredentials: true })
    .pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error al contar asignaciones:', error);
        return throwError(() => new Error('Error al contar asignaciones'));
      })
    );
}
  
}
