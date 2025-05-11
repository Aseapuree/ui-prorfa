export class Curso {
    idCurso?: string;
    nombre?: string;
    descripcion?: string;
    abreviatura?: string;
    fechaCreacion?: string;
    fechaActualizacion?: string | null;
    competencias?: Competencia[];
}

export interface Competencia {
    nombre: string;
}
