import { UUID } from "crypto";
import { LocalDateTime } from '@js-joda/core';

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
