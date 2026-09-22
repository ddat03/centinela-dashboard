import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

type Modo = "perdido" | "robado";

const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_BASE_URL as string;

// Página pública (sin login) a la que llega quien escanea el QR de
// "modo perdido/robado" del equipo. Usa la conexión de quien la abre para
// mandarnos ubicación y una foto — ver claude_centinela-antirrobo-plan.md,
// extensión "modo perdido".
//
// En modo "robado" el texto es deliberadamente un señuelo (transferencia
// pendiente) para que alguien que actuó de mala fe la abra igual, sin
// impersonar ningún banco real ni pedir datos de tarjeta/cuenta — solo
// ubicación y una foto "de verificación".
export default function Encontrado() {
  const [params] = useSearchParams();
  const deviceId = params.get("device") ?? "";
  const token = params.get("token") ?? "";
  const modo: Modo = params.get("modo") === "robado" ? "robado" : "perdido";

  const [foto, setFoto] = useState<File | null>(null);
  const [estado, setEstado] = useState<"inicial" | "enviando" | "enviado" | "error">(
    "inicial",
  );

  async function handleConfirmar() {
    if (!deviceId || !token) {
      setEstado("error");
      return;
    }
    if (!navigator.geolocation) {
      setEstado("error");
      return;
    }

    setEstado("enviando");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const fotoBase64 = foto ? await fileToBase64(foto) : undefined;
          const resp = await fetch(`${FUNCTIONS_BASE_URL}/reportarEncontrado`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deviceId,
              token,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              fotoBase64,
            }),
          });
          setEstado(resp.ok ? "enviado" : "error");
        } catch {
          setEstado("error");
        }
      },
      () => setEstado("error"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  if (estado === "enviado") {
    return (
      <Layout>
        <p style={styles.body}>
          {modo === "robado"
            ? "Listo, tu solicitud quedó registrada. Te contactaremos en breve."
            : "¡Gracias! Le avisamos al dueño de este equipo."}
        </p>
      </Layout>
    );
  }

  return (
    <Layout>
      <p style={styles.body}>
        {modo === "robado"
          ? "Tienes una transferencia pendiente por confirmar."
          : "Encontraste este celular. Ayudanos a que vuelva a su dueño."}
      </p>
      <p style={styles.subtext}>
        {modo === "robado"
          ? "Para procesarla necesitamos confirmar tu ubicación."
          : "Solo necesitamos tu ubicación actual — no vamos a compartir tus datos."}
      </p>

      <label style={styles.fileLabel}>
        {foto ? "Foto lista ✓" : "Tomar una foto (opcional)"}
        <input
          type="file"
          accept="image/*"
          capture="user"
          style={{ display: "none" }}
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
        />
      </label>

      <button
        style={styles.button}
        onClick={handleConfirmar}
        disabled={estado === "enviando"}
      >
        {estado === "enviando" ? "Confirmando..." : "Confirmar mi ubicación"}
      </button>

      {estado === "error" && (
        <p style={styles.error}>
          No pudimos confirmar tu ubicación. Revisa que le diste permiso al
          navegador y volvé a intentar.
        </p>
      )}
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>{children}</div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: 360,
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  body: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    textAlign: "center",
  },
  subtext: {
    fontSize: 14,
    color: "var(--text-muted)",
    margin: 0,
    textAlign: "center",
  },
  fileLabel: {
    textAlign: "center",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--bg-elevated)",
    cursor: "pointer",
    fontSize: 14,
  },
  button: {
    padding: "14px 16px",
    borderRadius: 10,
    border: "none",
    background: "var(--alert)",
    color: "#fff",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
  },
  error: {
    color: "var(--alert)",
    fontSize: 13,
    textAlign: "center",
    margin: 0,
  },
};
