import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from '../interface/usuario'; 
import { map, Observable, pipe } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private urlBase = "http://localhost:8080/v1/usuario";

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
}
