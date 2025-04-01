export class Usuario {
    idusuario?: string;
    nombre?: string;
    apellidopaterno?: string;
    apellidomaterno?: string;
    nombreusuario?: string;
    rol?: string;
}

export class Curso {
    idCurso?: string;
    nombre?: string;
}

export class ProfesorCurso {
    idProfesorCurso?: string;
    usuario?: Usuario;
    curso?: Curso;
    grado?: string;
    fechaAsignacion?: Date;
}
