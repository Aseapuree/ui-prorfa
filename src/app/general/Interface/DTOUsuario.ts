import { DTORoles } from "./DTORoles";

export class DTOUsuario {
    idusuario?: string;
    nombre?: string;
    apellidopaterno?: string;
    apellidomaterno?: string;
    perfilurl?: string;
    rol?: DTORoles;//DTORoles ya contiene las misma propiedades que estaban anteriormente
  }