import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Sesion } from '../interface/sesion';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SesionService {

  private urlBase = "http://localhost:8080/v1/sesiones";

  constructor(private clienteHttp: HttpClient) { }

  obtenerSesionList(): Observable<Sesion[]> {
    console.log('Realizando solicitud a:', `${this.urlBase}/listar`);
    return this.clienteHttp.get<{ success: boolean, message: string, data: { content: Sesion[] } }>(`${this.urlBase}/listar`)
      .pipe(
        map(response => {
          console.log('Respuesta recibida:', response);
          return response.data.content;
        })
      );
  }
}
