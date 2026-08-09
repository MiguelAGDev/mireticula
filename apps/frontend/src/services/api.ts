// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Cliente HTTP hacia apps/backend. Funciones delgadas: arman
// la URL/body y devuelven el JSON ya tipado — sin lógica de negocio.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import type {
  CarrerasResponse,
  MateriasResponse,
  Preferencias,
  ResultadoHorariosDTO,
  RestriccionesObligatorias,
} from "../types/api";

async function solicitar<T>( ruta: string, opciones?: RequestInit ): Promise<T> {
  const respuesta = await fetch( `/api${ruta}`, opciones );
  const cuerpo = await respuesta.json();
  if ( !respuesta.ok ) {
    throw new Error( cuerpo.error ?? `Error ${respuesta.status} al llamar ${ruta}` );
  }
  return cuerpo as T;
}

export function obtenerCarreras(): Promise<CarrerasResponse> {
  return solicitar<CarrerasResponse>( "/carreras" );
}

export function obtenerEstadoMaterias( carreraId: string, materiasAprobadas: string[] ): Promise<MateriasResponse> {
  const params = new URLSearchParams( { carreraId, aprobadas: materiasAprobadas.join( "," ) } );
  return solicitar<MateriasResponse>( `/materias?${params}` );
}

export interface GenerarHorariosInput {
  materiasSeleccionadas: string[];
  materiasAprobadas: string[];
  restricciones?: RestriccionesObligatorias;
  preferencias?: Preferencias;
}

export function generarHorarios( input: GenerarHorariosInput ): Promise<ResultadoHorariosDTO> {
  return solicitar<ResultadoHorariosDTO>( "/horarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify( input ),
  } );
}
