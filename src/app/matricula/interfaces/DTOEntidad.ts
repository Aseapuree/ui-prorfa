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
  datosngs?: DatosNGS;
}

export interface DatosNGS {
  niveles?: Nivel[];
}

export interface Nivel {
  nombre: string;
  grados?: Grado[];
}

export interface Grado {
  nombre: string;
  secciones?: SeccionVacantes[];
}

export interface SeccionVacantes {
  nombre: string;
  vacantes: number;
}

export interface DocumentoEntidad {
  categorias?: CategoriaDocumento[];
}

export interface CategoriaDocumento {
  nombre: string;
  documentos?: string[];
  subCategorias?: SubCategoria[];
}

export interface SubCategoria {
  nombre: string;
  documentos?: string[];
}
