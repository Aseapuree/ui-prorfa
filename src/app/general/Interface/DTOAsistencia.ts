// Interfaz para el DTO enviado al backend para registrar/editar asistencias
export interface DTOAsistencia {
  idAsistencia?: string;
  idSesion?: string;
  grado?: string;
  seccion?: string;
  nivel?: string;
  idCurso?: string;
  fechaAsistencia: string;
  fechaActualizacion?: Date;
  listaAlumnos?: AlumnoAsistencia[];
}

// Interfaz para los elementos de listaAlumnos en DTOAsistencia
export interface AlumnoAsistencia {
  alumnoId: string;
  asistio: boolean;
  idAsistencia?: string; // Añadido para soportar edición
}

// Interfaz para los datos devueltos por listarAsistenciasPorSesion
export interface AsistenciaResponse {
  idAsistencia: string;
  idAlumno: string;
  nombre: string;
  apellidos: string;
  asistio: boolean;
  grado: string;
  seccion: string;
  nivel: string;
  fecha: string;
}