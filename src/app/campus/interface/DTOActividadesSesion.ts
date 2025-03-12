export interface DTOActividadesSesion {
  status: number;
  message: string;
  data: {
    introducciones: DTOIntroduccion[];
    materiales: DTOMaterial[];
    actividades: DTOActividad[];
  };
}

export interface DTOIntroduccion {
  idIntroduccion: string;
  introduccionNombre: string;
  introduccionUrl: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DTOMaterial {
  idMaterial: string;
  materialNombre: string;
  materialUrl: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DTOActividad {
  idActividad: string;
  actividadNombre: string;
  actividadUrl: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}