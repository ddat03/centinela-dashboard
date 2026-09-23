import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "./config";
import type {
  ComandoDoc,
  Dispositivo,
  EventoDoc,
  TipoComando,
  UbicacionDoc,
} from "../types";

export function subscribeDispositivos(
  familiaId: string,
  onChange: (dispositivos: Dispositivo[]) => void,
): Unsubscribe {
  const q = query(collection(db, "dispositivos"), where("familia_id", "==", familiaId));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Dispositivo));
  });
}

export function subscribeUltimaUbicacion(
  deviceId: string,
  onChange: (ubicacion: UbicacionDoc | null) => void,
): Unsubscribe {
  const q = query(
    collection(db, "ubicaciones", deviceId, "historial"),
    orderBy("timestamp", "desc"),
    limit(1),
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.empty ? null : (snap.docs[0].data() as UbicacionDoc));
  });
}

export function subscribeEventos(
  deviceId: string,
  onChange: (eventos: EventoDoc[]) => void,
  max = 30,
): Unsubscribe {
  const q = query(
    collection(db, "eventos", deviceId, "log"),
    orderBy("timestamp", "desc"),
    limit(max),
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventoDoc));
  });
}

export function subscribeComandos(
  deviceId: string,
  onChange: (comandos: ComandoDoc[]) => void,
  max = 20,
): Unsubscribe {
  const q = query(
    collection(db, "comandos", deviceId, "pendientes"),
    orderBy("timestamp", "desc"),
    limit(max),
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ComandoDoc));
  });
}

export async function setModoRobado(
  deviceId: string,
  activar: boolean,
  activadoPorUid: string,
): Promise<void> {
  await updateDoc(doc(db, "dispositivos", deviceId), { modo_robado: activar });
  await addDoc(collection(db, "eventos", deviceId, "log"), {
    tipo: activar ? "modo_robado_activado" : "modo_robado_desactivado",
    timestamp: Date.now(),
    detalle: `Cambiado desde el dashboard por ${activadoPorUid}`,
    foto_url: null,
    ubicacion: null,
  });
}

export async function actualizarWifiConfianza(
  deviceId: string,
  wifiConfianza: string[],
): Promise<void> {
  await updateDoc(doc(db, "dispositivos", deviceId), { wifi_confianza: wifiConfianza });
}

export async function enviarComando(
  deviceId: string,
  tipo: TipoComando,
  emitidoPorUid: string,
  parametros?: Record<string, unknown>,
): Promise<void> {
  await addDoc(collection(db, "comandos", deviceId, "pendientes"), {
    tipo,
    emitido_por_uid: emitidoPorUid,
    timestamp: Date.now(),
    estado: "pendiente",
    resultado_url: null,
    parametros: parametros ?? null,
  });
}
