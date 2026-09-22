import { signOut } from "firebase/auth";
import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";

import { auth } from "../firebase/config";

const QUITO: [number, number] = [-0.1807, -78.4678];

// Placeholder — el mapa en tiempo real con dispositivos, panel por
// dispositivo y comandos remotos se implementan en el Prompt 7 del plan.
export default function Dashboard() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Centinela</h1>
        <button style={styles.signOut} onClick={() => signOut(auth)}>
          Cerrar sesión
        </button>
      </header>

      <div style={styles.mapWrap}>
        <MapContainer
          center={QUITO}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>

      <p className="firma">Creado por Diego Aleman</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
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
  mapWrap: {
    flex: 1,
    minHeight: 400,
  },
};
