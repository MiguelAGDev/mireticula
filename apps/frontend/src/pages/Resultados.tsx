// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Pantalla 6 del flujo: los horarios generados, cada uno
// con su cuadrícula semanal, puntuación y desglose de por qué obtuvo esa
// puntuación (✓/✗ estructurado, ver packages/schedule-engine/src/scorer).
// Si no hubo resultados, explica la causa en vez de solo mostrar vacío —
// el "modo de explicación" del proyecto.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CuadriculaSemanal from "../components/CuadriculaSemanal";
import FeedbackHorario from "../components/FeedbackHorario";
import { useAppState } from "../hooks/AppStateContext";

function Resultados() {
  const { resultado, materiasInfo } = useAppState();
  const navigate = useNavigate();

  useEffect( () => {
    if ( !resultado ) navigate( "/restricciones" );
  }, [ resultado, navigate ] );

  const nombresPorClave = useMemo(
    () => new Map( materiasInfo.map( ( m ) => [ m.materia.clave, m.materia.nombre ] ) ),
    [ materiasInfo ],
  );

  if ( !resultado ) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-slate-950 px-6 py-12 text-slate-100">
      <h1 className="text-2xl font-bold">Resultados</h1>

      {resultado.horarios.length === 0 && (
        <div className="rounded-md border border-amber-700 bg-amber-950 p-4">
          <p className="font-medium">No se encontró ningún horario válido.</p>
          <p className="text-sm text-slate-300">{resultado.explicacionSinResultados}</p>
        </div>
      )}

      {resultado.horarios.map( ( horario, i ) => (
        <div key={i} className="flex flex-col gap-3 rounded-md border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Opción {i + 1}</h2>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>{horario.creditosTotales} créditos</span>
              <span className="rounded-full bg-blue-950 px-3 py-1 font-semibold text-blue-300">
                {horario.puntuacion} pts
              </span>
            </div>
          </div>

          <CuadriculaSemanal grupos={horario.grupos} nombresPorClave={nombresPorClave} />

          {horario.desglose.length > 0 && (
            <ul className="flex flex-wrap gap-3 text-sm">
              {horario.desglose.map( ( criterio ) => (
                <li key={criterio.criterio} title={criterio.detalle}>
                  {criterio.cumplido ? "✅" : "❌"} {criterio.criterio}
                </li>
              ) )}
            </ul>
          )}

          <FeedbackHorario />
        </div>
      ) )}
    </main>
  );
}

export default Resultados;
