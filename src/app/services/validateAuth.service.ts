import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root' // Hace que el servicio esté disponible en toda la app
})
export class ValidateService {
  
  private API_URL = "http://localhost:8081";

  constructor(private http: HttpClient) {}

  verificarSesion(): Observable<boolean> {
    return this.http.get<{ code: number }>(`${this.API_URL}/identities/me`, { withCredentials: true }).pipe(
      map(response => {
        return response.code === 200;
      }),
      catchError(() => of(false))
    );
  }
  
  
  
}
