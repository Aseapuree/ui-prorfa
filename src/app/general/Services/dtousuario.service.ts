import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DTOUsuario } from '../Interface/DTOUsuario';

@Injectable({
  providedIn: 'root'
})
export class DTOUsuarioService {
  private url = 'http://localhost:8080/v1/usuario/verporid?id=';

  constructor(private http: HttpClient) {}

  getUsuario(idusuario?: string): Observable<{ status: number; message: string; data: DTOUsuario }> {

    return this.http.get<{ status: number; message: string; data: DTOUsuario }>(`${this.url}${idusuario}`);
  }
}
