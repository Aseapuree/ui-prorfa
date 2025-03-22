import { UUID } from "crypto";
import Decimal from "decimal.js";

export class Comprobante{
    idcomprobante?: UUID;
    idtipocomp?: UUID;
    codigomatricula?: string;
    codigoalumno?: string;
    montototal?: Decimal;
    url?: string;
}

export class Matricula{
  idmatricula?: UUID;
   grado?: number;
   nivel?: string;
   seccion?: string;
}
