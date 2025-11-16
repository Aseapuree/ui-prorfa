export class Curso {
    idCurso?: string;
    nombre?: string;
    descripcion?: string;
    abreviatura?: string;
    fechaCreacion?: string;
    fechaActualizacion?: string | null;
    competencias: Competencia[] = [];  // OBLIGATORIO + valor por defecto
}

export interface Competencia {
    nombre: string;
}
