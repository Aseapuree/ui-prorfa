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


   // Obtener lista de cursos
    obtenerCourseList(): Observable<Curso[]> {
      return this.clienteHttp.get<{ data: { content: Curso[] } }>(`${this.urlBase}/listar`)
  .pipe(map(response => {
    console.log("Lista de cursos cargada correctamente:", response.data.content);
    return response.data.content;  // Aquí extraemos solo el array de cursos
  }));

    }
}
