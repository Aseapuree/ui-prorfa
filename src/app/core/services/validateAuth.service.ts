import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment'
// Interfaz para los datos del usuario (nivel interno)
export interface UserInfo {
  id: string;
  rol?: string;
  username?: string;
  fechaCreacion?: string;
  nombre?: string; // Agregar nombre
  apellidoPaterno?: string; // Agregar apellidoPaterno
  apellidoMaterno?: string; // Agregar apellidoMaterno
}

// Interfaz para la respuesta completa
export interface UserData {
  code: number;
  message: string;
  data: UserInfo;
}
@Injectable({
  providedIn: 'root' // Hace que el servicio esté disponible en toda la app
})
export class ValidateService {
  
  private API_URL = `${environment.apiOauth}`;

  constructor(private http: HttpClient) {}

  verificarSesion(): Observable<boolean> {
    return this.http.get<{ code: number }>(`${this.API_URL}/identities/me`, { withCredentials: true }).pipe(
      map(response => {
        return response.code === 200;
      }),
      catchError(() => of(false))
    );
  }
  
  // Nuevo método para obtener los datos del usuario
  getUserData(): Observable<UserData> {
    return this.http.get<UserData>(`${this.API_URL}/identities/me`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('Error al obtener los datos del usuario:', error);
        return of({ code: 500, message: 'Error', data: { id: '' } } as UserData);
      })
    );
  }
  
}
