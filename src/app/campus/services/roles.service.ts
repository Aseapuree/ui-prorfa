import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Role } from '../interface/role';  // Ajusta path según estructura

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  private urlRoles = "/api/v1/roles";

  constructor(private http: HttpClient) { }

  getRoles(): Observable<Role[]> {
    return this.http
      .get<Role[]>(`${this.urlRoles}/listar`, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error al obtener roles:', error);
          return throwError(() => new Error('Error al cargar roles'));
        })
      );
  }
}
