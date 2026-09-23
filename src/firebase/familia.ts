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
