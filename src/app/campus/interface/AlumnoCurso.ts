import { Curso } from './Curso';
import { Sesion } from './sesion';
import { Usuario } from './Usuario';

export interface AlumnoCurso {
    idAlumnoCurso?: string;
    alumno?: {
        idAlumno?: string;
        usuario?: Usuario;
        nombre?: string;
        apellidoPaterno?: string;
        apellidoMaterno?: string;
    };
    profesorCurso?: {
        idProfesorCurso?: string;
        usuario?: Usuario;
        curso?: Curso;
    };
    fechaInscripcion?: string;
    sesiones?: Sesion[];
}