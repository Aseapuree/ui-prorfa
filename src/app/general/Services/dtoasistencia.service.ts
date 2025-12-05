import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DTOAsistencia, AsistenciaResponse } from '../interfaces/DTOAsistencia';
import { DTOResponse } from '../interfaces/DTOResponse';

@Injectable({
  providedIn: 'root'
})
export class DTOAsistenciaService {
  private readonly baseUrl = '/api/v1/asistencias';

  constructor(private http: HttpClient) {}

  // Registrar asistencia
  registrarAsistencia(asistencia: DTOAsistencia): Observable<DTOResponse<string[]>> {
    const payload = {
      idSesion: asistencia.idSesion,
      grado: asistencia.grado,
      seccion: asistencia.seccion,
      nivel: asistencia.nivel,
      idCurso: asistencia.idCurso,
      fecha: asistencia.fechaAsistencia.replace(' ', 'T'),
      listaAlumnos: asistencia.listaAlumnos
    };

    console.log('Payload enviado al backend (registrar):', payload);

    return this.http.post<DTOResponse<string[]>>(`${this.baseUrl}/registrar`, payload, { withCredentials: true });
  }

  // Editar asistencia
  editarAsistencia(asistencia: DTOAsistencia): Observable<DTOResponse<string[]>> {
    const payload = {
      idSesion: asistencia.idSesion,
      grado: asistencia.grado,
      seccion: asistencia.seccion,
      nivel: asistencia.nivel,
      idCurso: asistencia.idCurso,
      fecha: asistencia.fechaAsistencia.replace(' ', 'T'),
      listaAlumnos: asistencia.listaAlumnos
    };

    console.log('Payload enviado al backend (editar):', payload);

    return this.http.put<DTOResponse<string[]>>(`${this.baseUrl}/editar`, payload, { withCredentials: true });
  }

  // Listar asistencias por idSesion
  listarAsistenciasPorSesion(idSesion: string): Observable<DTOResponse<AsistenciaResponse[]>> {
    return this.http.get<DTOResponse<AsistenciaResponse[]>>(`${this.baseUrl}/listar/${idSesion}`, { withCredentials: true });
  }
}