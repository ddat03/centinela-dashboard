import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import type { Dispositivo } from "../types";

const QUITO: [number, number] = [-0.1807, -78.4678];

function icono(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #0b0e13;box-shadow:0 0 0 2px ${color}66;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const ICONO_NORMAL = icono("#2ecc71");
const ICONO_ROBADO = icono("#e63946");

interface Props {
  dispositivos: Dispositivo[];
  ubicaciones: Record<string, { lat: number; lng: number } | null>;
  seleccionadoId: string | null;
  onSeleccionar: (id: string) => void;
}

export default function MapaDispositivos({
  dispositivos,
  ubicaciones,
  seleccionadoId,
  onSeleccionar,
}: Props) {
  const conUbicacion = dispositivos.filter((d) => ubicaciones[d.id]);
  const centro: [number, number] = conUbicacion.length
    ? [ubicaciones[conUbicacion[0].id]!.lat, ubicaciones[conUbicacion[0].id]!.lng]
    : QUITO;

  return (
    <MapContainer center={centro} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {dispositivos.map((d) => {
        const ubicacion = ubicaciones[d.id];
        if (!ubicacion) return null;
        return (
          <Marker
            key={d.id}
            position={[ubicacion.lat, ubicacion.lng]}
            icon={d.modo_robado ? ICONO_ROBADO : ICONO_NORMAL}
            eventHandlers={{ click: () => onSeleccionar(d.id) }}
            opacity={seleccionadoId && seleccionadoId !== d.id ? 0.5 : 1}
          >
            <Popup>
              <strong>{d.nombre}</strong>
              <br />
              {d.modo_robado ? "🔴 Modo robado activo" : "🟢 Normal"}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
