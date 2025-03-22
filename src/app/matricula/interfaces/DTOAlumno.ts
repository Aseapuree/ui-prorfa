import { UUID } from "crypto";
import { LocalDateTime } from '@js-joda/core';

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
