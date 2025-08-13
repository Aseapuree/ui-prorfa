import { Sesion } from "./sesion";
export interface AlumnoCurso {
    idCurso?: string;
    nombreCurso?: string;
    grado?: string;
    seccion?: string;
    nivel?: string;
    nombreProfesor?: string;
    sesiones?: Sesion[];
    abreviatura?: string;
  }
  