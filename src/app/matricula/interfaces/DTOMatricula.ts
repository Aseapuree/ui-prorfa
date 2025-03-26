export class Matricula {
  idmatricula?: string;
  idusuario?: Usuario;
  idapoderado?: Apoderado;
  idalumno?: Alumno;
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

export class Apoderado {
  idapoderado?: string;
  relacionEstudiante?: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  fechaNacimiento?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
}

export class Alumno {
  idalumno?: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  fechaNacimiento?: string;
  direccion?: string;
}
