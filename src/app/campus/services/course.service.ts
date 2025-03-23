import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Curso } from '../interface/Curso';
import { response } from 'express';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private urlBase = "http://localhost:8080/v1/cursos";


  constructor(private clienteHttp: HttpClient) { }


  obtenerListaCursos(): Observable<Curso[]> {
    return this.clienteHttp.get<{ data: { content: Curso[] } }>(`${this.urlBase}/listar`,{withCredentials:true})
      .pipe(map(response => response.data.content));
  }

  agregarCurso(curso: Curso): Observable<Curso> {
    return this.clienteHttp.post<Curso>(`${this.urlBase}/agregar`, curso,{withCredentials:true});
  }
  
  actualizarCurso(id: string, curso: Curso): Observable<Curso> {
    return this.clienteHttp.put<Curso>(`${this.urlBase}/editar/${id}`, curso,{withCredentials:true});
  }

  eliminarCurso(id: string): Observable<void> {
    return this.clienteHttp.delete<void>(`${this.urlBase}/eliminar/${id}`,{withCredentials:true});
  }

  buscarCursos(keyword: string): Observable<Curso[]> {
    return this.clienteHttp.get<{ data: Curso[] }>(`${this.urlBase}/buscar?keyword=${keyword}`,{withCredentials:true})
      .pipe(
        map(response => {
          console.log("Respuesta del backend:", response);
          return response.data; 
        })
      );
  }
  
}