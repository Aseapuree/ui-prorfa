import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DTOUsuario } from '../interfaces/DTOUsuario';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DTOUsuarioService {

  private urlBase = `${environment.apiUrl}/v1/usuario/verporid?id=`;

  constructor(private http: HttpClient) {}

  getUsuario(idusuario?: string): Observable<{ status: number; message: string; data: DTOUsuario }> {

    return this.http.get<{ status: number; message: string; data: DTOUsuario }>(`${this.urlBase}${idusuario}`,{withCredentials:true});
  }
}
