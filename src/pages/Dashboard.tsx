import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import React, { useEffect, useMemo, useState } from "react";

import MapaDispositivos from "../components/MapaDispositivos";
import PanelDispositivo from "../components/PanelDispositivo";
import { auth } from "../firebase/config";
import {
  actualizarUmbrales,
  generarCodigoInvitacion,
  getUserProfile,
  subscribeFamilia,
} from "../firebase/familia";
import { subscribeDispositivos, subscribeUltimaUbicacion } from "../firebase/dispositivos";
import type { Dispositivo, Familia, UbicacionDoc } from "../types";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [familiaId, setFamiliaId] = useState<string | null>(null);
  const [familia, setFamilia] = useState<Familia | null>(null);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Record<string, UbicacionDoc | null>>({});
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [mostrarAjustesFamilia, setMostrarAjustesFamilia] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => setFamiliaId(profile?.familia_id ?? null));
  }, [user]);

  useEffect(() => {
    if (!familiaId) return;
    return subscribeFamilia(familiaId, setFamilia);
  }, [familiaId]);

  useEffect(() => {
    if (!familiaId) return;
    return subscribeDispositivos(familiaId, (lista) => {
      setDispositivos(lista);
      setSeleccionadoId((actual) => actual ?? lista[0]?.id ?? null);
    });
  }, [familiaId]);

  useEffect(() => {
    const unsubs = dispositivos.map((d) =>
      subscribeUltimaUbicacion(d.id, (ubicacion) =>
        setUbicaciones((prev) => ({ ...prev, [d.id]: ubicacion })),
      ),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispositivos.map((d) => d.id).join(",")]);

  const seleccionado = useMemo(
    () => dispositivos.find((d) => d.id === seleccionadoId) ?? null,
    [dispositivos, seleccionadoId],
  );
  const esAdmin = familia?.admin_uid === user?.uid;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Centinela {familia && `· ${familia.nombre}`}</h1>
        <button style={styles.signOut} onClick={() => signOut(auth)}>
          Cerrar sesión
        </button>
      </header>

      <div style={styles.body}>
        <aside style={styles.sidebar}>
          <ul style={styles.listaDispositivos}>
            {dispositivos.map((d) => (
              <li key={d.id}>
                <button
                  style={{
                    ...styles.itemDispositivo,
                    ...(d.id === seleccionadoId ? styles.itemDispositivoActivo : {}),
                  }}
                  onClick={() => setSeleccionadoId(d.id)}
                >
                  <span
                    style={{
                      ...styles.dot,
                      background: d.modo_robado ? "var(--alert)" : "var(--normal)",
                    }}
                  />
                  {d.nombre}
                </button>
              </li>
            ))}
            {dispositivos.length === 0 && (
              <li style={styles.sinDispositivos}>
                Todavía no hay dispositivos en esta familia.
              </li>
            )}
          </ul>

          {esAdmin && familia && (
            <div style={styles.ajustesFamilia}>
              <button
                style={styles.linkAjustes}
                onClick={() => setMostrarAjustesFamilia((v) => !v)}
              >
                {mostrarAjustesFamilia ? "Ocultar ajustes" : "Ajustes de familia"}
              </button>
              {mostrarAjustesFamilia && (
                <AjustesFamilia familia={familia} />
              )}
            </div>
          )}

          <p className="firma">Creado por Diego Aleman</p>
        </aside>

        <div style={styles.mapWrap}>
          <MapaDispositivos
            dispositivos={dispositivos}
            ubicaciones={ubicaciones}
            seleccionadoId={seleccionadoId}
            onSeleccionar={setSeleccionadoId}
          />
        </div>

        <div style={styles.panelWrap}>
          {seleccionado && user ? (
            <PanelDispositivo
              dispositivo={seleccionado}
              ubicacion={ubicaciones[seleccionado.id] ?? null}
              uid={user.uid}
            />
          ) : (
            <p style={styles.textoMuted}>Elegí un dispositivo para ver su detalle.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AjustesFamilia({ familia }: { familia: Familia }) {
  const [intentos, setIntentos] = useState(familia.umbral_intentos_fallidos);
  const [minutos, setMinutos] = useState(familia.umbral_dead_man_switch_min);
  const [guardando, setGuardando] = useState(false);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);

  async function guardar() {
    setGuardando(true);
    try {
      await actualizarUmbrales(familia.id, {
        umbral_intentos_fallidos: intentos,
        umbral_dead_man_switch_min: minutos,
      });
    } finally {
      setGuardando(false);
    }
  }

  async function generarCodigo() {
    setGenerandoCodigo(true);
    try {
      await generarCodigoInvitacion(familia.id);
    } finally {
      setGenerandoCodigo(false);
    }
  }

  return (
    <div style={styles.ajustesForm}>
      <div>
        <span style={styles.codigoLabel}>Código de invitación</span>
        {familia.codigo_invitacion ? (
          <div style={styles.codigoBox}>{familia.codigo_invitacion}</div>
        ) : (
          <button style={styles.ajustesGuardar} onClick={generarCodigo} disabled={generandoCodigo}>
            {generandoCodigo ? "Generando..." : "Generar código"}
          </button>
        )}
        <p style={styles.codigoAyuda}>
          Compartilo con tu familia — lo escriben al registrarse para unirse a este
          mismo grupo en vez de crear uno nuevo.
        </p>
      </div>

      <label style={styles.ajustesLabel}>
        Intentos fallidos antes de la foto
        <input
          type="number"
          min={1}
          value={intentos}
          onChange={(e) => setIntentos(Number(e.target.value))}
          style={styles.ajustesInput}
        />
      </label>
      <label style={styles.ajustesLabel}>
        Minutos del dead man's switch
        <input
          type="number"
          min={5}
          value={minutos}
          onChange={(e) => setMinutos(Number(e.target.value))}
          style={styles.ajustesInput}
        />
      </label>
      <button style={styles.ajustesGuardar} onClick={guardar} disabled={guardando}>
        {guardando ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid var(--border)",
  },
  title: {
    margin: 0,
    fontSize: 20,
  },
  signOut: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid var(--alert)",
    background: "transparent",
    color: "var(--alert)",
    cursor: "pointer",
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "220px 1fr 380px",
  },
  sidebar: {
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  listaDispositivos: { listStyle: "none", margin: 0, padding: 8, display: "flex", flexDirection: "column", gap: 4 },
  itemDispositivo: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: 14,
    textAlign: "left",
  },
  itemDispositivoActivo: {
    background: "var(--bg-elevated)",
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  sinDispositivos: { padding: 12, fontSize: 13, color: "var(--text-muted)" },
  ajustesFamilia: { marginTop: "auto", padding: 12, borderTop: "1px solid var(--border)" },
  linkAjustes: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
  },
  ajustesForm: { display: "flex", flexDirection: "column", gap: 10, marginTop: 10 },
  ajustesLabel: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--text-muted)" },
  ajustesInput: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--bg-muted)",
    color: "var(--text)",
  },
  codigoLabel: { fontSize: 12, color: "var(--text-muted)" },
  codigoBox: {
    marginTop: 4,
    padding: "8px 10px",
    borderRadius: 6,
    background: "var(--bg-muted)",
    border: "1px solid var(--border)",
    fontFamily: "monospace",
    fontSize: 16,
    letterSpacing: 2,
    textAlign: "center",
  },
  codigoAyuda: { fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.4 },
  ajustesGuardar: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "none",
    background: "var(--normal)",
    color: "#04150a",
    fontWeight: 600,
    cursor: "pointer",
  },
  mapWrap: {
    borderRight: "1px solid var(--border)",
    minHeight: 0,
  },
  panelWrap: {
    minHeight: 0,
    overflowY: "auto",
  },
  textoMuted: { padding: 20, fontSize: 13, color: "var(--text-muted)" },
};
