// Author: MiguelAGDev
// Date: 2026-08-08
// Description: GET /api/materias — retícula interactiva: estado de cada
// materia de la carrera (aprobada/disponible/bloqueada) contra las
// materias que el estudiante ya marcó como aprobadas. Delega el cálculo
// a packages/schedule-engine; aquí solo se arma el input y se responde.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import type { Request, Response } from "express";
import { resolverEstadoMaterias } from "@mi-reticula/schedule-engine";
import { cargarDatosAcademicos } from "../data/cargarDatos.js";

function parseAprobadas( query: Request["query"] ): Set<string> {
  const valor = query.aprobadas;
  if ( typeof valor !== "string" || valor.trim() === "" ) return new Set();
  return new Set( valor.split( "," ).map( ( clave ) => clave.trim() ).filter( Boolean ) );
}

export function listarEstadoMaterias( req: Request, res: Response ): void {
  const { carreras, materias, grupos, prerrequisitos } = cargarDatosAcademicos();

  const carreraId = typeof req.query.carreraId === "string" ? req.query.carreraId : carreras[0]?.id;
  const carrera = carreras.find( ( c ) => c.id === carreraId );
  if ( !carrera ) {
    res.status( 404 ).json( { error: `No existe la carrera "${carreraId}".` } );
    return;
  }

  const materiasDeLaCarrera = materias.filter( ( m ) => carrera.materias.includes( m.clave ) );
  const materiasAprobadas = parseAprobadas( req.query );

  const estado = resolverEstadoMaterias( { materias: materiasDeLaCarrera, grupos, prerrequisitos, materiasAprobadas } );
  res.json( { carreraId: carrera.id, materias: estado } );
}
