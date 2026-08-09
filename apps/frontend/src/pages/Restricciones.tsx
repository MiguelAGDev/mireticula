// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Pantalla 4 del flujo: restricciones obligatorias (créditos
// min/max, hora entrada/salida, profesores a evitar) y preferencias
// (entrar tarde, salir temprano, sin huecos, viernes libre). Al enviar,
// llama a POST /api/horarios y guarda el resultado en el estado
// compartido antes de navegar a Resultados.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generarHorarios } from "../services/api";
import { useAppState } from "../hooks/AppStateContext";

/** "aguirre-mejia-elena" -> "Aguirre Mejia Elena" — no tenemos el nombre real del profesor en el frontend (solo el id-slug), así que se muestra una versión legible del id. */
function nombreLegible( profesorId: string ): string {
  return profesorId.split( "-" ).map( ( p ) => p[0]?.toUpperCase() + p.slice( 1 ) ).join( " " );
}

function Restricciones() {
  const { materiasSeleccionadas, materiasAprobadas, materiasInfo, restricciones, setRestricciones, preferencias, setPreferencias, setResultado } = useAppState();
  const navigate = useNavigate();
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
      const resultado = await generarHorarios( {
        materiasSeleccionadas: [ ...materiasSeleccionadas ],
        materiasAprobadas: [ ...materiasAprobadas ],
        restricciones,
        preferencias,
      } );
      setResultado( resultado );
      navigate( "/resultados" );
    } catch ( err ) {
      setError( ( err as Error ).message );
    } finally {
      setEnviando( false );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 bg-slate-950 px-6 py-12 text-slate-100">
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
        {enviando ? "Generando…" : "Generar horarios"}
      </button>
    </main>
  );
}

export default Restricciones;
