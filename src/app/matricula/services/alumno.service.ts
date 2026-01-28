import { Alumno } from '../interfaces/DTOAlumno';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {

  private urlBase = `${environment.apiUrl}/v1/alumnos`;

  constructor(private http: HttpClient) { }

  obtenerAlumnoList(): Observable<Alumno[]> {
    return this.http.get<any>(`${this.urlBase}/listar`, { withCredentials: true })
      .pipe(map(response => {
        return response.data.content;
      }));
  }

  obtenerAlumno(id: string): Observable<Alumno> {
    return this.http.get<any>(`${this.urlBase}/listar/${id}`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
    );
  }

  agregarAlumno(alumno: Alumno): Observable<Alumno> {
    return this.http.post<Alumno>(`${this.urlBase}/agregar`, alumno, { withCredentials: true });
  }

  editarAlumno(id: string, alumno: Alumno): Observable<Alumno> {
    return this.http.put<Alumno>(`${this.urlBase}/editar/${id}`, alumno, { withCredentials: true });
  }

  eliminarAlumno(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true });
  }
}
