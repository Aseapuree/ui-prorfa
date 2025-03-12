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
