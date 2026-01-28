import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Entidad } from '../interfaces/DTOEntidad';
import { DTOResponse } from '../../general/interfaces/DTOResponse';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EntidadService {

  private urlBase = `${environment.apiUrl}/v1/entidades`;

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('Error del cliente:', error.error.message);
    } else {
      console.error('Error del servidor:', error.status, error.message);
    }
    return throwError(() => new Error('Ocurrió un error inesperado; por favor, inténtelo de nuevo más tarde.'));
  }

  obtenerEntidadPorUsuario(id: string): Observable<Entidad> {
  return this.http.get<DTOResponse<Entidad>>(`${this.urlBase}/usuario/${id}`, { withCredentials: true })
    .pipe(
      map(response => {
        if (response && response.data) {
          return response.data;
        } else {
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
            return [];
          }
        }),
        catchError(this.handleError)
      );
  }

  obtenerEntidad(id: string): Observable<Entidad> {
    return this.http.get<DTOResponse<Entidad>>(`${this.urlBase}/listar/${id}`, { withCredentials: true })
      .pipe(
        map(response => {
           if (response && response.data) {
            return response.data as Entidad;
          } else {
            throw new Error('No se pudieron recuperar los datos de la entidad');
          }
        }),
        catchError(this.handleError)
      );
  }

  agregarEntidad(entidad: Entidad): Observable<Entidad> {
    return this.http.post<DTOResponse<Entidad>>(`${this.urlBase}/agregar`, entidad, { withCredentials: true })
      .pipe(
        map(response => {
           if (response && response.data) {
            return response.data;
          } else {
            throw new Error('No se pudo agregar la entidad');
          }
        }),
        catchError(this.handleError)
      );
  }

  editarEntidad(id: string, entidad: Partial<Entidad>): Observable<Entidad> {
    return this.http.put<DTOResponse<Entidad>>(`${this.urlBase}/editar/${id}`, entidad, { withCredentials: true })
       .pipe(
        map(response => {
           if (response && response.data) {
            return response.data;
          } else {
            throw new Error('No se pudo editar la entidad');
          }
        }),
        catchError(this.handleError)
      );
  }

  eliminarEntidad(id: string): Observable<void> {
    return this.http.delete<DTOResponse<void>>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true })
      .pipe(
        map(() => void 0),
        catchError(this.handleError)
      );
  }

  subirLogo(id: string, file: File): Observable<Entidad> {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.post<DTOResponse<Entidad>>(`${this.urlBase}/subir-logo/${id}`, formData, { withCredentials: true })
    .pipe(
      map(response => {
        if (response && response.data) {
          return response.data;
        } else {
          throw new Error('No se pudo subir el logo');
        }
      }),
      catchError(this.handleError)
    );
}
}
