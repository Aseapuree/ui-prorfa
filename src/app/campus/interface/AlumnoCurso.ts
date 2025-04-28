// src/app/interface/AlumnoCurso.ts
export interface AlumnoCurso {
    idCurso?: string;
    nombreCurso?: string;
    grado?: number;
    seccion?: string;
    nivel?: string;
    nombreProfesor?: string;
    sesiones?: Sesion[];
    abreviatura?: string;
  }
  
  export interface Sesion {
    idSesion?: string;
    titulo?: string;
    descripcion?: string;
    fechaAsignada?: string;
    actividades?: Actividad[];
  }
  
  export interface Actividad {
    idActividad?: string;
    actividadNombre?: string;
    actividadUrl?: string;
    actividadTipo?: string; // Debe ser 'introduccion', 'material' o 'actividad'
    fechaCreacion?: string;
    fechaInicio?: Date | string | null; // Permitir Date, string, o null
  fechaFin?: Date | string | null;    // Permitir Date, string, o null
  }