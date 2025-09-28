export interface AuditProrfa {
  id?: string;
  ipAddress?: string;
  userId?: string;
  idRol?: string;
  userAgent?: string;
  bandeja?: string;
  accion?: string;
  payload?: any; // Object for JSON
  fechaCreacion?: string;
}

export interface AuditFilter {
  bandeja?: string;
  accion?: string;
  userId?: string;
  fechaInicio?: string;
  fechaFin?: string;
}
