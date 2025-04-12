export interface Curso {
  idCurso?: string;
  nombre?: string;
  descripcion?: string;
  grado?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface Usuario {
  idusuario?: string;
  nombre?: string;
  apellidopaterno?: string;
  apellidomaterno?: string;
  nombreusuario?: string;
  rol?: string;
}

export interface ProfesorCurso {
  idProfesorCurso?: string;
  usuario?: Usuario; // Profesor
  curso?: Curso;
  grado?: string;
  fechaAsignacion?: string;
}

export interface AlumnoCurso {
  idAlumnoCurso?: string;
  usuario?: Usuario; // Alumno
  profesorCurso?: ProfesorCurso;
  fechaInscripcion?: string;
}