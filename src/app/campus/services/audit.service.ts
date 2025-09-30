import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AuditProrfa } from '../interface/audit';
import { DTOResponse } from '../interface/DTOResponse';
import saveAs from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class AuditService {

  private urlBase = "http://localhost:8080/v1/audit";

  constructor(private clienteHttp: HttpClient) { }

  descargarExcel(filters?: {
    userName?: string;
    rolName?: string;
    ipAddress?: string;
    bandeja?: string;
    accion?: string;
    userAgent?: string;
    fechaInicio?: string;
    fechaFin?: string;
    fechaTipo?: string;
    palabraClave?: string;
  }): Observable<void> {
    return this.clienteHttp
      .post(`${this.urlBase}/exportar-excel`, filters || {}, { responseType: 'blob', withCredentials: true })
      .pipe(
        map((response: Blob) => {
          saveAs(response, 'auditorias.xlsx');
          return undefined;
        }),
        catchError(error => {
          console.error('Error al descargar el archivo Excel:', error);
          return throwError(() => new Error('Error al descargar el archivo Excel'));
        })
      );
  }

  obtenerListaAuditorias(page: number, size: number, sortBy: string, sortDir: string): Observable<{ content: AuditProrfa[], totalElements: number }> {
    return this.clienteHttp
      .get<DTOResponse<{ content: AuditProrfa[], totalElements: number }>>(
        `${this.urlBase}/listar?page=${page - 1}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
        { withCredentials: true }
      )
      .pipe(
        map(response => ({
          content: response.data.content,
          totalElements: response.data.totalElements
        })),
        catchError(error => {
          console.error('Error al obtener auditorías:', error);
          return throwError(() => new Error('Error al cargar las auditorías'));
        })
      );
  }

  buscarAuditorias(filters: {
    palabraClave?: string,
    userName?: string,
    rolName?: string,
    ipAddress?: string,
    bandeja?: string,
    userAgent?: string,
    fechaInicio?: string,
    fechaFin?: string,
    fechaTipo?: string
  }, page: number, size: number, sortBy: string, sortDir: string): Observable<{ content: AuditProrfa[], totalElements: number }> {
    let params = new HttpParams();
    params = params.set('page', (page - 1).toString());
    params = params.set('size', size.toString());
    params = params.set('sortBy', sortBy);
    params = params.set('sortDir', sortDir);
    if (filters.palabraClave) params = params.set('palabraClave', filters.palabraClave);
    if (filters.userName) params = params.set('userName', filters.userName);
    if (filters.rolName) params = params.set('rolName', filters.rolName);
    if (filters.ipAddress) params = params.set('ipAddress', filters.ipAddress);
    if (filters.bandeja) params = params.set('bandeja', filters.bandeja);
    if (filters.userAgent) params = params.set('userAgent', filters.userAgent);
    if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);
    if (filters.fechaTipo) params = params.set('fechaTipo', filters.fechaTipo);

    return this.clienteHttp
      .get<any>(`${this.urlBase}/buscar`, { params, withCredentials: true })
      .pipe(
        map(response => {
          let content: AuditProrfa[] = [];
          let totalElements: number = 0;
          if (response.data && response.data.content) {
            content = response.data.content || [];
            totalElements = response.data.totalElements || 0;
          }
          return { content, totalElements };
        }),
        catchError(error => {
          console.error('Error al buscar auditorías:', error);
          return throwError(() => new Error('Error al buscar auditorías'));
        })
      );
  }

  obtenerConteoAuditorias(): Observable<number> {
    return this.clienteHttp
      .get<{ data: number }>(`${this.urlBase}/contar`, { withCredentials: true })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error al contar auditorías:', error);
          return throwError(() => new Error('Error al contar auditorías'));
        })
      );
  }
}
