import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ProfesorCurso } from '../interface/profesor-curso';

@Injectable({
  providedIn: 'root'
})
export class ProfesorCursoService {

  private urlBase = "http://localhost:8080/v1/profesorcursos";

  constructor(private clienteHttp: HttpClient) { }

   // Obtener lista de cursos para usarlo en mi campus
    obtenerCourseList(): Observable<ProfesorCurso[]> {
      return this.clienteHttp.get<{ content: ProfesorCurso[] }>(`${this.urlBase}/listar`)
        .pipe(map(response => response.content)); 
    }
}
