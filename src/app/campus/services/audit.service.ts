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

  private urlBase = "/api/v1/audit";

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
  // Generar fecha actual como fallback (yyMMdd)
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const dateStr = year + month + day;
  let filename = `bandeja_auditoria_${dateStr}.xlsx`;

  return this.clienteHttp
    .post(`${this.urlBase}/exportar-excel`, filters || {}, { 
      responseType: 'blob', 
      withCredentials: true,
      observe: 'response'
    })
    .pipe(
      map((response: any) => {
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch != null && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        // Si el parsing del header falla, usa el fallback con fecha
        saveAs(response.body, filename);
        return undefined;
      }),
      catchError(error => {
        console.error('Error al descargar el archivo Excel:', error);
        return throwError(() => new Error('Error al descargar el archivo Excel'));
      })
    );
}

  obtenerListaAuditorias(page: number, size: number): Observable<{ content: AuditProrfa[], totalElements: number }> {
    return this.clienteHttp
      .get<DTOResponse<{ content: AuditProrfa[], totalElements: number }>>(
        `${this.urlBase}/listar?page=${page - 1}&size=${size}`,
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
  fechaInicio?: string,
  fechaFin?: string,
  fechaTipo?: string,
  userId?: string
}, page: number, size: number): Observable<{ content: AuditProrfa[], totalElements: number }> {
  let params = new HttpParams();
  params = params.set('page', (page - 1).toString());
  params = params.set('size', size.toString());
  if (filters.palabraClave) params = params.set('palabraClave', filters.palabraClave);
  if (filters.userName) params = params.set('userName', filters.userName);
  if (filters.rolName) params = params.set('rolName', filters.rolName);
  if (filters.ipAddress) params = params.set('ipAddress', filters.ipAddress);
  if (filters.bandeja) params = params.set('bandeja', filters.bandeja);
  if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
  if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);
  if (filters.fechaTipo) params = params.set('fechaTipo', filters.fechaTipo);
  if (filters.userId) params = params.set('userId', filters.userId);

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
