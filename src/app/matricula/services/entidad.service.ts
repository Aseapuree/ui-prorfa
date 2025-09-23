import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Entidad } from '../interfaces/DTOEntidad';
import { DTOResponse } from '../../general/Interface/DTOResponse';

@Injectable({
  providedIn: 'root'
})
export class EntidadService {

  private urlBase = "http://localhost:8080/v1/entidades";

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('Ocurrió un error:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error.error)}`);
    }
    return throwError(() => new Error('Ocurrió un error inesperado; por favor, inténtelo de nuevo más tarde.'));
  }

  // Nuevo servicio para obtener datos de la entidad por el ID del usuario
  obtenerEntidadPorUsuario(id: string): Observable<Entidad> {
    return this.http.get<DTOResponse<Entidad>>(`${this.urlBase}/usuario/${id}`, { withCredentials: true })
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          } else {
            console.error('Estructura de respuesta inesperada para obtenerEntidadPorUsuario', response);
            throw new Error('No se pudieron recuperar los datos de la entidad para el usuario');
          }
        }),
        catchError(this.handleError)
      );
  }

  obtenerEntidadList(): Observable<Entidad[]> {
    return this.http.get<any>(`${this.urlBase}/listar`, { withCredentials: true })
      .pipe(
        map(response => {
          if (response && response.data && response.data.content) {
            return response.data.content as Entidad[];
          } else {
            console.error('Estructura de respuesta inesperada para obtenerEntidadList', response);
            return [];
          }
        }),
        catchError(this.handleError)
      );
  }

  obtenerEntidad(id: string): Observable<Entidad> {
    return this.http.get<any>(`${this.urlBase}/listar/${id}`, { withCredentials: true })
      .pipe(
        map(response => {
           if (response && response.data) {
            return response.data as Entidad;
          } else {
            console.error('Estructura de respuesta inesperada para obtenerEntidad', response);
            throw new Error('No se pudieron recuperar los datos de la entidad');
          }
        }),
        catchError(this.handleError)
      );
  }

  agregarEntidad(entidad: Entidad): Observable<Entidad> {
    return this.http.post<Entidad>(`${this.urlBase}/agregar`, entidad, { withCredentials: true })
      .pipe(
        map(response => {
           return response;
        }),
        catchError(this.handleError)
      );
  }

  editarEntidad(id: string, entidad: Entidad): Observable<Entidad> {
    return this.http.put<Entidad>(`${this.urlBase}/editar/${id}`, entidad, { withCredentials: true })
       .pipe(
        map(response => {
           return response;
        }),
        catchError(this.handleError)
      );
  }

  eliminarEntidad(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }
}
