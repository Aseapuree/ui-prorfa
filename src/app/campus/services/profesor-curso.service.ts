import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ProfesorCurso } from '../interface/ProfesorCurso'; 

@Injectable({
  providedIn: 'root'
})
export class ProfesorCursoService {

  private urlBase = "http://localhost:8080/v1/profesor-curso";

  constructor(private clienteHttp: HttpClient) { }

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

   // Obtener lista de profesores con sus cursos
  obtenerCourseList(): Observable<ProfesorCurso[]> {
    return this.clienteHttp.get<any>(`${this.urlBase}/listar`,{withCredentials:true})
  .pipe(map(response => {
    console.log("Lista de asignaciones cargada correctamente.");
    return response.data.content;
  })); 
  }

  // Agregar un nuevo curso para un profesor
  agregarCurso(profesorCurso: ProfesorCurso): Observable<ProfesorCurso> {
    return this.clienteHttp.post<ProfesorCurso>(`${this.urlBase}/agregar`, profesorCurso,{withCredentials:true});
  }

  // Editar un curso existente
  editarCurso(id: string, profesorCurso: ProfesorCurso): Observable<ProfesorCurso> {
    return this.clienteHttp.put<ProfesorCurso>(`${this.urlBase}/editar/${id}`, profesorCurso,{withCredentials:true});
  }

  // Eliminar un curso
  eliminarCurso(id: string): Observable<void> {
    return this.clienteHttp.delete<void>(`${this.urlBase}/eliminar/${id}`,{withCredentials:true});
  }
  
}
