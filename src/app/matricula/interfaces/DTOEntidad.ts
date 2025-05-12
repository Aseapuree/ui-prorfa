export class Entidad {
  identidad?: string;
  nombreColegio?: string;
  direccionColegio?: string;
  rucColegio?: string;
  razonSocial?: string;
  telefonoColegio?: string;
  correoColegio?: string;
  logoColegio?: string;
  documentos?: DocumentoEntidad;
}

export class DocumentoEntidad {
  necesarios?: Necesarios;
  adicionales?: Adicionales;
}

export class Necesarios {
  documento1?: string; // DOCUMENTO QUE ACREDITA IDENTIDAD ALUMNO
  documento2?: string; // DOCUMENTO QUE ACREDITA IDENTIDAD APODERADO
}

export class Adicionales {
  intercambio?: Intercambio;
  discapacidad?: Discapacidad;
}

export class Intercambio {
  documento1?: string; // CERTIFICADO DE ESTUDIOS
  documento2?: string; // BOLETA DE NOTAS
}

export class Discapacidad {
  documento1?: string; // CERTIFICADO DE DISCAPACIDAD
}

