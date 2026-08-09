// Author: MiguelAGDev
// Date: 2026-08-08
// Description: POST /api/horarios — genera y puntúa horarios para las
// materias que el estudiante quiere inscribir. Arma el input para
// packages/schedule-engine (parser -> scheduler -> scorer) y devuelve el
// resultado ya ordenado por puntuación; cero lógica de horarios vive
// aquí, solo el cableado HTTP.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import type { Request, Response } from "express";
import type { Grupo } from "@mi-reticula/shared-types";
import {
  generarHorarios,
  puntuarHorario,
  resolverEstadoMaterias,
  type Preferencias,
  type RestriccionesObligatorias,
} from "@mi-reticula/schedule-engine";
import { cargarDatosAcademicos } from "../data/cargarDatos.js";

interface CuerpoSolicitud {
  materiasSeleccionadas?: unknown;
  materiasAprobadas?: unknown;
  restricciones?: RestriccionesObligatorias;
  preferencias?: Preferencias;
  maxResultados?: number;
}

function comoArregloDeClaves( valor: unknown ): string[] | null {
  if ( !Array.isArray( valor ) ) return null;
  if ( !valor.every( ( v ) => typeof v === "string" ) ) return null;
  return valor;
}

export function generarHorariosController( req: Request, res: Response ): void {
  const cuerpo = req.body as CuerpoSolicitud;

  const materiasSeleccionadas = comoArregloDeClaves( cuerpo.materiasSeleccionadas );
  if ( !materiasSeleccionadas || materiasSeleccionadas.length === 0 ) {
    res.status( 400 ).json( { error: "materiasSeleccionadas debe ser un arreglo de claves con al menos un elemento." } );
    return;
  }

  const materiasAprobadas = new Set( comoArregloDeClaves( cuerpo.materiasAprobadas ) ?? [] );

  const { materias, grupos, prerrequisitos } = cargarDatosAcademicos();
  const estadoMaterias = resolverEstadoMaterias( { materias, grupos, prerrequisitos, materiasAprobadas } );
  const estadoPorClave = new Map( estadoMaterias.map( ( e ) => [ e.materia.clave, e ] ) );

  const noDisponibles: string[] = [];
  const seleccion = materiasSeleccionadas.map( ( clave ) => {
    const info = estadoPorClave.get( clave );
    if ( !info || info.estado !== "disponible" ) {
      noDisponibles.push( clave );
      return null;
    }
    return { materiaClave: clave, gruposCandidatos: info.gruposCandidatos };
  } );

  if ( noDisponibles.length > 0 ) {
    res.status( 400 ).json( {
      error: `Estas materias no están disponibles para inscribir: ${noDisponibles.join( ", " )}. Revisa /api/materias para ver por qué (no existen, ya están aprobadas, o tienen requisitos pendientes).`,
    } );
    return;
  }

  const materiasPorClave = new Map( materias.map( ( m ) => [ m.clave, m ] ) );
  const resultado = generarHorarios(
    seleccion as { materiaClave: string; gruposCandidatos: Grupo[] }[],
    materiasPorClave,
    cuerpo.restricciones ?? {},
    { maxResultados: cuerpo.maxResultados },
  );

  if ( resultado.horarios.length === 0 ) {
    res.json( { horarios: [], explicacionSinResultados: resultado.explicacionSinResultados } );
    return;
  }

  const preferencias = cuerpo.preferencias ?? {};
  const horariosConPuntuacion = resultado.horarios
    .map( ( horario ) => ( { ...horario, ...puntuarHorario( horario.grupos, preferencias ) } ) )
    .sort( ( a, b ) => b.puntuacion - a.puntuacion );

  res.json( { horarios: horariosConPuntuacion } );
}
