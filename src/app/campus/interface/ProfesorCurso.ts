import { Curso } from "./curso";
import { Usuario } from "./usuario";

export class ProfesorCurso {
    idProfesorCurso?: string;
    usuario?: Usuario;
    curso?: Curso;
    grado?: string;
    seccion?: string;
    nivel?: string;
    fechaAsignacion?: Date;
    fechaActualizacion?: Date;
}
