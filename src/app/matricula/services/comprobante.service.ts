import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, retry, tap, switchMap } from 'rxjs/operators';
import { Comprobante } from '../interfaces/DTOComprobante';
import { environment } from '../../../environments/environment';

const TIPO_COMPROBANTE_MATRICULA_UUID = 'df61cd5c-5609-45d7-a2ad-1d285cabc958';
const TIPO_COMPROBANTE_PAGO_UUID = 'b5dc4013-5d65-4969-8342-906ae82ee70c';


@Injectable({
  providedIn: 'root'
})
export class ComprobanteService {

  private urlBase = `${environment.apiUrl}/v1/comprobantes`;

  constructor(private http: HttpClient) { }


  obtenerComprobantes(): Observable<Comprobante[]> {
    return this.http.get<any>(this.urlBase + "/listar").pipe(
        map(response => response.data.content),
        catchError(this.handleError)
    );
  }

  obtenerComprobante(id: string): Observable<Comprobante> {
    return this.http.get<any>(`${this.urlBase}/listar/${id}`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  agregarComprobante(comprobante: Comprobante): Observable<Comprobante> {
    return this.http.post<any>(`${this.urlBase}/agregar`, comprobante, { withCredentials: true })
     .pipe(map(response => {
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  editarComprobante(id: string, comprobante: Comprobante): Observable<Comprobante> {
    return this.http.put<any>(`${this.urlBase}/editar/${id}`, comprobante, { withCredentials: true })
     .pipe(map(response => {
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  eliminarComprobante(id: string): Observable<void> {
    return this.http.delete<any>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true })
      .pipe(map(response => {
      }),
      catchError(this.handleError)
    );
  }

  calcularCosto(nivel: string, grado: number): Observable<number> {
    return this.http.get<any>(`${this.urlBase}/calcular-costo-matricula?nivel=${nivel}&grado=${grado}`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  generarCodigoMatricula(): Observable<string> {
    return this.http.get<any>(`${this.urlBase}/generar-codigo-matricula`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  generarCodigoPago(): Observable<string> {
    return this.http.get<any>(`${this.urlBase}/generar-codigo-pago`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  generarCodigoAlumno(): Observable<string> {
    return this.http.get<any>(`${this.urlBase}/generar-codigo-alumno`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
      catchError(this.handleError)
    );
  }


  generarYGuardarComprobanteBackend(idMatricula: string, tipoComprobante: string, montoTotal?: number): Observable<Comprobante> {
    const tipoComprobanteUuid = this.getTipoComprobanteUuid(tipoComprobante);

    if (!tipoComprobanteUuid) {
        return throwError(() => new Error(`Tipo de comprobante desconocido para generar y guardar: ${tipoComprobante}`));
    }

    let params = new HttpParams()
      .set('idMatricula', idMatricula)
      .set('tipoComprobante', tipoComprobanteUuid);

    if (montoTotal !== undefined && montoTotal !== null) {
      params = params.set('montoTotal', montoTotal.toString());
    }

    return this.http.post<any>(`${this.urlBase}/generar-y-guardar`, null, { params: params, withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
      catchError(this.handleError)
    );
  }


  obtenerComprobantePorIdMatricula(idMatricula: string): Observable<Comprobante | null> {
    return this.http.get<any>(`${this.urlBase}/by-matricula/${idMatricula}`, { withCredentials: true })
      .pipe(
        retry(3),
        map(response => {
          if (response && response.code === 200 && response.data) {
            return response.data;
          } else if (response && response.code === 404) {
             return null;
          }
          else {
            throw new Error(response?.message || 'Error desconocido al obtener comprobante por matrícula.');
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

  private getTipoComprobanteUuid(tipoComprobante: string): string | null {
      switch (tipoComprobante.toLowerCase()) {
          case 'pago':
              return TIPO_COMPROBANTE_PAGO_UUID;
          case 'matricula':
              return TIPO_COMPROBANTE_MATRICULA_UUID;
          default:
              return null;
      }
  }

  generarPdfDirecto(idMatricula: string, tipoComprobanteUuid: string, montoTotal?: number): Observable<Blob> {
      let params = new HttpParams()
          .set('idMatricula', idMatricula)
          .set('tipoComprobante', tipoComprobanteUuid);

      if (montoTotal !== undefined && montoTotal !== null) {
          params = params.set('montoTotal', montoTotal.toString());
      }

      return this.http.get(`${this.urlBase}/generar-pdf-directo`, {
          params: params,
          responseType: 'blob',
          withCredentials: true
      }).pipe(
           catchError(this.handleError)
      );
  }


  public handleError = (error: HttpErrorResponse | any): Observable<never> => {
    let errorMessage = 'Error desconocido al comunicar con el backend.';
    let backendMessage = '';

    if (error instanceof HttpErrorResponse) {
        if (error.error instanceof Blob) {
            return new Observable<never>(observer => {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorBody = JSON.parse(reader.result as string);
                        if (errorBody && errorBody.message) {
                            backendMessage = errorBody.message;
                            errorMessage = `Error del servidor (${error.status}): ${backendMessage}`;
                        } else {
                            errorMessage = `Error del servidor (${error.status}): El servidor devolvió un archivo binario inesperado en la respuesta de error.`;
                        }
                    } catch (e) {
                        errorMessage = `Error del servidor (${error.status}): ${error.statusText || 'Mensaje desconocido'}. El servidor no devolvió un mensaje de error estándar.`;
                    }
                    observer.error(new Error(errorMessage));
                };
                reader.onerror = () => {
                    errorMessage = `Error del servidor (${error.status}): Falló la lectura del mensaje de error del backend.`;
                    observer.error(new Error(errorMessage));
                };
                reader.readAsText(error.error);
            });

        } else if (error.error && typeof error.error === 'object' && error.error.message) {
            backendMessage = error.error.message;
            errorMessage = `Error del servidor (${error.status}): ${backendMessage}`;
        } else if (error.statusText) {
             errorMessage = `Error del servidor (${error.status}): ${error.statusText}`;
        } else {
            errorMessage = `Error del servidor (${error.status}): Mensaje desconocido del servidor.`;
        }

        if (error.status === 0) {
            errorMessage = 'Error de conexión con el backend. Asegúrate de que el servidor esté corriendo y accesible.';
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
