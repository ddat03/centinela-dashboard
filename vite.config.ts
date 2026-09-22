import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "/centinela/" cuando se decida el nombre del repo de GitHub Pages
// (Prompt 7 del plan) — se deja "/" mientras tanto para desarrollo local.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
