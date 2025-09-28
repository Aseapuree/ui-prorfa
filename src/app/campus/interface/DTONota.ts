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
  competencia?: { nombre: string } | null; // Añadido para soportar el cálculo de peso
}


// Interfaz para una sesión con notas
export interface DTOSesionNotas {
  sesion: {
    idSesion: string;
    infoCurso: {
      idProfesorCurso: string;
      usuario: any; // Ajusta según el modelo real
      curso: {
        idCurso: string;
        nombre: string;
        descripcion: string;
        abreviatura: string;
        estado: number;
        fechaCreacion: string;
        fechaActualizacion: string | null;
        competencias: { nombre: string }[];
      };
      grado: string;
      seccion: string;
      nivel: string;
      estado: number;
      fechaAsignacion: string;
      fechaActualizacion: string | null;
    };
    titulo: string;
    descripcion: string;
    fechaAsignada: string;
    fechaActualizacion: string | null;
    actividades: any[] | null;
    profesorGuardar: string | null;
  };
  notas: DTONotaResponse[];
  promedio: number | null;
}

// Interfaz para el alumno dentro de la respuesta de notas
export interface DTOAlumnoNotasInfo {
  idAlumno: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  grado: string;
  seccion: string;
  nivel: string;
}

export interface DTOAlumnoNotas {
  alumno: DTOAlumnoNotasInfo;
  sesiones: DTOSesionNotas[];
}