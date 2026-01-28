import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Matricula } from '../interfaces/DTOMatricula';
import saveAs from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class MatriculaService {
  private urlBase = "v1/matriculas";
totalPages: number = 0;
totalElements: number = 0;

  constructor(private http: HttpClient) { }

  descargarExcel(filters: any = {}): Observable<void> {
  return this.http.post(`${this.urlBase}/exportar-excel`, filters, { responseType: 'blob', withCredentials: true })
    .pipe(
      map((blob: Blob) => {
        saveAs(blob, 'matriculas.xlsx');
      }),
      catchError(this.handleError)
    );
}

  obtenerMatriculas(filters: any = {}, page: number = 0, size: number = 20): Observable<Matricula[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (filters.codigomatricula) params = params.set('codigomatricula', filters.codigomatricula);
    if (filters.codigopago) params = params.set('codigopago', filters.codigopago);
    if (filters.nivel) params = params.set('nivel', filters.nivel);
    if (filters.grado) params = params.set('grado', filters.grado.toString());
    if (filters.seccion) params = params.set('seccion', filters.seccion);
    if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);

    return this.http.get<any>(`${this.urlBase}/buscar`, { params, withCredentials: true })
      .pipe(
        map(response => {
          this.totalElements = response.data.totalElements;
          this.totalPages = response.data.totalPages;
          return response.data.content;
        }),
        catchError(this.handleError)
      );
  }

  obtenerMatricula(id: string): Observable<Matricula | null> {
    return this.http.get<any>(`${this.urlBase}/listar/${id}`, { withCredentials: true })
      .pipe(map(response => {
        if (response && response.code === 200 && response.data) {
          return response.data;
        } else if (response && response.code === 404) {
          return null;
        } else {
          throw new Error(response?.message || 'Error al obtener la matrícula');
        }
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of(null);
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
    return this.http.put<any>(`${this.urlBase}/editar/${id}`, matricula, { withCredentials: true }).pipe(
      map(response => {
        if (response && response.code >= 200 && response.code < 300 && response.data) {
          return response.data;
        } else {
          throw new Error(response?.message || 'Error al editar matrícula');
        }
      }),
      catchError(this.handleError)
    );
  }

  eliminarMatricula(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true }).pipe(
      catchError(this.handleError)
    );
  }

  asignarSeccion(nivel: string, grado: number): Observable<string> {
    return this.http.get<any>(`${this.urlBase}/asignarSeccion?nivel=${nivel}&grado=${grado}`, { withCredentials: true }).pipe(
      map(response => {
        if (response && response.code === 200 && response.data) {
          return response.data;
        } else {
          throw new Error(response?.message || 'Error al asignar sección');
        }
      }),
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
                 errorMessage = 'Error de conexión: El backend rechazo la conexión. Verifica que esté corriendo en /api.';
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
      errorMessage = `Error en la aplicación: ${error.message}`;
      if (error.message.includes('ErrorEvent is not defined')) {
        errorMessage = 'Error interno del navegador al procesar la respuesta.';
      }
    } else {
      errorMessage = `Ocurrió un error inesperado: ${JSON.stringify(error)}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
