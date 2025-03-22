import { Alumno } from './../interfaces/DTOAlumno';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {

  private urlBase = "http://localhost:8080/v1/alumnos";

  constructor(private http: HttpClient) { }

  // Obtener lista de alumnos
  obtenerAlumnoList(): Observable<Alumno[]> {
    return this.http.get<any>(`${this.urlBase}/listar`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Lista de alumnos cargada correctamente.");
        return response.data.content;
      }));
  }

  // Agregar un nuevo alumno
  agregarAlumno(alumno: Alumno): Observable<Alumno> {
    return this.http.post<Alumno>(`${this.urlBase}/agregar`, alumno, { withCredentials: true });
  }

  // Editar un alumno existente
  editarAlumno(id: string, alumno: Alumno): Observable<Alumno> {
    return this.http.put<Alumno>(`${this.urlBase}/editar/${id}`, alumno, { withCredentials: true });
  }

  // Eliminar un alumno
  eliminarAlumno(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true });
  }
}
