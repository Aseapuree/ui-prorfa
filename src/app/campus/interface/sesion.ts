import { DTOActividad } from './DTOActividad';

export interface Sesion {
    idSesion?: string;
    infoCurso?: {
        idProfesorCurso?: string;
        idCurso?: string; // Añadimos idCurso
    };
    titulo?: string;
    descripcion?: string;
    fechaAsignada?: string;
    fechaAsignacion?: string;
    fechaCreacion?: string;
    fechaActualizacion?: string;
    actividades?: DTOActividad[];
    profesorGuardar?: string;
}



