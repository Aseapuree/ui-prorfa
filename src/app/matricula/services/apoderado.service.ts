import { Apoderado } from '../interfaces/DTOApoderado';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApoderadoService {

  private urlBase = "/api/v1/apoderados";

  constructor(private http: HttpClient) { }

  obtenerApoderados(): Observable<Apoderado[]> {
    return this.http.get<any>(`${this.urlBase}/listar`, { withCredentials: true })
      .pipe(map(response => {
        return response.data.content;
      }));
  }

   obtenerApoderado(id: string): Observable<Apoderado> {
   return this.http.get<any>(`${this.urlBase}/listar/${id}`, { withCredentials: true })
     .pipe(map(response => {
       return response.data;
     }),
   );
 }


  agregarApoderado(apoderado: Apoderado): Observable<Apoderado> {
    return this.http.post<any>(`${this.urlBase}/agregar`, apoderado, { withCredentials: true })
      .pipe(map(response => response.data));
  }

  editarApoderado(id: string, apoderado: Apoderado): Observable<Apoderado> {
    return this.http.put<Apoderado>(`${this.urlBase}/editar/${id}`, apoderado, { withCredentials: true });
  }

  eliminarApoderado(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true });
  }

  buscarPorNumeroDocumento(idtipodoc: string, numeroDocumento: string): Observable<Apoderado> {
    return this.http.get<any>(`${this.urlBase}/buscar/${idtipodoc}/${numeroDocumento}`, { withCredentials: true })
      .pipe(map(response => {
        return response.data;
      }));
  }
}
