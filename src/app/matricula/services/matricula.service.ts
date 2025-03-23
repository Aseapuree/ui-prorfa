import { Matricula } from './../interfaces/DTOMatricula';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MatriculaService {

  private urlBase = "http://localhost:8080/v1/matriculas";

  constructor(private http: HttpClient) { }

  // Obtener lista de matriculas
  obtenerMatriculas(): Observable<Matricula[]> {
    return this.http.get<any>(`${this.urlBase}/listar`, { withCredentials: true })
      .pipe(map(response => {
        console.log("Lista de matriculas cargada correctamente.");
        return response.data.content;
      }));
  }

  // Agregar una nueva matricula
  agregarMatricula(matricula: Matricula): Observable<Matricula> {
    return this.http.post<Matricula>(`${this.urlBase}/agregar`, matricula, { withCredentials: true });
  }

  // Editar una matricula existente
  editarMatricula(id: string, matricula: Matricula): Observable<Matricula> {
    return this.http.put<Matricula>(`${this.urlBase}/editar/${id}`, matricula, { withCredentials: true });
  }

  // Eliminar una matricula
  eliminarMatricula(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/eliminar/${id}`, { withCredentials: true });
  }

  // Asignar sección basado en el grado
  asignarSeccion(grado: number): Observable<string> {
    return this.http.get<string>(`${this.urlBase}/asignarSeccion/${grado}`, { withCredentials: true });
  }

  // Obtener vacantes por nivel
  vacantesPorNivel(nivel: string): Observable<Map<number, Map<string, number>>> {
    return this.http.get<Map<number, Map<string, number>>>(`${this.urlBase}/vacantes/${nivel}`, { withCredentials: true });
  }
}
