export interface DTOActividad {
  idActividad?: string;
  actividadNombre?: string;
  actividadUrl?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  fechaInicio?: Date | string | null; // Permitir Date, string, o null
  fechaFin?: Date | string | null;   // Permitir Date, string, o null
  presencial?: boolean | null;// nuevo campo para indicar si es presencial o no
  infoMaestra?: {
    descripcion?: string;
  };
  competencia?: { nombre: string } | null; // Nuevo campo para competencia
}

export interface DTOActividadesSesion {
  status: number;
  message: string;
  data: {
    introducciones: DTOActividad[];
    materiales: DTOActividad[];
    actividades: DTOActividad[];
    grado?: string; // Agregamos grado como opcional
    seccion?: string; // Agregamos seccion como opcional
    nivel?: string; // Agregamos nivel como opcional
  };
}