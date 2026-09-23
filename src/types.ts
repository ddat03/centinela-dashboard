// Modelo de datos — ver claude_centinela-antirrobo-plan.md sección 5.
// Espejo de movil/src/types/index.ts (sin paquete compartido todavía).

export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  familia_id: string | null;
  createdAt: number;
}

export interface Familia {
  id: string;
  nombre: string;
  admin_uid: string;
  miembros: string[];
  umbral_intentos_fallidos: number;
  umbral_dead_man_switch_min: number;
  codigo_invitacion: string;
}

export type FuenteUbicacion = "datos" | "wifi" | "buffer";

export interface Dispositivo {
  id: string;
  familia_id: string;
  dueno_uid: string;
  nombre: string;
  modelo?: string;
  modo_robado: boolean;
  ultimo_checkin: number | null;
  bateria: number | null;
  recovery_token: string | null;
  recovery_token_actualizado: number | null;
  dead_man_switch_alertado?: boolean;
}

export interface UbicacionDoc {
  lat: number;
  lng: number;
  precision: number;
  fuente: FuenteUbicacion;
  timestamp: number;
}

export type TipoEvento =
  | "sim_removido"
  | "intento_fallido"
  | "dead_man_switch"
  | "modo_robado_activado"
  | "modo_robado_desactivado"
  | "comando_ejecutado"
  | "sin_conexion_prolongada"
  | "reconexion_con_foto"
  | "encontrado_reporte";

export interface EventoDoc {
  id: string;
  tipo: TipoEvento;
  timestamp: number;
  detalle?: string | null;
  foto_url?: string | null;
  ubicacion?: { lat: number; lng: number } | null;
}

export type TipoComando = "sonar" | "foto" | "audio" | "mensaje_pantalla";
export type EstadoComando = "pendiente" | "ejecutado" | "fallido";

export interface ComandoDoc {
  id: string;
  tipo: TipoComando;
  emitido_por_uid: string;
  timestamp: number;
  estado: EstadoComando;
  resultado_url?: string | null;
  parametros?: Record<string, unknown> | null;
  detalle?: string | null;
}
