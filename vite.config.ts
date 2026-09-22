import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages sirve esto en https://ddat03.github.io/centinela-dashboard/ —
// en desarrollo local (npm run dev) Vite ignora el base y sigue en "/".
export default defineConfig({
  plugins: [react()],
  base: "/centinela-dashboard/",
});
