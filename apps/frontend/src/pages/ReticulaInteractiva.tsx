// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Pantalla 3 del flujo: retícula interactiva, con layout de
// 8 columnas (semestres I-VIII) parecido a la retícula oficial que
// compartió el usuario. Click en una tarjeta marca/desmarca "aprobada";
// las materias "disponible" traen además un checkbox para elegirlas como
// las que se quieren inscribir este semestre (alimenta la Fase de
// Restricciones/Generación). RESIDENCIA y TUTORIA se excluyen a
// propósito (semestre: null) — no son materias de la retícula visual.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerEstadoMaterias } from "../services/api";
import { useAppState } from "../hooks/AppStateContext";
import type { MateriaConEstadoDTO } from "../types/api";

const NUMERO_ROMANO = [ "I", "II", "III", "IV", "V", "VI", "VII", "VIII" ];

/** Color por "área" según el prefijo de la clave — aproximado al código de colores de la retícula oficial, no es una copia exacta de la paleta. */
function colorDeArea( clave: string ): string {
  if ( /D$/.test( clave ) ) return "border-purple-700 bg-purple-950";
  switch ( clave[0] ) {
    case "A":
      return "border-sky-700 bg-sky-950";
    case "B":
      return "border-amber-700 bg-amber-950";
    case "C":
      return "border-pink-700 bg-pink-950";
    case "D":
      return "border-indigo-700 bg-indigo-950";
    case "E":
      return "border-orange-700 bg-orange-950";
    case "F":
      return "border-emerald-700 bg-emerald-950";
    case "G":
      return "border-rose-700 bg-rose-950";
    default:
      return "border-slate-700 bg-slate-900";
  }
}

function iconoDeEstado( estado: MateriaConEstadoDTO["estado"] ): string {
  if ( estado === "aprobada" ) return "🟢";
  if ( estado === "bloqueada" ) return "🔒";
  return "⚪";
}

interface TarjetaMateriaProps {
  info: MateriaConEstadoDTO;
  seleccionada: boolean;
  onToggleAprobada: () => void;
  onToggleSeleccionada: () => void;
}

function TarjetaMateria( { info, seleccionada, onToggleAprobada, onToggleSeleccionada }: TarjetaMateriaProps ) {
  const { materia, estado, requisitos } = info;
  const motivos = requisitos.filter( ( r ) => !r.cumplido ).map( ( r ) => r.motivo ).join( "\n" );

  return (
    <div
      onClick={estado !== "bloqueada" ? onToggleAprobada : undefined}
      title={estado === "bloqueada" ? motivos : undefined}
      className={`flex flex-col gap-1 rounded-md border p-2 text-xs ${colorDeArea( materia.clave )} ${
        estado === "bloqueada" ? "cursor-help opacity-50" : "cursor-pointer hover:brightness-125"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span>{iconoDeEstado( estado )}</span>
        <span className="font-mono text-slate-400">{materia.clave}</span>
      </div>
      <p className="font-medium leading-tight text-slate-100">{materia.nombre}</p>
      <p className="text-slate-400">{materia.creditos ?? "—"} créditos</p>

      {estado === "disponible" && (
        <label
          className="mt-1 flex items-center gap-1 text-slate-300"
          onClick={( e ) => e.stopPropagation()}
        >
          <input type="checkbox" checked={seleccionada} onChange={onToggleSeleccionada} />
          Inscribir
        </label>
      )}
    </div>
  );
}

function ReticulaInteractiva() {
  const {
    carreraId,
    materiasAprobadas,
    toggleMateriaAprobada,
    materiasSeleccionadas,
    toggleMateriaSeleccionada,
    setMateriasInfo,
  } = useAppState();
  const navigate = useNavigate();

  const [ materias, setMaterias ] = useState<MateriaConEstadoDTO[]>( [] );
  const [ cargando, setCargando ] = useState( true );
  const [ error, setError ] = useState<string | null>( null );

  useEffect( () => {
    if ( !carreraId ) {
      navigate( "/carrera" );
      return;
    }
    setCargando( true );
    obtenerEstadoMaterias( carreraId, [ ...materiasAprobadas ] )
      .then( ( respuesta ) => {
        setMaterias( respuesta.materias );
        setMateriasInfo( respuesta.materias );
      } )
      .catch( ( err: Error ) => setError( err.message ) )
      .finally( () => setCargando( false ) );
  }, [ carreraId, materiasAprobadas, navigate, setMateriasInfo ] );

  // RESIDENCIA/TUTORIA (semestre: null) no se muestran en la retícula visual.
  const columnas = NUMERO_ROMANO.map( ( _, i ) => materias.filter( ( m ) => m.materia.semestre === i + 1 ) );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <h1 className="mb-1 text-2xl font-bold">Retícula interactiva</h1>
      <p className="mb-4 text-sm text-slate-400">
        Da click en una materia para marcarla como aprobada. Las materias disponibles se desbloquean solas al
        aprobar sus requisitos.
      </p>

      {cargando && <p className="text-slate-400">Cargando retícula…</p>}
      {error && <p className="text-red-400">No se pudo cargar la retícula: {error}</p>}

      {!cargando && !error && (
        <div className="overflow-x-auto">
          <div className="grid min-w-[1100px] grid-cols-8 gap-3">
            {NUMERO_ROMANO.map( ( romano, i ) => (
              <div key={romano} className="flex flex-col gap-2">
                <h2 className="text-center font-semibold text-slate-300">{romano}</h2>
                {columnas[i].map( ( info ) => (
                  <TarjetaMateria
                    key={info.materia.clave}
                    info={info}
                    seleccionada={materiasSeleccionadas.has( info.materia.clave )}
                    onToggleAprobada={() => toggleMateriaAprobada( info.materia.clave )}
                    onToggleSeleccionada={() => toggleMateriaSeleccionada( info.materia.clave )}
                  />
                ) )}
              </div>
            ) )}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={materiasSeleccionadas.size === 0}
        onClick={() => navigate( "/restricciones" )}
        className="mt-6 rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continuar ({materiasSeleccionadas.size} materias elegidas)
      </button>
    </main>
  );
}

export default ReticulaInteractiva;
