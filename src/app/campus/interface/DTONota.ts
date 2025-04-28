export interface DTONota {
    idSesion?: string; // Requerido para ambos casos (alumno y profesor)
    idCurso?: string; // Requerido para el profesor
    grado?: string; // Requerido para el profesor
    seccion?: string; // Requerido para el profesor
    nivel?: string; // Requerido para el profesor
    usuarioCreacion?: string; // Requerido para el profesor
    notas?: AlumnoNotas[]; // Requerido para el profesor
    // Campos para el alumno subiendo una tarea
    idalumano?: string; // ID del alumno (en formato string porque se toma de localStorage)
    idactividad?: string; // ID de la actividad
    notatareaurl?: string; // URL del archivo subido
  }
  
  // Sub-interfaz para AlumnoNotas (usada por el profesor para registrar notas)
  export interface AlumnoNotas {
    idAlumno: string; // ID del alumno
    actividades: ActividadNota[]; // Lista de actividades con notas
  }
  
  // Sub-interfaz para ActividadNota (usada dentro de AlumnoNotas)
  export interface ActividadNota {
    idActividad: string; // ID de la actividad
    nota: number; // Nota asignada por el profesor (0-20)
  }