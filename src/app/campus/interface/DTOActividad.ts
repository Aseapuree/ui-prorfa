export interface DTOActividad {
  actividadNombre?: string;
  actividadUrl?: string;
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