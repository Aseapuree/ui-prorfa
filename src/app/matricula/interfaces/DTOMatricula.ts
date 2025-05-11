export class Matricula {
  idmatricula?: string;
  idusuario?: string;
  idapoderado?: string;
  idalumno?: string;
  grado?: number | null;
  nivel?: string | null;
  documentos?: Record<string, unknown> | null;
  estadoMatricula?: string | null;
  seccion?: string | null;
  relacionEstudiante?: string | null;
}
