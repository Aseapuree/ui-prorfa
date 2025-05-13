export class Matricula {
  idmatricula?: string;
  idusuario?: string;
  idapoderado?: string;
  idalumno?: string;
  grado?: number | null;
  nivel?: string | null;
  documentos?: Documento[] | null;
  estadoMatricula?: string | null;
  seccion?: string | null;
  relacionEstudiante?: string | null;
}

export interface Documento {
    documento: string;
}
