import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { DTOResponse } from '../interface/DTOResponse';
import { DTONota, AlumnoNotas } from '../interface/DTONota';

@Injectable({
  providedIn: 'root'
})
export class NotasService {
  private urlBase = "http://localhost:8080/v1/notas";

  constructor(private clienteHttp: HttpClient) { }

  // Método para subir el archivo a Google Drive
  subirArchivoDrive(archivo: File, idCarpeta: string): Observable<string> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('idCarpeta', idCarpeta);

    console.log('Subiendo archivo a /upload-to-drive:', archivo.name);
    return this.clienteHttp.post<string>(`${this.urlBase}/upload-to-drive`, formData, {
      responseType: 'text' as 'json',
      withCredentials: true
    }).pipe(
      map(embedUrl => {
        console.log('URL de incrustación recibida:', embedUrl);
        return embedUrl;
      }),
      catchError(error => {
        console.error('Error al subir archivo a Google Drive:', error);
        return throwError(() => new Error('Error al subir archivo a Google Drive: ' + (error.error || error.message)));
      })
    );
  }

  // Método para registrar la nota en la tabla tb_nota usando el endpoint /registrar
  registrarNota(nota: DTONota): Observable<DTOResponse<AlumnoNotas[]>> {
    console.log('Payload enviado a /registrar:', JSON.stringify(nota, null, 2));
    return this.clienteHttp.post<DTOResponse<AlumnoNotas[]>>(`${this.urlBase}/registrar`, nota, { withCredentials: true }).pipe(
      map(response => {
        console.log('Respuesta del servidor:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error al registrar la nota:', error);
        return throwError(() => new Error('Error al registrar la nota: ' + (error.error?.message || error.message)));
      })
    );
  }
}