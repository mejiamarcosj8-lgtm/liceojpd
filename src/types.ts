/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'director' | 'docente' | 'estudiante' | 'padre' | 'registro' | 'orientacion';

export interface User {
  id: string;
  username: string;
  nombreCompleto: string;
  role: UserRole;
  correo: string;
  telefono: string;
  fotografia: string;
  activo: boolean;
  biografia?: string;
  especialidad?: string; // For teachers
  password?: string; // Optional custom credentials
  // Relations
  cursoId?: string; // For students
  seccion?: string; // For students (e.g. 'A', 'B')
  matricula?: string; // For students
  sexo?: 'Masculino' | 'Femenino' | 'Otro';
  fechaNacimiento?: string;
  edad?: number;
  tutor?: string;
  padreId?: string; // Linked parent ID for students
  estudiantesVinculadosIds?: string[]; // For parents, list of student IDs
  esMeritorio?: boolean; // Manual designation by Admin
  motivoMerito?: string; // Optional custom note for the merit badge
}

export interface Course {
  id: string;
  nombre: string; // e.g. '3.º A'
  activo?: boolean;
  nivel?: 'Inicial' | 'Primaria' | 'Secundaria';
  secciones?: string[]; // e.g. ['A', 'B']
}

export interface Subject {
  id: string;
  nombre: string; // e.g. 'Matemática', 'Lengua Española'
  cursoId: string;
  docenteId: string; // Assigned teacher
}

export interface Grade {
  id: string;
  estudianteId: string;
  materiaId: string;
  materiaNombre: string;
  p1: number; // 0-100
  p2: number;
  p3: number;
  p4: number;
  examenFinal?: number;
  promedio: number;
  observaciones?: string;
  estado: 'Aprobado' | 'Reprobado' | 'Pendiente';
  updatedAt: string;
}

export interface Attendance {
  id: string;
  estudianteId: string;
  materiaId: string;
  materiaNombre: string;
  fecha: string; // YYYY-MM-DD
  estado: 'Presente' | 'Ausente' | 'Excusa' | 'Tardanza';
  observaciones?: string;
  hora?: string; // e.g. "08:15"
  docente?: string; // name of teacher
}

export interface Task {
  id: string;
  titulo: string;
  descripcion: string;
  materiaId: string;
  materiaNombre: string;
  cursoId: string;
  seccion: string;
  fechaEntrega: string;
  archivoAdjunto?: string; // Mock or real filename
  entregas: TaskSubmission[];
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  estudianteId: string;
  estudianteNombre: string;
  fechaEntrega: string;
  archivo: string;
  calificacion?: number;
  comentario?: string;
  estado: 'Entregado' | 'Calificado' | 'Pendiente';
}

export interface NewsItem {
  id: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen: string;
  fecha: string;
  autor: string;
}

export interface SchoolEvent {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string; // YYYY-MM-DD
  hora?: string;
  tipo: 'Academico' | 'Deportivo' | 'Cultural' | 'Patriotico' | 'Feriado';
}

export interface AuditLog {
  id: string;
  usuario: string;
  accion: string;
  detalles: string;
  fecha: string;
}

export interface SystemConfig {
  nombreCentro: string;
  eslogan: string;
  logo: string;
  colorPrimario: string; // #5A2D1A
  colorSecundario: string; // #D4AF37
  telefono: string;
  correo: string;
  direccion: string;
  redesSociales: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  bannerPrincipal: string;
  calendarioEscolarUrl: string;
  anoEscolar: string; // e.g. "2026-2027"
  periodoActivo: string; // e.g. "P1"
}

export type ObservationImportance = 'Regular' | 'Importante' | 'Muy importante';

export interface Observation {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  cursoId: string;
  cursoNombre: string;
  docenteId: string;
  docenteNombre: string;
  materiaNombre?: string;
  tipo: string; // e.g. 'conducta', 'excusa', 'rendimiento', 'otra'
  detalle: string;
  importancia: ObservationImportance;
  fecha: string; // YYYY-MM-DD HH:mm
}

export interface Citation {
  id: string;
  observacionId?: string;
  estudianteId: string;
  estudianteNombre: string;
  fechaCitacion: string; // YYYY-MM-DD
  horaCitacion?: string;
  motivoCitacion?: string;
  motivo?: string; // Support both for flexibility
  consecuencias?: string;
  orientadorId?: string;
  orientadorNombre?: string;
  tutorNombre?: string;
  fechaCreacion: string;
  realizada?: boolean;
  opinionOrientador?: string; // AI generated professional opinion of the counselor
}

