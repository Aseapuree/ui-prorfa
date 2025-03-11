import { UUID } from "crypto";

export class Sesion {
    idSesion?: UUID;
    infoCurso?: UUID;
    titulo?: string;
    descripcion?: string;


    profesorGuardar?: UUID;
}
