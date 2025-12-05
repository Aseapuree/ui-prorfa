import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DTOResponse } from '../interfaces/DTOResponse';

interface Alumno {
  idalumno: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  idtipodoc?: string;
  numeroDocumento?: number;
  fechaNacimiento?: string;
  direccion?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MatriculaService { // Renombramos a MatriculaService
  private readonly url = '/api/v1/matriculas/alumnos';

  constructor(private http: HttpClient) {}

  getAlumnosPorGradoSeccionYNivel(grado: string, seccion: string, nivel: string): Observable<DTOResponse<Alumno[]>> {
    return this.http.get<DTOResponse<Alumno[]>>(`${this.url}/${grado}/${seccion}/${nivel}`, { withCredentials: true });
  }
}