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


  obtenerComprobantes(): Observable<Comprobante[]> {
    return this.http.get<any>(`${this.urlBase}/listar`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Lista de comprobantes cargada correctamente.");
        return response.data.content;
      }));
  }


  obtenerComprobante(id: string): Observable<Comprobante> {
    return this.http.get<any>(`${this.urlBase}/listar/${id}`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Comprobante cargado correctamente.");
        return response.data;
      }));
  }

  agregarComprobante(comprobante: Comprobante): Observable<Comprobante> {
    return this.http.post<Comprobante>(`${this.urlBase}/agregar`, comprobante, { withCredentials: true });
  }

  editarComprobante(id: string, comprobante: Comprobante): Observable<Comprobante> {
    return this.http.put<Comprobante>(`${this.urlBase}/editar/${id}`, comprobante, { withCredentials: true });
  }

  eliminarComprobante(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true });
  }
}
