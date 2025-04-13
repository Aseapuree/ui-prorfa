// src/app/services/alumno-curso.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AlumnoCurso } from '../interface/AlumnoCurso';

@Injectable({
  providedIn: 'root'
})
export class AlumnoCursoService {
  private urlBase = 'http://localhost:8080/v1/alumno-curso';

    constructor(private clienteHttp: HttpClient) { }

    // Obtener cursos de un alumno específico
    obtenerCursosPorAlumno(usuarioId: string): Observable<AlumnoCurso[]> {
        return this.clienteHttp.get<{ status: number, message: string, data: AlumnoCurso[] }>(
            `${this.urlBase}/listar-por-alumno/${usuarioId}`,
            { withCredentials: true }
        ).pipe(
            map(response => {
                console.log('Respuesta del backend:', response);
                return response.data;
            }),
            catchError(error => {
                console.error('Error al obtener los cursos del alumno', error);
                return throwError(() => new Error('Error al cargar los cursos'));
            })
        );
    }
}