export interface DTOActividad {
  idActividad?: string;
  actividadNombre?: string;
  actividadUrl?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  fechaInicio?: Date | string | null; // Permitir Date, string, o null
  fechaFin?: Date | string | null;   // Permitir Date, string, o null
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