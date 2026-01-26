import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { DTOResponse } from '../interface/DTOResponse';
import { DTONota, AlumnoNotas, DTONotaResponse, DTOAlumnoNotas } from '../interface/DTONota';
import { environment } from '../../../environments/environment';

// Interfaz para la respuesta del endpoint /alumnByNumDoc
interface DTOAlumno {
  idalumno: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  idtipodoc: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  direccion: string;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

// Interfaz para la respuesta del endpoint /profesor-curso/{idProfesorCurso}
interface DTOCursoNotas {
  curso: {
    idProfesorCurso: string;
    usuario: any; // Ajusta según el modelo real
    curso: any;   // Ajusta según el modelo real
    grado: string;
    seccion: string;
    nivel: string;
    estado: number;
    fechaAsignacion: string;
    fechaActualizacion: string | null;
  };
  sesiones: {
    sesion: {
      idSesion: string;
      infoCurso: any; // Ajusta según el modelo real
      titulo: string;
      descripcion: string;
      fechaAsignada: string;
      fechaActualizacion: string | null;
      actividades: any[]; // Ajusta según el modelo real
      profesorGuardar: string | null;
    };
    notas: DTONotaResponse[]; // Ajusta si el backend devuelve un formato diferente
  }[];
}

// Interfaz para la respuesta completa de notas por alumno


@Injectable({
  providedIn: 'root'
})
export class NotasService {
  private urlBase = `${environment.apiUrl}/api/v1/notas`;
  private alumnoUrlBase = `${environment.apiUrl}/api/v1/alumnos`;

  constructor(private clienteHttp: HttpClient) { }

  // Método para obtener el idAlumno dado un nombre completo
  obtenerIdAlumnoPorNombre(nombreCompleto: string): Observable<string> {
    console.log('Obteniendo idAlumno para nombre:', nombreCompleto);
    return this.clienteHttp.get<DTOResponse<DTOAlumno>>(`${this.alumnoUrlBase}/alumnByNumDoc?name=${nombreCompleto}`, { withCredentials: true }).pipe(
      map(response => {
        console.log('Respuesta del servidor (obtenerIdAlumnoPorNombre):', response);
        if (response.code === 200 && response.data && response.data.idalumno) {
          return response.data.idalumno;
        } else {
          throw new Error('No se encontró el alumno con el nombre proporcionado');
        }
      }),
      catchError(error => {
        console.error('Error al obtener el idAlumno:', error);
        return throwError(() => new Error('Error al obtener el idAlumno: ' + (error.message || error)));
      })
    );
  }

  // Nuevo método para obtener los datos completos del alumno dado un nombre completo
  obtenerDatosAlumnoPorNombre(nombreCompleto: string): Observable<DTOAlumno> {
    console.log('Obteniendo datos del alumno para nombre:', nombreCompleto);
    return this.clienteHttp.get<DTOResponse<DTOAlumno>>(`${this.alumnoUrlBase}/alumnByNumDoc?name=${nombreCompleto}`, { withCredentials: true }).pipe(
      map(response => {
        console.log('Respuesta del servidor (obtenerDatosAlumnoPorNombre):', response);
        if (response.code === 200 && response.data) {
          return response.data;
        } else {
          throw new Error('No se encontraron datos del alumno con el nombre proporcionado');
        }
      }),
      catchError(error => {
        console.error('Error al obtener los datos del alumno:', error);
        return throwError(() => new Error('Error al obtener los datos del alumno: ' + (error.message || error)));
      })
    );
  }

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

  // Método para listar las notas por profesor-curso
  listarNotasPorProfesorCurso(idProfesorCurso: string): Observable<DTOResponse<DTOCursoNotas>> {
    console.log('Listando notas para el profesor-curso:', idProfesorCurso);
    return this.clienteHttp.get<DTOResponse<DTOCursoNotas>>(`${this.urlBase}/profesor-curso/${idProfesorCurso}`, { withCredentials: true }).pipe(
      map(response => {
        console.log('Respuesta del servidor (listarNotasPorProfesorCurso):', response);
        if (response.code === 200 && response.data) {
          return response;
        } else {
          throw new Error('No se encontraron notas para el curso');
        }
      }),
      catchError(error => {
        console.error('Error al listar las notas por profesor-curso:', error);
        return throwError(() => new Error('Error al listar las notas por profesor-curso: ' + (error.message || error)));
      })
    );
  }

  // Método para listar las notas por sesión usando el endpoint /sesion/{idSesion}
  listarNotasPorSesion(idSesion: string): Observable<DTOResponse<DTONotaResponse[]>> {
    console.log('Listando notas para la sesión:', idSesion);
    return this.clienteHttp.get<DTOResponse<DTONotaResponse[]>>(`${this.urlBase}/sesion/${idSesion}`, { withCredentials: true }).pipe(
      map(response => {
        console.log('Respuesta del servidor (listarNotasPorSesion):', response);
        return response;
      }),
      catchError(error => {
        console.error('Error al listar las notas:', error);
        return throwError(() => new Error('Error al listar las notas: ' + (error.message || error)));
      })
    );
  }

  // Método para editar las notas usando el endpoint /editar
  editarNota(nota: DTONota): Observable<DTOResponse<AlumnoNotas[]>> {
    console.log('Payload enviado a /editar:', JSON.stringify(nota, null, 2));
    return this.clienteHttp.put<DTOResponse<AlumnoNotas[]>>(`${this.urlBase}/editar`, nota, { withCredentials: true }).pipe(
      map(response => {
        console.log('Respuesta del servidor (editarNota):', response);
        return response;
      }),
      catchError(error => {
        console.error('Error al editar la nota:', error);
        return throwError(() => new Error('Error al editar la nota: ' + (error.error?.message || error.message)));
      })
    );
  }

  // Método para obtener las notas de un alumno por su ID
  obtenerNotasPorAlumno(idAlumno: string): Observable<DTOResponse<DTOAlumnoNotas>> {
    console.log('Obteniendo notas para el alumno:', idAlumno);
    return this.clienteHttp.get<DTOResponse<DTOAlumnoNotas>>(`${this.urlBase}/alumno/${idAlumno}`, { withCredentials: true }).pipe(
      map(response => {
        console.log('Respuesta del servidor (obtenerNotasPorAlumno):', response);
        if (response.code === 200 && response.data) {
          return response;
        } else {
          throw new Error('No se encontraron notas para el alumno');
        }
      }),
      catchError(error => {
        console.error('Error al obtener las notas del alumno:', error);
        return throwError(() => new Error('Error al obtener las notas: ' + (error.message || error)));
      })
    );
  }

//generar boletas metodo enpoitn
 /*generarBoletaPdf(idAlumno: string): Observable<Blob> {
    console.log('Generando boleta PDF para idAlumno:', idAlumno);
    return this.clienteHttp.get(`${this.urlBase}/boleta-pdf/${idAlumno}`, {
      responseType: 'blob', // Para descargar como binario (PDF)
      withCredentials: true
    }).pipe(
      map(blob => {
        console.log('PDF generado exitosamente (tamaño:', blob.size, 'bytes)');
        return blob;
      }),
      catchError(error => {
        console.error('Error al generar boleta PDF:', error);
        return throwError(() => new Error('Error al generar boleta PDF: ' + (error.message || error)));
      })
    );
  }*/
//generar boletas metodo enpoitn
  generarBoletaPdfConEntidad(idAlumno: string, entidad: any): Observable<Blob> {  // 'any' para DTOEntidad
  console.log('Generando boleta con entidad:', entidad);
  return this.clienteHttp.post(`${this.urlBase}/boleta-pdf`, { idAlumno, entidad }, {
    responseType: 'blob',
    withCredentials: true
  }).pipe(
    map(blob => {
      console.log('PDF generado con entidad (tamaño:', blob.size, 'bytes)');
      return blob;
    }),
    catchError(error => {
      console.error('Error al generar boleta con entidad:', error);
      return throwError(() => new Error('Error al generar boleta PDF: ' + (error.message || error)));
    })
  );
}
}
