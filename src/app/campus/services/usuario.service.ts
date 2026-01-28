import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from '../interface/usuario';
import { catchError, map, Observable, pipe, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private urlBase = `${environment.apiUrl}/v1/usuario`;

  constructor(private clienteHttp: HttpClient) { }

  getUsuarioByIdAuth(idAuth: string): Observable<string> {
    return this.clienteHttp.get<any>(`${this.urlBase}/by-id-auth/${idAuth}`, { withCredentials: true })
      .pipe(
        map(response => response.data.idusuario) // Extrae el idusuario
      );
  }

  // Obtener lista de usuarios
  obtenerListaUsuario(): Observable<Usuario[]> {
    return this.clienteHttp.get<Usuario[]>(`${this.urlBase}/listar`,{withCredentials:true})
      .pipe(
        map(response => {
          console.log("Lista de usuarios cargada correctamente:", response);
          return response;  // Devuelve el array de usuarios directamente
        })
      );
  }

  buscarUsuariosPorNombre(nombre: string): Observable<Usuario[]> {
  return this.clienteHttp.get<Usuario[]>(`${this.urlBase}/buscar?nombre=${encodeURIComponent(nombre)}`, { withCredentials: true })
    .pipe(
      catchError(error => {
        console.error('Error al buscar usuarios por nombre:', error);
        return throwError(() => new Error('Error al buscar usuarios'));
      })
    );
}
}
