import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Sesion } from '../interface/sesion';
import { catchError, map, Observable, throwError } from 'rxjs';
import { DTOActividad, DTOActividadesSesion } from '../interface/DTOActividad';
import { DTOResponse } from '../interface/DTOResponse';

@Injectable({
  providedIn: 'root'
})
export class SesionService {

  private urlBase = "/api/v1/sesiones";


  constructor(private clienteHttp: HttpClient) { }

  // En sesion.service.ts
obtenerSesionesPorCursoId(idCurso: string): Observable<Sesion[]> {
  console.log(`Obteniendo sesiones por curso ID: ${idCurso}`);
  return this.clienteHttp.get<{ status: number, message: string, data: Sesion[] }>(
    `${this.urlBase}/curso/${idCurso}`, { withCredentials: true }
  ).pipe(
    map(response => {
      console.log("Respuesta de la API:", response);
      return response.data;
    }),
    catchError(error => {
      console.error('Error al obtener sesiones por curso:', error);
      return throwError(() => new Error('Error al obtener sesiones'));
    })
  );
}



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
  return this.clienteHttp.post<DTOResponse<Sesion>>(`${this.urlBase}/agregar`, sesion, { withCredentials: true })
    .pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error al agregar sesión:', error);
        return throwError(() => new Error('Error al agregar sesión'));
      })
    );
}

editarSesion(sesion: Sesion): Observable<Sesion> {
  return this.clienteHttp
    .put<DTOResponse<Sesion>>(`${this.urlBase}/editar`, sesion, { withCredentials: true })
    .pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error al editar sesión:', error);
        return throwError(() => new Error('Error al editar la sesión'));
      })
    );
}

eliminarSesion(id: string): Observable<void> {
  return this.clienteHttp.delete<void>(`${this.urlBase}/eliminar/${id}`,{withCredentials:true});
}
  
obtenerActividadesPorSesion(idSesion: string): Observable<DTOActividadesSesion> {
  return this.clienteHttp.get<DTOActividadesSesion>(
    `${this.urlBase}/actividades/${idSesion}`, { withCredentials: true }
  ).pipe(
    map(response => response) 
  );
}

//actividades

agregarActividad(sesionId: string, formData: FormData): Observable<any> {
  return this.clienteHttp.post(`${this.urlBase}/actividades/agregar/${sesionId}`, formData, { withCredentials: true });
}

editarActividad(sesionId: string, actividadId: string, formData: FormData): Observable<any> {
  return this.clienteHttp.put(
    `${this.urlBase}/actividades/editar/${sesionId}/${actividadId}`,
    formData,
    { withCredentials: true }
  );
}

eliminarActividad(sesionId: string, actividadId: string): Observable<void> {
  return this.clienteHttp.delete<void>(
    `${this.urlBase}/actividades/eliminar/${sesionId}/${actividadId}`,
    { withCredentials: true }
  );
}
}

