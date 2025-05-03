export interface DTONota {
  idSesion?: string;
  idCurso?: string;
  grado?: string;
  seccion?: string;
  nivel?: string;
  usuarioCreacion?: string; // Coincide con DTONota.java
  usuarioActualizacion?: string; // Coincide con DTONota.java
  nombreArchivo?: string; // Nuevo campo para el nombre del archivo
  fecharegistro?: string;
  comentario?: string;
  notas?: AlumnoNotas[];
  idalumano?: string;
  idactividad?: string;
  notatareaurl?: string;
}

export interface AlumnoNotas {
  idAlumno: string;
  actividades: ActividadNota[];
}

export interface ActividadNota {
  idActividad: string;
  nota: number;
  nombreArchivo?: string; // Nuevo campo
  comentario: string | null; // Añadir soporte para comentario
}

// Nueva interfaz para mapear los objetos dentro de "data" en la respuesta del endpoint /sesion/{idSesion}
export interface DTONotaResponse {
  idNota: string;
  idAlumno: string;
  nombre: string;
  apellidos: string;
  idActividad: string;
  nombreActividad: string;
  nota: number | null;
  grado: string;
  seccion: string;
  nivel: string;
  notatareaurl: string;
  usuarioCreacion: string | null; // Ajustado para coincidir con DTONotaResponse.java
  usuarioActualizacion: string | null; // Ajustado para coincidir con DTONotaResponse.java
  nombreArchivo?: string; // Nuevo campo
  comentario: string | null;
  fechaRegistro: string;
  fechaActualizacion: string; // Ajustado para coincidir con DTONotaResponse.java
}