import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { DTOResponse } from '../interface/DTOResponse'; // Adjust path
import { AuditProrfa } from '../interface/audit';

@Injectable({
  providedIn: 'root'
})
export class AuditService {

  private urlBase = "http://localhost:8080/v1/audit";

  constructor(private clienteHttp: HttpClient) { }

  obtenerListaAuditorias(page: number, size: number, sortBy: string, sortDir: string): Observable<{ content: AuditProrfa[], totalElements: number }> {
    return this.clienteHttp
      .get<{ data: { content: AuditProrfa[], totalElements: number } }>(
        `${this.urlBase}/listar?page=${page - 1}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
        { withCredentials: true }
      )
      .pipe(
        map(response => ({
          content: response.data.content,
          totalElements: response.data.totalElements
        }))
      );
  }

  buscarAuditorias(
    bandeja?: string,
    accion?: string,
    userId?: string,
    fechaInicio?: string,
    fechaFin?: string,
    page: number = 0,
    size: number = 10,
    sortBy: string = 'fechaCreacion',
    sortDir: string = 'desc'
  ): Observable<{ content: AuditProrfa[], totalElements: number }> {
    let params = new URLSearchParams();
    if (bandeja) params.set('bandeja', bandeja);
    if (accion) params.set('accion', accion);
    if (userId) params.set('userId', userId);
    if (fechaInicio) params.set('fechaInicio', fechaInicio);
    if (fechaFin) params.set('fechaFin', fechaFin);
    params.set('page', page.toString());
    params.set('size', size.toString());
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);

    return this.clienteHttp
      .get<{ data: { content: AuditProrfa[], totalElements: number } }>(
        `${this.urlBase}/buscar?${params.toString()}`,
        { withCredentials: true }
      )
      .pipe(
        map(response => ({
          content: response.data.content,
          totalElements: response.data.totalElements
        }))
      );
  }

  obtenerConteoAuditorias(): Observable<number> {
    return this.clienteHttp.get<DTOResponse<number>>(`${this.urlBase}/contar`, { withCredentials: true })
      .pipe(map(response => response.data));
  }
}
