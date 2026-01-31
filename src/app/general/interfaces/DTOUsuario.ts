import { DTORoles } from "./DTORoles";

export interface DTOUsuario {
    idusuario?: string;
    nombre?: string;
    apellidopaterno?: string;
    apellidomaterno?: string;
    perfilurl?: string;
    rol?: DTORoles;//DTORoles ya contiene las misma propiedades que estaban anteriormente
    tutor_primaria?: string;
    tutor_secundaria?: string;
    relacionentidad?: string;
  }
