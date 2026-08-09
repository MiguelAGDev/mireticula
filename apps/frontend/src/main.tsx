// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Punto de arranque de React. Toma el <div id="root"> de
// index.html y monta ahí el árbol de componentes, empezando por <App />.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot( document.getElementById( "root" )! ).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
