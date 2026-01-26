import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ProfesorCurso } from '../interface/ProfesorCurso'; 
import { DTOResponse } from '../interface/DTOResponse';
import  saveAs  from 'file-saver';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfesorCursoService {

  private urlBase = `${environment.apiUrl}/api/v1/profesor-curso`;

  constructor(private clienteHttp: HttpClient) { }

  // Nuevo método para descargar el archivo Excel
  descargarExcel(filters?: {
  profesorId?: string;
  cursoId?: string;
  grado?: string;
  seccion?: string;
  nivel?: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaTipo?: string;
  palabraClave?: string;
}): Observable<void> {
  return this.clienteHttp
    .post(`${this.urlBase}/exportar-excel`, filters || {}, { responseType: 'blob', withCredentials: true })
    .pipe(
      map((response: Blob) => {
        saveAs(response, 'asignaciones_profesor_curso.xlsx');
        return undefined;
      }),
      catchError(error => {
        console.error('Error al descargar el archivo Excel:', error);
        return throwError(() => new Error('Error al descargar el archivo Excel'));
      })
    );
}

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
  obtenerCourseList(page: number, size: number): Observable<{ content: ProfesorCurso[]; totalElements: number }> {
  const params = new HttpParams()
    .set('page', (page - 1).toString())
    .set('size', size.toString());

  return this.clienteHttp
    .get<DTOResponse<any>>(`${this.urlBase}/listar`, { params, withCredentials: true })
    .pipe(
      map(response => ({
        content: response.data?.content || [],
        totalElements: response.data?.totalElements || 0
      })),
      catchError(error => {
        console.error('Error al obtener lista de asignaciones:', error);
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
editarCurso(profesorCurso: ProfesorCurso): Observable<ProfesorCurso> {
  return this.clienteHttp
    .put<{ data: ProfesorCurso }>(`${this.urlBase}/editar`, profesorCurso, { withCredentials: true })
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

buscarAsignaciones(
  filters: {
    keyword?: string;
    profesorId?: string;
    cursoId?: string;
    grado?: string;
    seccion?: string;
    nivel?: string;
    fechaInicio?: string;
    fechaFin?: string;
    fechaTipo?: string;
  },
  page: number,
  size: number
): Observable<{ content: ProfesorCurso[]; totalElements: number }> {
  let params = new HttpParams()
    .set('page', (page - 1).toString())
    .set('size', size.toString());

  // Solo agregamos los filtros reales (sin sortBy/sortDir)
  if (filters.keyword) params = params.set('palabraClave', filters.keyword);
  if (filters.profesorId) params = params.set('profesorId', filters.profesorId);
  if (filters.cursoId) params = params.set('cursoId', filters.cursoId);
  if (filters.grado) params = params.set('grado', filters.grado);
  if (filters.seccion) params = params.set('seccion', filters.seccion);
  if (filters.nivel) params = params.set('nivel', filters.nivel);
  if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
  if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);
  if (filters.fechaTipo) params = params.set('fechaTipo', filters.fechaTipo);

  console.log('Parámetros enviados al backend (sin sort):', params.toString());

  return this.clienteHttp
    .get<DTOResponse<any>>(`${this.urlBase}/buscar`, { params, withCredentials: true })
    .pipe(
      map(response => {
        const content = response.data?.content || [];
        const totalElements = response.data?.totalElements || 0;

        return { content, totalElements };
      }),
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
