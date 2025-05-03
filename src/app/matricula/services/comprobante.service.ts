import { Apoderado } from './../interfaces/DTOApoderado';
import { Alumno } from './../interfaces/DTOAlumno';
import { Matricula } from './../interfaces/DTOMatricula';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, retry, tap, switchMap } from 'rxjs/operators';
import { Comprobante } from '../interfaces/DTOComprobante';

@Injectable({
  providedIn: 'root'
})
export class ComprobanteService {

  private urlBase = "http://localhost:8080/v1/comprobantes";

  constructor(private http: HttpClient) { }


  obtenerComprobantes(): Observable<Comprobante[]> {
    return this.http.get<any>(this.urlBase + "/listar").pipe(
        map(response => response.data.content),
    );
  }

  obtenerComprobante(id: string): Observable<Comprobante> {
    return this.http.get<any>(`${this.urlBase}/listar/${id}`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
    );
  }

  agregarComprobante(comprobante: Comprobante): Observable<Comprobante> {
    return this.http.post<any>(`${this.urlBase}/agregar`, comprobante, { withCredentials: true })
     .pipe(map(response => {
        return response.data;
      }),
    );
  }

  editarComprobante(id: string, comprobante: Comprobante): Observable<Comprobante> {
    return this.http.put<any>(`${this.urlBase}/editar/${id}`, comprobante, { withCredentials: true })
     .pipe(map(response => {
        return response.data;
      }),
    );
  }

  eliminarComprobante(id: string): Observable<void> {
    return this.http.delete<any>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true })
      .pipe(map(response => {
      }),
    );
  }

  calcularCosto(nivel: string, grado: number): Observable<number> {
    return this.http.get<any>(`${this.urlBase}/calcular-costo-matricula?nivel=${nivel}&grado=${grado}`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
    );
  }

  generarCodigoMatricula(): Observable<string> {
    return this.http.get<any>(`${this.urlBase}/generar-codigo-matricula`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
    );
  }

  generarCodigoPago(): Observable<string> {
    console.log(`ComprobanteService: Calling backend endpoint: ${this.urlBase}/generar-codigo-pago`);
    return this.http.get<any>(`${this.urlBase}/generar-codigo-pago`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
    );
  }

  generarCodigoAlumno(): Observable<string> {
    return this.http.get<any>(`${this.urlBase}/generar-codigo-alumno`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
    );
  }


  generarYGuardarComprobanteBackend(idMatricula: string, tipoComprobante: string, montoTotal?: number): Observable<Comprobante> {
    let params = new HttpParams()
      .set('idMatricula', idMatricula)
      .set('tipoComprobante', tipoComprobante);

    if (montoTotal !== undefined && montoTotal !== null) {
      params = params.set('montoTotal', montoTotal.toString());
    }

    return this.http.post<any>(`${this.urlBase}/generar-y-guardar`, null, { params: params, withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }),
    );
  }


  obtenerComprobantePorIdMatricula(idMatricula: string): Observable<Comprobante | null> {
    console.log(`ComprobanteService: Calling backend endpoint: ${this.urlBase}/by-matricula/${idMatricula}`);
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
            throw new Error(response?.message);
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

  generarPdfDirecto(idMatricula: string, tipoComprobante: string, montoTotal?: number): Observable<Blob> {
      console.log(`ComprobanteService: Calling backend endpoint: ${this.urlBase}/generar-pdf-directo for type ${tipoComprobante}`);
      let params = new HttpParams()
          .set('idMatricula', idMatricula)
          .set('tipoComprobante', tipoComprobante);

      if (montoTotal !== undefined && montoTotal !== null) {
          params = params.set('montoTotal', montoTotal.toString());
      }

      return this.http.get(`${this.urlBase}/generar-pdf-directo`, {
          params: params,
          responseType: 'blob',
          withCredentials: true
      }).pipe(
      );
  }


  public handleError = (error: HttpErrorResponse | any): Observable<never> => {
    let errorMessage = 'Error desconocido al comunicar con el backend.';

    if (error instanceof HttpErrorResponse) {

        if (error.status === 0) {
            errorMessage = 'Error de conexión con el backend. Asegúrate de que el servidor esté corriendo y accesible.';
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
        console.error('ComprobanteService: Error del lado del cliente o de red:', error.message);
        errorMessage = `Error en la aplicación: ${error.message}`;
         if (error.message.includes('ErrorEvent is not defined')) {
             errorMessage = 'Error interno del navegador al procesar la respuesta.';
         }

    } else {
        console.error('ComprobanteService: Otro tipo de error:', error);
        errorMessage = `Ocurrió un error inesperado: ${JSON.stringify(error)}`;
    }

    console.error('ComprobanteService: Error completo:', error);
    return throwError(() => new Error(errorMessage));
  }
}
