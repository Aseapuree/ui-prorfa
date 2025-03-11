import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ProfesorCurso } from '../interface/profesor-curso';

@Injectable({
  providedIn: 'root'
})
export class ProfesorCursoService {

  private urlBase = "http://localhost:8080/v1/profesor-curso";

  constructor(private clienteHttp: HttpClient) { }

   // Obtener lista de profesores con sus cursos
  obtenerCourseList(): Observable<ProfesorCurso[]> {
    return this.clienteHttp.get<{ data: { content: ProfesorCurso[] } }>(`${this.urlBase}/listar`)
  .pipe(map(response => {
    console.log("Lista de asignaciones cargada correctamente.");
    return response.data.content;
  })); 
  }

  // Agregar un nuevo curso para un profesor
  agregarCurso(profesorCurso: ProfesorCurso): Observable<ProfesorCurso> {
    return this.clienteHttp.post<ProfesorCurso>(`${this.urlBase}/agregar`, profesorCurso);
  }

  // Editar un curso existente
  editarCurso(id: string, profesorCurso: ProfesorCurso): Observable<ProfesorCurso> {
    return this.clienteHttp.put<ProfesorCurso>(`${this.urlBase}/editar/${id}`, profesorCurso);
  }

  // Eliminar un curso
  eliminarCurso(id: string): Observable<void> {
    return this.clienteHttp.delete<void>(`${this.urlBase}/eliminar/${id}`);
  }
  
}
