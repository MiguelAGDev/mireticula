// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Cuadrícula semanal (lunes-viernes) de un horario: cada
// sesión se posiciona verticalmente según su hora real. Reutilizable
// entre resultados — no depende de ninguna pantalla en particular.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import type { Dia, Grupo } from "@mi-reticula/shared-types";

const DIAS: Dia[] = [ "lunes", "martes", "miercoles", "jueves", "viernes" ];
const ETIQUETA_DIA: Record<Dia, string> = { lunes: "Lun", martes: "Mar", miercoles: "Mié", jueves: "Jue", viernes: "Vie" };
const PX_POR_MINUTO = 1;

function minutosDesdeMedianoche( horaHHMM: string ): number {
  const [ horas, minutos ] = horaHHMM.split( ":" ).map( Number );
  return horas * 60 + minutos;
}

interface BloqueSesion {
  dia: Dia;
  horaInicio: string;
  horaFin: string;
  materiaClave: string;
  grupo: string;
  aula: string;
}

interface CuadriculaSemanalProps {
  grupos: Grupo[];
  nombresPorClave: Map<string, string>;
}

function CuadriculaSemanal( { grupos, nombresPorClave }: CuadriculaSemanalProps ) {
  const bloques: BloqueSesion[] = grupos.flatMap( ( grupo ) =>
    grupo.sesiones.map( ( sesion ) => ( {
      dia: sesion.dia,
      horaInicio: sesion.horaInicio,
      horaFin: sesion.horaFin,
      materiaClave: grupo.materiaClave,
      grupo: grupo.grupo,
      aula: sesion.aula,
    } ) ),
  );

  if ( bloques.length === 0 ) {
    return <p className="text-sm text-slate-500">Este horario no tiene sesiones.</p>;
  }

  const inicioRango = Math.floor( Math.min( ...bloques.map( ( b ) => minutosDesdeMedianoche( b.horaInicio ) ) ) / 60 ) * 60;
  const finRango = Math.ceil( Math.max( ...bloques.map( ( b ) => minutosDesdeMedianoche( b.horaFin ) ) ) / 60 ) * 60;
  const alturaTotal = ( finRango - inicioRango ) * PX_POR_MINUTO;
  const horas = Array.from( { length: ( finRango - inicioRango ) / 60 + 1 }, ( _, i ) => inicioRango + i * 60 );

  return (
    <div className="flex text-xs">
      <div className="relative w-12 shrink-0" style={{ height: alturaTotal }}>
        {horas.map( ( minutoDelDia ) => (
          <span
            key={minutoDelDia}
            className="absolute right-1 -translate-y-1/2 text-slate-500"
            style={{ top: ( minutoDelDia - inicioRango ) * PX_POR_MINUTO }}
          >
            {String( Math.floor( minutoDelDia / 60 ) ).padStart( 2, "0" )}:00
          </span>
        ) )}
      </div>

      <div className="grid flex-1 grid-cols-5 gap-1">
        {DIAS.map( ( dia ) => (
          <div key={dia} className="flex flex-col">
            <div className="mb-1 text-center font-semibold text-slate-400">{ETIQUETA_DIA[dia]}</div>
            <div className="relative rounded-md bg-slate-900" style={{ height: alturaTotal }}>
              {bloques
                .filter( ( b ) => b.dia === dia )
                .map( ( b, i ) => (
                  <div
                    key={`${b.materiaClave}-${b.grupo}-${i}`}
                    className="absolute inset-x-0 overflow-hidden rounded-sm border border-blue-700 bg-blue-950 px-1 py-0.5 leading-tight"
                    style={{
                      top: ( minutosDesdeMedianoche( b.horaInicio ) - inicioRango ) * PX_POR_MINUTO,
                      height: ( minutosDesdeMedianoche( b.horaFin ) - minutosDesdeMedianoche( b.horaInicio ) ) * PX_POR_MINUTO,
                    }}
                  >
                    <p className="truncate font-medium">{nombresPorClave.get( b.materiaClave ) ?? b.materiaClave}</p>
                    <p className="truncate text-slate-400">
                      {b.grupo} · {b.aula}
                    </p>
                  </div>
                ) )}
            </div>
          </div>
        ) )}
      </div>
    </div>
  );
}

export default CuadriculaSemanal;
