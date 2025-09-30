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
  // Interfaz para el alumno dentro de la respuesta de notas
interface DTOAlumnoNotasInfo {
  idAlumno: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  grado: string;
  seccion: string;
  nivel: string;
}