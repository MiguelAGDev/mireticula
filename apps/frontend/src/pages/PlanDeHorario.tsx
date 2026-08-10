// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Pantallas 4-7 del flujo, fusionadas en UNA sola vista (sin
// navegación entre "configurar" y "ver resultados"): columna izquierda =
// restricciones obligatorias + preferencias, columna derecha = horarios
// generados (cuadrícula semanal, puntuación, desglose, feedback). El
// botón "Generar" dispara POST /api/horarios y actualiza la derecha sin
// cambiar de URL.

// Last Update: 2026-08-09
// Description: Proporción de columnas cambiada de 50/50 a 30/70
// (restricciones/resultados) — las cuadrículas semanales necesitan más
// espacio horizontal, es el contenido que el usuario realmente compara.

import { useMemo, useState } from "react";
import CuadriculaSemanal from "../components/CuadriculaSemanal";
import FeedbackHorario from "../components/FeedbackHorario";
import { generarHorarios } from "../services/api";
import { useAppState } from "../hooks/AppStateContext";

/** "aguirre-mejia-elena" -> "Aguirre Mejia Elena" — no tenemos el nombre real del profesor en el frontend (solo el id-slug), así que se muestra una versión legible del id. */
function nombreLegible( profesorId: string ): string {
  return profesorId.split( "-" ).map( ( p ) => p[0]?.toUpperCase() + p.slice( 1 ) ).join( " " );
}

function PanelRestricciones() {
  const {
    materiasSeleccionadas,
    materiasAprobadas,
    materiasInfo,
    restricciones,
    setRestricciones,
    preferencias,
    setPreferencias,
    resultado,
    setResultado,
  } = useAppState();
  const [ enviando, setEnviando ] = useState( false );
  const [ error, setError ] = useState<string | null>( null );

  const profesoresDisponibles = useMemo( () => {
    const ids = new Set<string>();
    for ( const info of materiasInfo ) {
      if ( !materiasSeleccionadas.has( info.materia.clave ) ) continue;
      for ( const grupo of info.gruposCandidatos ) {
        if ( grupo.profesorId ) ids.add( grupo.profesorId );
      }
    }
    return [ ...ids ].sort();
  }, [ materiasInfo, materiasSeleccionadas ] );

  function toggleProfesorAEvitar( profesorId: string ) {
    const actuales = new Set( restricciones.profesoresAEvitar ?? [] );
    if ( actuales.has( profesorId ) ) actuales.delete( profesorId );
    else actuales.add( profesorId );
    setRestricciones( { ...restricciones, profesoresAEvitar: [ ...actuales ] } );
  }

  async function generar() {
    setEnviando( true );
    setError( null );
    try {
      const nuevoResultado = await generarHorarios( {
        materiasSeleccionadas: [ ...materiasSeleccionadas ],
        materiasAprobadas: [ ...materiasAprobadas ],
        restricciones,
        preferencias,
      } );
      setResultado( nuevoResultado );
    } catch ( err ) {
      setError( ( err as Error ).message );
    } finally {
      setEnviando( false );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Restricciones y preferencias</h1>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-slate-300">Obligatorias (eliminan horarios que las rompan)</h2>

        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Créditos mínimos
            <input
              type="number"
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
              value={restricciones.creditosMin ?? ""}
              onChange={( e ) => setRestricciones( { ...restricciones, creditosMin: e.target.value ? Number( e.target.value ) : undefined } )}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Créditos máximos
            <input
              type="number"
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
              value={restricciones.creditosMax ?? ""}
              onChange={( e ) => setRestricciones( { ...restricciones, creditosMax: e.target.value ? Number( e.target.value ) : undefined } )}
            />
          </label>
        </div>

        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Hora de entrada mínima
            <input
              type="time"
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
              value={restricciones.horaEntradaMin ?? ""}
              onChange={( e ) => setRestricciones( { ...restricciones, horaEntradaMin: e.target.value || undefined } )}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Hora de salida máxima
            <input
              type="time"
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
              value={restricciones.horaSalidaMax ?? ""}
              onChange={( e ) => setRestricciones( { ...restricciones, horaSalidaMax: e.target.value || undefined } )}
            />
          </label>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          Profesores a evitar
          {profesoresDisponibles.length === 0 && <p className="text-slate-500">No hay profesores para las materias elegidas todavía.</p>}
          <div className="flex flex-wrap gap-2">
            {profesoresDisponibles.map( ( id ) => (
              <label key={id} className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1">
                <input
                  type="checkbox"
                  checked={( restricciones.profesoresAEvitar ?? [] ).includes( id )}
                  onChange={() => toggleProfesorAEvitar( id )}
                />
                {nombreLegible( id )}
              </label>
            ) )}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-slate-300">Preferencias (solo suben o bajan la puntuación)</h2>
        {( [
          [ "entrarTarde", "Entrar tarde" ],
          [ "salirTemprano", "Salir temprano" ],
          [ "sinHuecos", "Sin huecos entre clases" ],
          [ "viernesLibre", "Viernes libre" ],
        ] as const ).map( ( [ clave, etiqueta ] ) => (
          <label key={clave} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean( preferencias[clave] )}
              onChange={( e ) => setPreferencias( { ...preferencias, [clave]: e.target.checked } )}
            />
            {etiqueta}
          </label>
        ) )}
      </section>

      {error && <p className="text-red-400">{error}</p>}

      <button
        type="button"
        disabled={enviando || materiasSeleccionadas.size === 0}
        onClick={generar}
        className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {enviando ? "Generando…" : resultado ? "Regenerar horarios" : "Generar horarios"}
      </button>
    </div>
  );
}

function PanelResultados() {
  const { resultado, materiasInfo } = useAppState();

  const nombresPorClave = useMemo(
    () => new Map( materiasInfo.map( ( m ) => [ m.materia.clave, m.materia.nombre ] ) ),
    [ materiasInfo ],
  );

  if ( !resultado ) {
    return <p className="text-slate-500">Configura las restricciones y da click en "Generar horarios" para ver resultados aquí.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Resultados</h2>

      {resultado.horarios.length === 0 && (
        <div className="rounded-md border border-amber-700 bg-amber-950 p-4">
          <p className="font-medium">No se encontró ningún horario válido.</p>
          <p className="text-sm text-slate-300">{resultado.explicacionSinResultados}</p>
        </div>
      )}

      {resultado.horarios.map( ( horario, i ) => (
        <div key={i} className="flex flex-col gap-3 rounded-md border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Opción {i + 1}</h3>
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
    </div>
  );
}

function PlanDeHorario() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto grid max-w-6xl grid-cols-[3fr_7fr] gap-10">
        <PanelRestricciones />
        <PanelResultados />
      </div>
    </main>
  );
}

export default PlanDeHorario;
