export interface Usuario {
  idusuario?: string;
  rol?: {
    idRol?: string;
    nombreRol?: string;
    descripcion?: string;
    fechacreacion?: Date;
    fechaactualizacion?: Date;
  };
  nombre?: string;
  apellidopaterno?: string;
  apellidomaterno?: string;
  idtipodoc?: string;
  perfilurl?: string;
}
