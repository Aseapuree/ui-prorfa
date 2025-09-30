import { Usuario } from "./usuario";

export interface AuditProrfa {
    id?: string;
    userName?: string;
    rolName?: string;
    ipAddress?: string;
    userAgent?: string;
    bandeja?: string;
    accion?: string;
    payload?: any;
    fechaCreacion?: Date;
}
