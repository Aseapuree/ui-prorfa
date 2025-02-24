import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Curso } from '../interface/curso';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private urlBase = "http://localhost:8080/v1/cursos";


  constructor(private clienteHttp: HttpClient) { }

  // Obtener lista de cursos para usarlo en mi campus
  obtenerCourseList(): Observable<Curso[]> {
    return this.clienteHttp.get<{ content: Curso[] }>(`${this.urlBase}/listar`)
      .pipe(map(response => response.content));
  }

}
