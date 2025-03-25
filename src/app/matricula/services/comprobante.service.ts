import { Comprobante } from './../interfaces/DTOComprobante';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComprobanteService {

  private urlBase = "http://localhost:8080/v1/comprobantes";

  constructor(private http: HttpClient) { }

  //Obtener lista de comprobantes
  obtenerComprobantes(): Observable<Comprobante[]> {
    return this.http.get<any>(`${this.urlBase}/listar`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Lista de comprobantes cargada correctamente.");
        return response.data.content;
      }));
  }
  //Listar una matricula
  obtenerComprobante(id: string): Observable<Comprobante> {
    return this.http.get<any>(`${this.urlBase}/listar/${id}`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Comprobante cargado correctamente.");
        return response.data;
      }));
  }
  //Agregar una matricula
  agregarComprobante(comprobante: Comprobante): Observable<Comprobante> {
    return this.http.post<Comprobante>(`${this.urlBase}/agregar`, comprobante, { withCredentials: true });
  }
  //Editar una matricula
  editarComprobante(id: string, comprobante: Comprobante): Observable<Comprobante> {
    return this.http.put<Comprobante>(`${this.urlBase}/editar/${id}`, comprobante, { withCredentials: true });
  }
  //Eliminar una matricula
  eliminarComprobante(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true });
  }

  // Calcular el costo de matrícula
  calcularCosto(nivel: string, grado: number): Observable<number> {
    return this.http.get<any>(`${this.urlBase}/calcularCosto?nivel=${nivel}&grado=${grado}`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Costo de matrícula calculado correctamente.");
        return response.data;
      }));
  }

  // Generar código de matrícula
  generarCodigoMatricula(): Observable<string> {
    return this.http.get<any>(`${this.urlBase}/generarCodigoMatricula`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Código de matrícula generado correctamente.");
        return response.data;
      }));
  }

  // Generar código de alumno
  generarCodigoAlumno(): Observable<string> {
    return this.http.get<any>(`${this.urlBase}/generarCodigoAlumno`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Código de alumno generado correctamente.");
        return response.data;
      }));
  }
}
