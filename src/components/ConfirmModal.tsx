import React from "react";

interface ConfirmModalProps {
  titulo: string;
  mensaje: string;
  advertencia?: string;
  textoConfirmar?: string;
  peligroso?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ConfirmModal({
  titulo,
  mensaje,
  advertencia,
  textoConfirmar = "Confirmar",
  peligroso = true,
  onConfirmar,
  onCancelar,
}: ConfirmModalProps) {
  return (
    <div style={styles.overlay} onClick={onCancelar}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.titulo}>{titulo}</h3>
        <p style={styles.mensaje}>{mensaje}</p>

        {advertencia && (
          <div style={styles.advertencia}>
            <strong>⚠️ Aviso legal:</strong> {advertencia}
          </div>
        )}

        <div style={styles.botones}>
          <button style={styles.cancelar} onClick={onCancelar}>
            Cancelar
          </button>
          <button
            style={peligroso ? styles.confirmarPeligroso : styles.confirmar}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    // Leaflet usa z-index hasta ~1000 en sus paneles/controles internos —
    // este modal tiene que quedar siempre por encima del mapa.
    zIndex: 2000,
  },
  card: {
    width: 380,
    maxWidth: "100%",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 24,
  },
  titulo: {
    margin: "0 0 8px",
    fontSize: 17,
  },
  mensaje: {
    margin: 0,
    fontSize: 14,
    color: "var(--text-muted)",
    lineHeight: 1.5,
  },
  advertencia: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    background: "var(--alert-muted)",
    border: "1px solid var(--alert)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  botones: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  cancelar: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
    cursor: "pointer",
  },
  confirmar: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "var(--normal)",
    color: "#04150a",
    fontWeight: 600,
    cursor: "pointer",
  },
  confirmarPeligroso: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "var(--alert)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
};
