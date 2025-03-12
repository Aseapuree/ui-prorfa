import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Sesion } from '../interface/sesion';
import { map, Observable } from 'rxjs';
import { DTOActividadesSesion } from '../interface/DTOActividadesSesion';

@Injectable({
  providedIn: 'root'
})
export class SesionService {

  private urlBase = "http://localhost:8080/v1/sesiones";


  constructor(private clienteHttp: HttpClient) { }



  obtenerSesionList(): Observable<Sesion[]> {
    console.log('Realizando solicitud a:', `${this.urlBase}/listar`);
    return this.clienteHttp.get<{ success: boolean, message: string, data: { content: Sesion[] } }>(`${this.urlBase}/listar`,{withCredentials:true})
      .pipe(
        map(response => {
          console.log('Respuesta recibida:', response);
          return response.data.content;
        })
      );
  }

  obtenerSesionesPorCurso(idProfesorCurso: string): Observable<any[]> {
    console.log(`Obteniendo sesiones de ${idProfesorCurso}`);
    
    return this.clienteHttp.get<{ status: number, message: string, data: any[] }>(
      `${this.urlBase}/profesor-curso/${idProfesorCurso}` , {withCredentials:true}
    ).pipe(
      map(response => {
        console.log("Respuesta de la API:", response);
        return response.data; // Devolvemos solo las sesiones
      })
    );
}

agregarSesion(sesion: Sesion): Observable<Sesion> {
  return this.clienteHttp.post<Sesion>(`${this.urlBase}/agregar`, sesion,{withCredentials:true});
}

editarSesion(id: string, sesion: Sesion): Observable<Sesion> {
  return this.clienteHttp.put<Sesion>(`${this.urlBase}/editar/${id}`, sesion,{withCredentials:true});
}

eliminarSesion(id: string): Observable<void> {
  return this.clienteHttp.delete<void>(`${this.urlBase}/eliminar/${id}`,{withCredentials:true});
}
  
obtenerActividadesPorSesion(idSesion: string): Observable<DTOActividadesSesion> {
  return this.clienteHttp.get<DTOActividadesSesion>(
    `${this.urlBase}/actividades/${idSesion}`,{withCredentials:true}
  );
}

agregarIntroduccion(formData: FormData): Observable<any> {
  return this.clienteHttp.post(`${this.urlBase}/introduccion/agregar`, formData,{withCredentials:true});
}

agregarMaterial(formData: FormData): Observable<any> {
  return this.clienteHttp.post(`${this.urlBase}/material/agregar`, formData,{withCredentials:true});
}

agregarActividad(formData: FormData): Observable<any> {
  return this.clienteHttp.post(`${this.urlBase}/actividad/agregar`, formData,{withCredentials:true});
}
}
