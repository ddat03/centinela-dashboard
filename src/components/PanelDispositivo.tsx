import React, { useEffect, useState } from "react";

import {
  actualizarWifiConfianza,
  enviarComando,
  setModoRobado,
  subscribeComandos,
  subscribeEventos,
} from "../firebase/dispositivos";
import type { ComandoDoc, Dispositivo, EventoDoc, TipoComando, UbicacionDoc } from "../types";
import ConfirmModal from "./ConfirmModal";

const AUDIO_ADVERTENCIA =
  "Grabar audio de terceros sin su conocimiento tiene restricciones legales en Ecuador y " +
  "la mayoría de países de la región, incluso en tu propio celular robado. Esta función queda " +
  "bajo tu propio criterio y responsabilidad — Centinela nunca la activa sola.";

const ETIQUETAS_EVENTO: Record<string, string> = {
  sim_removido: "SIM removido/cambiado",
  wifi_desconocido: "Se desconectó del wifi de confianza",
  intento_fallido: "Intento de desbloqueo fallido",
  dead_man_switch: "Dejó de reportar (dead man's switch)",
  modo_robado_activado: "Modo robado activado",
  modo_robado_desactivado: "Modo robado desactivado",
  comando_ejecutado: "Comando ejecutado",
  sin_conexion_prolongada: "Sin conexión por tiempo prolongado",
  encontrado_reporte: "Alguien escaneó el QR de recuperación",
};

const ETIQUETAS_COMANDO: Record<TipoComando, string> = {
  sonar: "Sonar alarma",
  foto: "Tomar foto",
  audio: "Grabar audio",
  mensaje_pantalla: "Mensaje en pantalla",
};

interface ComandoPendiente {
  tipo: TipoComando;
  parametros?: Record<string, unknown>;
  titulo: string;
  mensaje: string;
  advertencia?: string;
}

interface Props {
  dispositivo: Dispositivo;
  ubicacion: UbicacionDoc | null;
  uid: string;
}

export default function PanelDispositivo({ dispositivo, ubicacion, uid }: Props) {
  const [eventos, setEventos] = useState<EventoDoc[]>([]);
  const [comandos, setComandos] = useState<ComandoDoc[]>([]);
  const [comandoPendiente, setComandoPendiente] = useState<ComandoPendiente | null>(null);
  const [confirmarModoRobado, setConfirmarModoRobado] = useState<boolean | null>(null);
  const [mensajePantalla, setMensajePantalla] = useState("");
  const [nuevoWifi, setNuevoWifi] = useState("");

  useEffect(() => {
    const unsubEventos = subscribeEventos(dispositivo.id, setEventos);
    const unsubComandos = subscribeComandos(dispositivo.id, setComandos);
    return () => {
      unsubEventos();
      unsubComandos();
    };
  }, [dispositivo.id]);

  async function confirmarCambioModoRobado() {
    if (confirmarModoRobado === null) return;
    await setModoRobado(dispositivo.id, confirmarModoRobado, uid);
    setConfirmarModoRobado(null);
  }

  async function confirmarComando() {
    if (!comandoPendiente) return;
    await enviarComando(dispositivo.id, comandoPendiente.tipo, uid, comandoPendiente.parametros);
    setComandoPendiente(null);
    setMensajePantalla("");
  }

  async function agregarWifi() {
    const ssid = nuevoWifi.trim();
    if (!ssid) return;
    await actualizarWifiConfianza(dispositivo.id, [...dispositivo.wifi_confianza, ssid]);
    setNuevoWifi("");
  }

  async function quitarWifi(ssid: string) {
    await actualizarWifiConfianza(
      dispositivo.id,
      dispositivo.wifi_confianza.filter((w) => w !== ssid),
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.nombre}>{dispositivo.nombre}</h2>
          {dispositivo.modelo && <p style={styles.modelo}>{dispositivo.modelo}</p>}
        </div>
        <span style={dispositivo.modo_robado ? styles.badgeRobado : styles.badgeNormal}>
          {dispositivo.modo_robado ? "Robado" : "Normal"}
        </span>
      </div>

      <div style={styles.infoRow}>
        <InfoItem label="Batería" value={dispositivo.bateria != null ? `${dispositivo.bateria}%` : "—"} />
        <InfoItem label="Último check-in" value={formatearFecha(dispositivo.ultimo_checkin)} />
        <InfoItem
          label="Ubicación"
          value={ubicacion ? `${ubicacion.lat.toFixed(4)}, ${ubicacion.lng.toFixed(4)}` : "—"}
        />
      </div>

      <button
        style={dispositivo.modo_robado ? styles.botonDesactivar : styles.botonActivar}
        onClick={() => setConfirmarModoRobado(!dispositivo.modo_robado)}
      >
        {dispositivo.modo_robado ? "Desactivar modo robado" : "Activar modo robado"}
      </button>

      <h3 style={styles.seccionTitulo}>Comandos remotos</h3>
      <div style={styles.comandosGrid}>
        <button
          style={styles.comandoBtn}
          onClick={() =>
            setComandoPendiente({
              tipo: "sonar",
              titulo: "Sonar alarma",
              mensaje: "Va a sonar a volumen máximo en el equipo, aunque esté en silencio.",
            })
          }
        >
          🔊 Sonar
        </button>
        <button
          style={styles.comandoBtn}
          onClick={() =>
            setComandoPendiente({
              tipo: "foto",
              parametros: { camara: "frontal" },
              titulo: "Tomar foto (frontal)",
              mensaje: "Se tomará una foto silenciosa con la cámara frontal, sin visor ni obturador.",
            })
          }
        >
          📷 Foto frontal
        </button>
        <button
          style={styles.comandoBtn}
          onClick={() =>
            setComandoPendiente({
              tipo: "foto",
              parametros: { camara: "trasera" },
              titulo: "Tomar foto (trasera)",
              mensaje: "Se tomará una foto silenciosa con la cámara trasera, sin visor ni obturador.",
            })
          }
        >
          📷 Foto trasera
        </button>
        <button
          style={styles.comandoBtnPeligroso}
          onClick={() =>
            setComandoPendiente({
              tipo: "audio",
              parametros: { duracionSeg: 15 },
              titulo: "Grabar audio (15s)",
              mensaje: "Se grabará un clip corto de audio ambiental en el equipo.",
              advertencia: AUDIO_ADVERTENCIA,
            })
          }
        >
          🎙️ Grabar audio
        </button>
      </div>

      <div style={styles.mensajeForm}>
        <input
          style={styles.input}
          placeholder="Mensaje a mostrar en pantalla..."
          value={mensajePantalla}
          onChange={(e) => setMensajePantalla(e.target.value)}
        />
        <button
          style={styles.comandoBtn}
          disabled={!mensajePantalla.trim()}
          onClick={() =>
            setComandoPendiente({
              tipo: "mensaje_pantalla",
              parametros: { texto: mensajePantalla.trim() },
              titulo: "Mostrar mensaje en pantalla",
              mensaje: `Se va a mostrar a pantalla completa: "${mensajePantalla.trim()}"`,
            })
          }
        >
          Enviar
        </button>
      </div>

      {comandos.length > 0 && (
        <ul style={styles.listaChica}>
          {comandos.slice(0, 5).map((c) => (
            <li key={c.id} style={styles.itemChico}>
              <span>{ETIQUETAS_COMANDO[c.tipo]}</span>
              <span style={estiloEstadoComando(c.estado)}>{c.estado}</span>
            </li>
          ))}
        </ul>
      )}

      <h3 style={styles.seccionTitulo}>Wifi de confianza</h3>
      <div style={styles.mensajeForm}>
        <input
          style={styles.input}
          placeholder="Nombre de la red (SSID)"
          value={nuevoWifi}
          onChange={(e) => setNuevoWifi(e.target.value)}
        />
        <button style={styles.comandoBtn} onClick={agregarWifi} disabled={!nuevoWifi.trim()}>
          Agregar
        </button>
      </div>
      <div style={styles.chips}>
        {dispositivo.wifi_confianza.map((ssid) => (
          <span key={ssid} style={styles.chip}>
            {ssid}
            <button style={styles.chipRemove} onClick={() => quitarWifi(ssid)}>
              ×
            </button>
          </span>
        ))}
        {dispositivo.wifi_confianza.length === 0 && (
          <span style={styles.textoMuted}>Sin redes configuradas todavía.</span>
        )}
      </div>

      <h3 style={styles.seccionTitulo}>Historial de eventos</h3>
      <ul style={styles.listaEventos}>
        {eventos.length === 0 && <li style={styles.textoMuted}>Sin eventos registrados todavía.</li>}
        {eventos.map((e) => (
          <li key={e.id} style={styles.itemEvento}>
            <span>{ETIQUETAS_EVENTO[e.tipo] ?? e.tipo}</span>
            <span style={styles.eventoFecha}>{formatearFecha(e.timestamp)}</span>
          </li>
        ))}
      </ul>

      {confirmarModoRobado !== null && (
        <ConfirmModal
          titulo={confirmarModoRobado ? "Activar modo robado" : "Desactivar modo robado"}
          mensaje={
            confirmarModoRobado
              ? "El equipo va a reportar ubicación cada pocos segundos y quedará habilitado para comandos remotos."
              : "El equipo vuelve al monitoreo normal (intervalo largo, sin comandos remotos activos)."
          }
          textoConfirmar={confirmarModoRobado ? "Activar" : "Desactivar"}
          peligroso={confirmarModoRobado}
          onConfirmar={confirmarCambioModoRobado}
          onCancelar={() => setConfirmarModoRobado(null)}
        />
      )}

      {comandoPendiente && (
        <ConfirmModal
          titulo={comandoPendiente.titulo}
          mensaje={comandoPendiente.mensaje}
          advertencia={comandoPendiente.advertencia}
          textoConfirmar="Enviar comando"
          onConfirmar={confirmarComando}
          onCancelar={() => setComandoPendiente(null)}
        />
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

function formatearFecha(ts: number | null): string {
  if (!ts) return "—";
  const diffMs = Date.now() - ts;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "hace instantes";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  return new Date(ts).toLocaleString("es-EC");
}

function estiloEstadoComando(estado: string): React.CSSProperties {
  const color =
    estado === "ejecutado" ? "var(--normal)" : estado === "fallido" ? "var(--alert)" : "var(--warning)";
  return { color, fontSize: 12, fontWeight: 600 };
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: 20,
    overflowY: "auto",
    height: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nombre: { margin: 0, fontSize: 19 },
  modelo: { margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" },
  badgeNormal: {
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 999,
    background: "var(--normal-muted)",
    color: "var(--normal)",
  },
  badgeRobado: {
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 999,
    background: "var(--alert-muted)",
    color: "var(--alert)",
  },
  infoRow: {
    display: "flex",
    gap: 16,
    marginTop: 16,
    flexWrap: "wrap",
  },
  infoItem: { display: "flex", flexDirection: "column", gap: 2 },
  infoLabel: { fontSize: 11, color: "var(--text-muted)" },
  infoValue: { fontSize: 14, fontWeight: 600 },
  botonActivar: {
    marginTop: 18,
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    background: "var(--alert)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  botonDesactivar: {
    marginTop: 18,
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
    fontWeight: 600,
    cursor: "pointer",
  },
  seccionTitulo: { fontSize: 13, color: "var(--text-muted)", marginTop: 22, marginBottom: 8 },
  comandosGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  comandoBtn: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-muted)",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: 13,
  },
  comandoBtnPeligroso: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--alert)",
    background: "var(--alert-muted)",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: 13,
    gridColumn: "1 / -1",
  },
  mensajeForm: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-muted)",
    color: "var(--text)",
    fontSize: 13,
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    background: "var(--bg-muted)",
    border: "1px solid var(--border)",
    fontSize: 12,
  },
  chipRemove: {
    border: "none",
    background: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
  },
  textoMuted: { fontSize: 13, color: "var(--text-muted)" },
  listaChica: { listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 },
  itemChico: { display: "flex", justifyContent: "space-between", fontSize: 13 },
  listaEventos: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 },
  itemEvento: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 13,
    borderBottom: "1px solid var(--border)",
    paddingBottom: 8,
  },
  eventoFecha: { color: "var(--text-muted)", whiteSpace: "nowrap" },
};
