// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Puntúa un horario ya generado contra las preferencias del
// estudiante (no obligatorias, solo suben o bajan la puntuación). El
// desglose es siempre datos estructurados — nunca texto libre — para que
// el frontend pinte cada ✓/✗ directamente.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import type { Dia, Grupo, Sesion } from "@mi-reticula/shared-types";

export interface Preferencias {
  /** Prefiere que la primera clase del día empiece tarde. */
  entrarTarde?: boolean;
  /** Prefiere que la última clase del día termine temprano. */
  salirTemprano?: boolean;
  /** Prefiere no tener horas libres entre clases el mismo día. */
  sinHuecos?: boolean;
  /** Prefiere no tener clases los viernes. */
  viernesLibre?: boolean;
}

export type CriterioPreferencia = keyof Preferencias;

export interface CriterioPuntuacion {
  criterio: CriterioPreferencia;
  cumplido: boolean;
  detalle: string;
}

export interface ResultadoScoring {
  /** 0-100. Si no se pidió ninguna preferencia, siempre es 100 (nada que incumplir). */
  puntuacion: number;
  desglose: CriterioPuntuacion[];
}

/** Umbrales fijos para "tarde"/"temprano" — documentados aquí porque son la única heurística no derivada de los datos del usuario. */
const HORA_CONSIDERADA_TARDE = "10:00";
const HORA_CONSIDERADA_TEMPRANO = "16:00";

function sesionesPorDia( grupos: Grupo[] ): Map<Dia, Sesion[]> {
  const mapa = new Map<Dia, Sesion[]>();
  for ( const grupo of grupos ) {
    for ( const sesion of grupo.sesiones ) {
      const listaDelDia = mapa.get( sesion.dia ) ?? [];
      listaDelDia.push( sesion );
      mapa.set( sesion.dia, listaDelDia );
    }
  }
  return mapa;
}

function evaluarEntrarTarde( porDia: Map<Dia, Sesion[]> ): CriterioPuntuacion {
  const primerasHoras = [ ...porDia.values() ].map( ( sesiones ) => sesiones.reduce( ( min, s ) => ( s.horaInicio < min ? s.horaInicio : min ), sesiones[0].horaInicio ) );
  const cumplido = primerasHoras.every( ( hora ) => hora >= HORA_CONSIDERADA_TARDE );
  return {
    criterio: "entrarTarde",
    cumplido,
    detalle: cumplido
      ? `Ningún día empieza antes de las ${HORA_CONSIDERADA_TARDE}.`
      : `Hay al menos un día que empieza antes de las ${HORA_CONSIDERADA_TARDE}.`,
  };
}

function evaluarSalirTemprano( porDia: Map<Dia, Sesion[]> ): CriterioPuntuacion {
  const ultimasHoras = [ ...porDia.values() ].map( ( sesiones ) => sesiones.reduce( ( max, s ) => ( s.horaFin > max ? s.horaFin : max ), sesiones[0].horaFin ) );
  const cumplido = ultimasHoras.every( ( hora ) => hora <= HORA_CONSIDERADA_TEMPRANO );
  return {
    criterio: "salirTemprano",
    cumplido,
    detalle: cumplido
      ? `Ningún día termina después de las ${HORA_CONSIDERADA_TEMPRANO}.`
      : `Hay al menos un día que termina después de las ${HORA_CONSIDERADA_TEMPRANO}.`,
  };
}

function evaluarSinHuecos( porDia: Map<Dia, Sesion[]> ): CriterioPuntuacion {
  let tieneHuecos = false;
  for ( const sesiones of porDia.values() ) {
    const ordenadas = [ ...sesiones ].sort( ( a, b ) => ( a.horaInicio < b.horaInicio ? -1 : 1 ) );
    for ( let i = 1; i < ordenadas.length; i++ ) {
      if ( ordenadas[i].horaInicio > ordenadas[i - 1].horaFin ) tieneHuecos = true;
    }
  }
  return {
    criterio: "sinHuecos",
    cumplido: !tieneHuecos,
    detalle: tieneHuecos ? "Hay al menos un hueco entre clases el mismo día." : "No hay huecos entre clases en ningún día.",
  };
}

function evaluarViernesLibre( porDia: Map<Dia, Sesion[]> ): CriterioPuntuacion {
  const cumplido = !porDia.has( "viernes" );
  return {
    criterio: "viernesLibre",
    cumplido,
    detalle: cumplido ? "No hay clases los viernes." : "Hay clases programadas el viernes.",
  };
}

const EVALUADORES: Record<CriterioPreferencia, ( porDia: Map<Dia, Sesion[]> ) => CriterioPuntuacion> = {
  entrarTarde: evaluarEntrarTarde,
  salirTemprano: evaluarSalirTemprano,
  sinHuecos: evaluarSinHuecos,
  viernesLibre: evaluarViernesLibre,
};

export function puntuarHorario( grupos: Grupo[], preferencias: Preferencias ): ResultadoScoring {
  const porDia = sesionesPorDia( grupos );
  const criteriosSolicitados = ( Object.keys( preferencias ) as CriterioPreferencia[] ).filter( ( c ) => preferencias[c] );

  if ( criteriosSolicitados.length === 0 ) {
    return { puntuacion: 100, desglose: [] };
  }

  const desglose = criteriosSolicitados.map( ( criterio ) => EVALUADORES[criterio]( porDia ) );
  const cumplidos = desglose.filter( ( c ) => c.cumplido ).length;
  const puntuacion = Math.round( ( cumplidos / desglose.length ) * 100 );

  return { puntuacion, desglose };
}
