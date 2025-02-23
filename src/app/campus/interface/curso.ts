import { UUID } from "crypto";

export class Curso {
    idCurso?: UUID;
    nombre?: string;
    descripcion?: string;
    grado?: string;
    seccion?: string;
    profesorId?: UUID;
    fechaCreacion?: Date;
    fechaActualizacion?: Date;
}
