// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Componente raíz: enruta entre las pantallas del flujo y
// envuelve todo en AppStateProvider (carrera, materias, restricciones,
// preferencias, resultado — compartido entre pantallas).

// Last Update: 2026-08-08
// Description: Se agregó react-router-dom con las 6 rutas del flujo
// (Fase 3): Inicio, Selección de carrera, Retícula, Restricciones,
// Resultados. Feedback vive dentro de Resultados, no es ruta aparte.

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppStateProvider } from "./hooks/AppStateContext";
import Inicio from "./pages/Inicio";
import SeleccionCarrera from "./pages/SeleccionCarrera";
import ReticulaInteractiva from "./pages/ReticulaInteractiva";
import Restricciones from "./pages/Restricciones";
import Resultados from "./pages/Resultados";

function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/carrera" element={<SeleccionCarrera />} />
          <Route path="/reticula" element={<ReticulaInteractiva />} />
          <Route path="/restricciones" element={<Restricciones />} />
          <Route path="/resultados" element={<Resultados />} />
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}

export default App;
