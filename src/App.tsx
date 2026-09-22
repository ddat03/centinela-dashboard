import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

import { auth } from "./firebase/config";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Encontrado from "./pages/Encontrado";

function AreaFamiliar() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <Routes>
      {/* Pública — a la que llega quien escanea el QR de modo perdido/robado.
          No requiere login: usa la conexión de quien encontró el equipo. */}
      <Route path="/encontrado" element={<Encontrado />} />
      <Route path="*" element={<AreaFamiliar />} />
    </Routes>
  );
}
