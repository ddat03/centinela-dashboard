import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App";
import "./styles.css";

// HashRouter (no BrowserRouter) porque esto se sirve desde GitHub Pages:
// el link del QR (/encontrado?...) tiene que resolver sin configuración de
// servidor — con rutas normales, GitHub Pages devuelve 404 en un refresh o
// al entrar directo a una ruta que no sea la raíz.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
