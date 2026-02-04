import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DTOUsuario } from '../interfaces/DTOUsuario';
import { environment } from '../../../environments/environment';
import { map, catchError } from 'rxjs/operators';  // ← FIX: Importa operadores
import { throwError } from 'rxjs';  // ← FIX: Importa throwError


// REFACTORIZAR !!!!
@Injectable({
  providedIn: 'root'
})
export class DTOUsuarioService {

  private urlBase = `${environment.apiUrl}/v1/usuario/verporid?id=`;

  constructor(private http: HttpClient) {}

  getUsuario(idusuario?: string): Observable<{ code: number; message: string; data: DTOUsuario }> {

    return this.http.get<{ code: number; message: string; data: DTOUsuario }>(`${this.urlBase}${idusuario}`,{withCredentials:true});
  }

  // El nuevo método queda intacto (ahora compila)
  obtenerPerfil(usuarioId: string): Observable<DTOUsuario> {
    return this.getUsuario(usuarioId).pipe(
      map(response => {
        // Validamos respuesta
        if (response && response.code === 200 && response.data) {
          console.log('Perfil cargado exitosamente:', response.data);
          return response.data;  // Retornamos solo el DTOUsuario
        }
        // Si falla, lanzamos error
        throw new Error(`Error al obtener perfil: ${response?.message || 'Respuesta inválida'}`);
      }),
      catchError(error => {
        console.error('Error en obtenerPerfil:', error);
        return throwError(() => new Error('No se pudo cargar el perfil del usuario'));
      })
    );
  }
}
