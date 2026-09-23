import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "./config";
import type { Familia, UserProfile } from "../types";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export function subscribeFamilia(
  familiaId: string,
  onChange: (familia: Familia | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, "familias", familiaId), (snap) => {
    onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Familia) : null);
  });
}

export async function actualizarUmbrales(
  familiaId: string,
  umbrales: Pick<Familia, "umbral_intentos_fallidos" | "umbral_dead_man_switch_min">,
): Promise<void> {
  await updateDoc(doc(db, "familias", familiaId), umbrales);
}

const CARACTERES_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I

// Familias creadas antes de que existiera el código de invitación no tienen
// este campo — se genera acá mismo la primera vez que el admin entra a
// Ajustes de familia.
export async function generarCodigoInvitacion(familiaId: string): Promise<string> {
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += CARACTERES_CODIGO[Math.floor(Math.random() * CARACTERES_CODIGO.length)];
  }
  await updateDoc(doc(db, "familias", familiaId), { codigo_invitacion: codigo });
  return codigo;
}
