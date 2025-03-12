export class DTOUsuario {
    idusuario?: string;
    nombre?: string;
    apellidopaterno?: string;
    apellidomaterno?: string;
    rol?: {
      idRol: string;
      nombreRol: string;
      descripcion: string;
      fechacreacion: string;
      fechaactualizacion: string;
    };
  }