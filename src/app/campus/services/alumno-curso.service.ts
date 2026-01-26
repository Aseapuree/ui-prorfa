import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AlumnoCurso } from '../interface/AlumnoCurso';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlumnoCursoService {

    private urlBase = `${environment.apiUrl}/api/v1/alumnos`;

  constructor(private clienteHttp: HttpClient) {}

  obtenerCursosPorAlumno(idAuth: string): Observable<AlumnoCurso[]> {
  return this.clienteHttp
    .get<any>(`${this.urlBase}/cursos/${idAuth}`, { withCredentials: true })
    .pipe(
      map(response => {
  console.log('Respuesta COMPLETA del backend:', response);
  console.log('response.data:', response.data);
  console.log('Tipo de response.data:', typeof response.data);
  console.log('¿Es array response.data?', Array.isArray(response.data));

  // ¡Esto es clave! Muestra todas las propiedades de data
  if (response.data && typeof response.data === 'object') {
    console.log('Propiedades dentro de response.data:', Object.keys(response.data));
  }

  // Intenta varias formas comunes
  let cursos: AlumnoCurso[] = [];

  if (Array.isArray(response.data)) {
    cursos = response.data;
  } else if (response.data?.cursos && Array.isArray(response.data.cursos)) {
    cursos = response.data.cursos;
  } else if (response.data?.lista && Array.isArray(response.data.lista)) {
    cursos = response.data.lista;
  } else if (response.data?.items && Array.isArray(response.data.items)) {
    cursos = response.data.items;
  } else if (response.data?.content && Array.isArray(response.data.content)) {
    cursos = response.data.content;
  } else if (response.data?.data && Array.isArray(response.data.data)) {
    cursos = response.data.data;
  }

  console.log('Cursos extraídos finalmente:', cursos);
  console.log('Cantidad de cursos:', cursos.length);

  return cursos;
})
    );
}
}