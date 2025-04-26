export interface DTOActividad {
  idActividad?: string;
  actividadNombre?: string;
  actividadUrl?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  infoMaestra?: {
    descripcion?: string;
  };
}

export interface DTOActividadesSesion {
  status: number;
  message: string;
  data: {
    introducciones: DTOActividad[];
    materiales: DTOActividad[];
    actividades: DTOActividad[];
  };
}