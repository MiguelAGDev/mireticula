// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Pantalla 2 del flujo: elegir carrera. v1.0 solo tiene ISC
// en el catálogo, pero la pantalla ya está armada para más de una.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Carrera } from "@mi-reticula/shared-types";
import { obtenerCarreras } from "../services/api";
import { useAppState } from "../hooks/AppStateContext";

function SeleccionCarrera() {
  const [ carreras, setCarreras ] = useState<Carrera[]>( [] );
  const [ cargando, setCargando ] = useState( true );
  const [ error, setError ] = useState<string | null>( null );
  const { carreraId, setCarreraId } = useAppState();
  const navigate = useNavigate();

  useEffect( () => {
    obtenerCarreras()
      .then( ( respuesta ) => setCarreras( respuesta.carreras ) )
      .catch( ( err: Error ) => setError( err.message ) )
      .finally( () => setCargando( false ) );
  }, [] );

  function continuar() {
    if ( !carreraId ) return;
    navigate( "/reticula" );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 py-16 text-slate-100">
      <h1 className="text-3xl font-bold">Selecciona tu carrera</h1>

      {cargando && <p className="text-slate-400">Cargando carreras…</p>}
      {error && <p className="text-red-400">No se pudo cargar el catálogo de carreras: {error}</p>}

      <div className="flex w-full max-w-md flex-col gap-3">
        {carreras.map( ( carrera ) => (
          <button
            key={carrera.id}
            type="button"
            onClick={() => setCarreraId( carrera.id )}
            className={`rounded-md border px-4 py-3 text-left transition ${
              carreraId === carrera.id
                ? "border-blue-500 bg-blue-950"
                : "border-slate-700 bg-slate-900 hover:border-slate-500"
            }`}
          >
            {carrera.nombre}
          </button>
        ) )}
      </div>

      <button
        type="button"
        disabled={!carreraId}
        onClick={continuar}
        className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continuar
      </button>
    </main>
  );
}

export default SeleccionCarrera;
