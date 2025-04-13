import { DTOActividad } from './DTOActividad';

export interface Sesion {
    idSesion?: string;
    infoCurso?: {
        idProfesorCurso?: string;
    };
    titulo?: string;
    descripcion?: string;
    fechaAsignada?: string;
    fechaCreacion?: string;
    fechaActualizacion?: string;
    actividades?: DTOActividad[];
    profesorGuardar?: string;
}



