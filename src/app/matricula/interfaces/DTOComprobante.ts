import { Alumno, Apoderado, Usuario } from "./DTOMatricula";

export class Comprobante{
    idcomprobante?: string;
    idtipocomp?: string;
    codigomatricula?: string;
    codigoalumno?: string;
    montototal?: string;
    url?: string;
}

export class Matricula {
  idmatricula?: string;
  idusuario?: Usuario;
  idapoderado?: Apoderado;
  idalumno?: Alumno;
  grado?: number;
  nivel?: string;
  seccion?: string;
}
