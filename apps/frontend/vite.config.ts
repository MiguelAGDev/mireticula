// Author: MiguelAGDev
// Date: 2026-08-06
// Description: Configuración de Vite para el frontend: plugin de React
// (JSX + Fast Refresh), plugin de Tailwind v4, y el alias "@" -> src/.

// Last Update: 2026-08-06
// Description: Encabezado inicial, espaciado de paréntesis/llaves y
// alineación de imports según la convención de CLAUDE.md.

import path             from "node:path";
import { defineConfig } from "vite";
import react            from "@vitejs/plugin-react";
import tailwindcss      from "@tailwindcss/vite";

// Ver: https://vite.dev/config/
export default defineConfig( {
  plugins: [ react(), tailwindcss() ],
  resolve: {
    alias: {
      "@": path.resolve( __dirname, "./src" ),
    },
  },
} );
