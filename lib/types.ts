export type AttendanceStatus = "Presente" | "Tarde" | "No Justificado" | "Justificada";

export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];

export interface Profesor {
  id: string;
  nombre: string;
  cedula?: string;
  departamento?: string;
  email?: string;
  activo: boolean;
  createAt?: unknown;
}

export interface Asistencia {
  id: string;
  profesorId: string;
  profesorNombre: string;
  fecha: string;
  diaSemana: string;
  status: AttendanceStatus;
  motivo?: string;
  createAt?: unknown;
}

export interface AsistenciaRow {
  profesorId: string;
  profesorNombre: string;
  status: AttendanceStatus | "";
  motivo: string;
}
