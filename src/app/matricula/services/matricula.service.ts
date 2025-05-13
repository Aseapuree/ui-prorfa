import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Matricula } from '../interfaces/DTOMatricula';

@Injectable({
  providedIn: 'root'
})
export class MatriculaService {
  private urlBase = "http://localhost:8080/v1/matriculas";

  constructor(private http: HttpClient) { }


  obtenerMatriculas(): Observable<Matricula[]> {
    return this.http.get<any>(`${this.urlBase}/listar`, { withCredentials: true })
      .pipe(map(response => {
        return response.data.content;
      }),
      catchError(this.handleError)
    );
  }


  obtenerMatricula(id: string): Observable<Matricula | null> {
    console.log(`MatriculaService: Calling backend endpoint: ${this.urlBase}/listar/${id}`);
    return this.http.get<any>(`${this.urlBase}/listar/${id}`, { withCredentials: true })
      .pipe(map(response => {
        if (response && response.code === 200 && response.data) {
            return response.data;
        } else if (response && response.code === 404) {
            return null;
        } else {
            throw new Error(response?.message );
        }
      }),
      catchError(error => {
          console.error(`MatriculaService: Error al obtener matrícula por ID ${id}:`, error);
          if (error instanceof HttpErrorResponse && error.status === 404) {
          }
          return throwError(() => error);
      })
    );
  }

  agregarMatricula(matricula: Matricula): Observable<Matricula> {
    return this.http.post<any>(`${this.urlBase}/agregar`, matricula, { withCredentials: true }).pipe(
        map(response => {
            if (response && response.code >= 200 && response.code < 300 && response.data) {
                return response.data;
            } else {
                throw new Error(response?.message || 'Error al agregar matrícula');
            }
        }),
        catchError(this.handleError)
    );
  }

  editarMatricula(id: string, matricula: Matricula): Observable<Matricula> {
    return this.http.put<Matricula>(`${this.urlBase}/editar/${id}`, matricula, { withCredentials: true }).pipe(
        catchError(this.handleError)
    );
  }

  eliminarMatricula(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true }).pipe(
        catchError(this.handleError)
    );
  }

  asignarSeccion(grado: number): Observable<string> {
    return this.http.get(`${this.urlBase}/asignarSeccion/${grado}`, {
      withCredentials: true,
      responseType: 'text'
    }).pipe(
        catchError(this.handleError)
    );
  }

  vacantesPorNivel(nivel: string): Observable<{ [grado: number]: { [seccion: string]: number } }> {
    return this.http.get<{ [grado: number]: { [seccion: string]: number } }>(`${this.urlBase}/vacantes/${nivel}`, { withCredentials: true }).pipe(
        catchError(this.handleError)
    );
  }

  public handleError = (error: HttpErrorResponse | any): Observable<never> => {
    let errorMessage = 'Error desconocido al comunicar con el backend.';

    if (error instanceof HttpErrorResponse) {
        console.error(
            `MatriculaService: Error del lado del servidor: Código ${error.status}, ` +
            `Body: ${JSON.stringify(error.error)}`);

        if (error.status === 0) {
            errorMessage = 'Error de conexión con el backend. Asegúrate de que el servidor esté corriendo y accesible.';
            if (error.error && (error.error as any).message && (error.error as any).message.includes('ECONNREFUSED')) {
                 errorMessage = 'Error de conexión: El backend rechazo la conexión. Verifica que esté corriendo en http://localhost:8080.';
            }
        } else {
            if (error.error instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                };
                reader.readAsText(error.error);
                errorMessage = `Error del servidor (${error.status}): El servidor devolvió un archivo binario en la respuesta de error.`;
            } else {
                if (error.error && error.error.message) {
                    errorMessage = `Error del servidor (${error.status}): ${error.error.message}`;
                } else {
                    errorMessage = `Error del servidor (${error.status}): ${error.statusText || 'Mensaje desconocido'}`;
                }
            }
        }
    } else if (error instanceof Error) {
        console.error('MatriculaService: Error del lado del cliente o de red:', error.message);
        errorMessage = `Error en la aplicación: ${error.message}`;
         if (error.message.includes('ErrorEvent is not defined')) {
             errorMessage = 'Error interno del navegador al procesar la respuesta.';
         }
    } else {
        console.error('MatriculaService: Otro tipo de error:', error);
        errorMessage = `Ocurrió un error inesperado: ${JSON.stringify(error)}`;
    }

    console.error('MatriculaService: Error completo:', error);
    return throwError(() => new Error(errorMessage));
  }
}
