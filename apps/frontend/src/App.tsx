// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Componente raíz: enruta entre las pantallas del flujo y
// envuelve todo en AppStateProvider (carrera, materias, restricciones,
// preferencias, resultado — compartido entre pantallas).

// Last Update: 2026-08-08
// Description: Restricciones y Resultados se fusionaron en /plan (una
// sola vista, dos columnas) — ya no son rutas separadas.

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppStateProvider } from "./hooks/AppStateContext";
import Inicio from "./pages/Inicio";
import SeleccionCarrera from "./pages/SeleccionCarrera";
import ReticulaInteractiva from "./pages/ReticulaInteractiva";
import PlanDeHorario from "./pages/PlanDeHorario";

function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/carrera" element={<SeleccionCarrera />} />
          <Route path="/reticula" element={<ReticulaInteractiva />} />
          <Route path="/plan" element={<PlanDeHorario />} />
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}

export default App;
