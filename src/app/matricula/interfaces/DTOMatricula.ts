import { LocalDateTime } from "@js-joda/core";
import { UUID } from "crypto";

export class Matricula{
    idmatricula?: UUID;
     grado?: number;
     nivel?: string;
     seccion?: string;
}

export class Usuario {
  idusuario?: string;
  nombre?: string;
  apellidopaterno?: string;
  apellidomaterno?: string;
  nombreusuario?: string;
}

export class Apoderado{
  idapoderado?: UUID;
  relacionEstudiante?: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  idtipodoc?: UUID;
  numeroDocumento?: string;
  fechaNacimiento?: LocalDateTime;
  direccion?: string;
  telefono?: string;
  correo?: string;
}

export class Alumno{
  idalumno?: UUID;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  idtipodoc?: UUID;
  numeroDocumento?: string;
  fechaNacimiento?: LocalDateTime;
  direccion?: string;
}
