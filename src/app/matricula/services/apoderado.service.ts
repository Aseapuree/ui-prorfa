import { Apoderado } from './../interfaces/DTOApoderado';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApoderadoService {

  private urlBase = "http://localhost:8080/v1/apoderados";

  constructor(private http: HttpClient) { }

  // Obtener lista de apoderados
  obtenerApoderados(): Observable<Apoderado[]> {
    return this.http.get<any>(`${this.urlBase}/listar`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Lista de apoderados cargada correctamente.");
        return response.data.content;
      }));
  }

  // Agregar un nuevo apoderado
  agregarApoderado(apoderado: Apoderado): Observable<Apoderado> {
    return this.http.post<Apoderado>(`${this.urlBase}/agregar`, apoderado, { withCredentials: true });
  }

  // Editar un apoderado existente
  editarApoderado(id: string, apoderado: Apoderado): Observable<Apoderado> {
    return this.http.put<Apoderado>(`${this.urlBase}/editar/${id}`, apoderado, { withCredentials: true });
  }

  // Eliminar un apoderado
  eliminarApoderado(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true });
  }

  // Buscar un apoderado por tipo y número de documento
  buscarPorNumeroDocumento(idtipodoc: string, numeroDocumento: string): Observable<Apoderado> {
    return this.http.get<any>(`${this.urlBase}/buscar/${idtipodoc}/${numeroDocumento}`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Apoderado buscado correctamente.");
        return response.data;
      }));
  }
}
