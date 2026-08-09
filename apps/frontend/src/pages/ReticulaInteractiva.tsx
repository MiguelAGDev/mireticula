// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Pantalla 3 del flujo: retícula interactiva. Layout de
// posiciones FIJAS (9 columnas = semestres, cada materia en la fila que
// le corresponde según la retícula oficial ISIC-2010-224/ISIE-TDS-2024-01)
// — la posición nunca cambia al interactuar, solo cambia color/ícono.
// Las flechas de prerrequisito se dibujan desde los requisitos REALES de
// cada materia (no una lista aparte), para que nunca se desincronicen de
// la lógica de bloqueo/desbloqueo. RESIDENCIA y TUTORIA (semestre: null)
// se excluyen — no son materias con grupo/horario.

// Last Update: 2026-08-09
// Description: Flechas en codo (ortogonales, detrás de las tarjetas),
// encabezados en números romanos, más espaciado, colores más saturados,
// hover, y un toggle de dos modos (marcar cursadas / elegir a inscribir).

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerEstadoMaterias } from "../services/api";
import { useAppState } from "../hooks/AppStateContext";
import type { MateriaConEstadoDTO } from "../types/api";

/**
 * Posición fija de cada materia en la retícula: columna = semestre (1-9),
 * fila = posición dentro de esa columna, de arriba hacia abajo, tal como
 * aparece en el documento oficial. Es la ÚNICA fuente de la posición —
 * el estado (aprobada/disponible/bloqueada) nunca la toca.
 */
const POSICION: Record<string, { semestre: number; fila: number }> = {
  A11: { semestre: 1, fila: 0 }, B11: { semestre: 1, fila: 1 }, C11: { semestre: 1, fila: 2 },
  D11: { semestre: 1, fila: 3 }, E11: { semestre: 1, fila: 4 }, F11: { semestre: 1, fila: 5 },

  A12: { semestre: 2, fila: 0 }, B12: { semestre: 2, fila: 1 }, C12: { semestre: 2, fila: 2 },
  D12: { semestre: 2, fila: 3 }, E12: { semestre: 2, fila: 4 }, F12: { semestre: 2, fila: 5 },

  A13: { semestre: 3, fila: 0 }, B13: { semestre: 3, fila: 1 }, C13: { semestre: 3, fila: 2 },
  C14: { semestre: 3, fila: 3 }, D13: { semestre: 3, fila: 4 }, F13: { semestre: 3, fila: 5 },

  A14: { semestre: 4, fila: 0 }, B14: { semestre: 4, fila: 1 }, B15: { semestre: 4, fila: 2 },
  C15: { semestre: 4, fila: 3 }, D16: { semestre: 4, fila: 4 }, F14: { semestre: 4, fila: 5 },

  A15: { semestre: 5, fila: 0 }, E13: { semestre: 5, fila: 1 }, C17: { semestre: 5, fila: 2 },
  F17: { semestre: 5, fila: 3 }, E15: { semestre: 5, fila: 4 }, F15: { semestre: 5, fila: 5 },
  G15: { semestre: 5, fila: 6 },

  A16: { semestre: 6, fila: 0 }, E14: { semestre: 6, fila: 1 }, B16: { semestre: 6, fila: 2 },
  C18: { semestre: 6, fila: 3 }, E16: { semestre: 6, fila: 4 }, F16: { semestre: 6, fila: 5 },
  G16: { semestre: 6, fila: 6 },

  A17: { semestre: 7, fila: 0 }, A18: { semestre: 7, fila: 1 }, B17: { semestre: 7, fila: 2 },
  "11D": { semestre: 7, fila: 3 }, E17: { semestre: 7, fila: 4 }, "21D": { semestre: 7, fila: 5 },

  "31D": { semestre: 8, fila: 0 }, B18: { semestre: 8, fila: 1 }, C16: { semestre: 8, fila: 2 },
  "41D": { semestre: 8, fila: 3 }, E18: { semestre: 8, fila: 4 }, F18: { semestre: 8, fila: 5 },

  "51D": { semestre: 9, fila: 0 }, "61D": { semestre: 9, fila: 1 },
};

const ROMANOS = [ "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX" ];
const NUM_SEMESTRES = 9;
const ANCHO_COLUMNA = 195;
const ALTO_FILA = 118;
const ANCHO_TARJETA = 168;
const ALTO_TARJETA = 96;

type Modo = "cursadas" | "inscribir";

/** Fondo/borde por "área" según el prefijo de la clave — más saturados que la primera versión, a propósito, para que se distingan sobre el fondo casi negro de la página. */
function colorDeArea( clave: string ): string {
  if ( /D$/.test( clave ) ) return "border-purple-500 bg-purple-900";
  switch ( clave[0] ) {
    case "A": return "border-sky-500 bg-sky-900";
    case "B": return "border-amber-500 bg-amber-900";
    case "C": return "border-pink-500 bg-pink-900";
    case "D": return "border-indigo-500 bg-indigo-900";
    case "E": return "border-orange-500 bg-orange-900";
    case "F": return "border-emerald-500 bg-emerald-900";
    case "G": return "border-rose-500 bg-rose-900";
    default: return "border-slate-500 bg-slate-800";
  }
}

function bordeCentro( clave: string ): { x: number; y: number } {
  const pos = POSICION[clave];
  return { x: ( pos.semestre - 1 ) * ANCHO_COLUMNA, y: pos.fila * ALTO_FILA + ALTO_TARJETA / 2 };
}

/** Ruta en codo (ortogonal): sale del borde derecho del origen, tramo horizontal, tramo vertical si cambia de fila, entra por el borde izquierdo del destino. */
function rutaEnCodo( origen: string, destino: string ): string {
  const posOrigen = POSICION[origen];
  const a = { x: ( posOrigen.semestre - 1 ) * ANCHO_COLUMNA + ANCHO_TARJETA, y: bordeCentro( origen ).y };
  const b = bordeCentro( destino );
  const mitad = a.x + ( b.x - a.x ) / 2;
  return `M ${a.x} ${a.y} H ${mitad} V ${b.y} H ${b.x}`;
}

function iconoDeEstado( estado: MateriaConEstadoDTO["estado"] ): string {
  if ( estado === "bloqueada" ) return "🔒";
  return "⚪";
}

interface Flecha {
  origen: string;
  destino: string;
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
  const [ hover, setHover ] = useState<string | null>( null );
  const [ modo, setModo ] = useState<Modo>( "cursadas" );

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

  // Solo materias con posición conocida en la retícula visual (excluye RESIDENCIA/TUTORIA).
  const enLaReticula = useMemo( () => materias.filter( ( m ) => POSICION[m.materia.clave] ), [ materias ] );

  // Flechas: una por cada requisito real de tipo prerrequisito/correquisito cuyo origen tenga posición conocida.
  const flechas = useMemo<Flecha[]>( () => {
    const resultado: Flecha[] = [];
    for ( const info of enLaReticula ) {
      for ( const r of info.requisitos ) {
        if ( r.requisito.tipo !== "prerrequisito" && r.requisito.tipo !== "correquisito" ) continue;
        if ( !POSICION[r.requisito.clave] ) continue;
        resultado.push( { origen: r.requisito.clave, destino: info.materia.clave } );
      }
    }
    return resultado;
  }, [ enLaReticula ] );

  function alHacerClicEnTarjeta( info: MateriaConEstadoDTO ) {
    if ( modo === "cursadas" ) {
      if ( info.estado !== "bloqueada" ) toggleMateriaAprobada( info.materia.clave );
    } else {
      if ( info.estado === "disponible" ) toggleMateriaSeleccionada( info.materia.clave );
    }
  }

  function esClicable( info: MateriaConEstadoDTO ): boolean {
    return modo === "cursadas" ? info.estado !== "bloqueada" : info.estado === "disponible";
  }

  const filasMax = Math.max( ...Object.values( POSICION ).map( ( p ) => p.fila ) ) + 1;
  const anchoTotal = NUM_SEMESTRES * ANCHO_COLUMNA;
  const altoTotal = filasMax * ALTO_FILA;

  const contadorContinuar = modo === "cursadas" ? materiasAprobadas.size : materiasSeleccionadas.size;
  const etiquetaContinuar = modo === "cursadas" ? "aprobadas" : "materias elegidas";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <h1 className="mb-1 text-2xl font-bold">Retícula interactiva</h1>
      <p className="mb-4 text-sm text-slate-400">
        {modo === "cursadas"
          ? "Da click en una materia para marcarla como aprobada. Las que dependían de ella se desbloquean solas."
          : "Da click en las materias disponibles (⚪) que quieres inscribir este semestre. Puedes elegir varias."}
      </p>

      <div className="mb-6 inline-flex rounded-md border border-slate-700 bg-slate-900 p-1">
        <button
          type="button"
          onClick={() => setModo( "cursadas" )}
          className={`rounded px-4 py-1.5 text-sm font-medium transition ${
            modo === "cursadas" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Marcar cursadas
        </button>
        <button
          type="button"
          onClick={() => setModo( "inscribir" )}
          className={`rounded px-4 py-1.5 text-sm font-medium transition ${
            modo === "inscribir" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Elegir a inscribir
        </button>
      </div>

      {cargando && <p className="text-slate-400">Cargando retícula…</p>}
      {error && <p className="text-red-400">No se pudo cargar la retícula: {error}</p>}

      {!cargando && !error && (
        <div className="overflow-x-auto">
          <div style={{ width: anchoTotal }}>
            <div className="mb-2 flex">
              {Array.from( { length: NUM_SEMESTRES }, ( _, i ) => (
                <div key={i} style={{ width: ANCHO_COLUMNA }} className="text-center font-semibold text-slate-300">
                  {ROMANOS[i]}
                </div>
              ) )}
            </div>

            <div className="relative" style={{ width: anchoTotal, height: altoTotal }}>
              <svg className="pointer-events-none absolute inset-0 z-0" width={anchoTotal} height={altoTotal}>
                <defs>
                  <marker id="flecha" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" className="fill-slate-500" />
                  </marker>
                  <marker id="flecha-resaltada" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" className="fill-blue-400" />
                  </marker>
                </defs>
                {flechas.map( ( f, i ) => {
                  const resaltada = hover !== null && ( hover === f.origen || hover === f.destino );
                  return (
                    <path
                      key={i}
                      d={rutaEnCodo( f.origen, f.destino )}
                      fill="none"
                      className={resaltada ? "stroke-blue-400" : "stroke-slate-600"}
                      strokeWidth={resaltada ? 2 : 1}
                      opacity={resaltada ? 1 : 0.35}
                      markerEnd={resaltada ? "url(#flecha-resaltada)" : "url(#flecha)"}
                    />
                  );
                } )}
              </svg>

              {enLaReticula.map( ( info ) => {
                const pos = POSICION[info.materia.clave];
                const requisitoPorcentaje = info.requisitos.find( ( r ) => r.requisito.tipo === "porcentajeCreditos" );
                const motivos = info.requisitos.filter( ( r ) => !r.cumplido ).map( ( r ) => r.motivo ).join( "\n" );
                const seleccionadaParaInscribir = modo === "inscribir" && materiasSeleccionadas.has( info.materia.clave );
                const clicable = esClicable( info );

                return (
                  <div
                    key={info.materia.clave}
                    onClick={clicable ? () => alHacerClicEnTarjeta( info ) : undefined}
                    onMouseEnter={() => setHover( info.materia.clave )}
                    onMouseLeave={() => setHover( null )}
                    title={info.estado === "bloqueada" ? motivos : undefined}
                    className={`absolute z-10 flex flex-col gap-1 overflow-hidden rounded-md border-2 p-2.5 text-[11px] transition-all ${colorDeArea( info.materia.clave )} ${
                      info.estado === "aprobada" ? "ring-2 ring-emerald-400" : ""
                    } ${seleccionadaParaInscribir ? "ring-2 ring-blue-400" : ""} ${
                      clicable
                        ? "cursor-pointer hover:z-20 hover:scale-105 hover:shadow-xl hover:shadow-black/50"
                        : "cursor-help opacity-40"
                    }`}
                    style={{
                      left: ( pos.semestre - 1 ) * ANCHO_COLUMNA,
                      top: pos.fila * ALTO_FILA,
                      width: ANCHO_TARJETA,
                      height: ALTO_TARJETA,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm">{info.estado === "aprobada" ? "✅" : iconoDeEstado( info.estado )}</span>
                      <span className="font-mono text-slate-400">{info.materia.clave}</span>
                      {requisitoPorcentaje && (
                        <span className="rounded bg-slate-950/60 px-1 text-slate-300">
                          {Math.round( requisitoPorcentaje.requisito.tipo === "porcentajeCreditos" ? requisitoPorcentaje.requisito.porcentaje * 100 : 0 )}%
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 leading-tight text-slate-100">{info.materia.nombre}</p>
                  </div>
                );
              } )}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={materiasSeleccionadas.size === 0}
        onClick={() => navigate( "/plan" )}
        className="mt-6 rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continuar ({contadorContinuar} {etiquetaContinuar})
      </button>
    </main>
  );
}

export default ReticulaInteractiva;
