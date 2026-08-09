// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Estado compartido entre pantallas del flujo (carrera
// elegida, materias aprobadas/seleccionadas, restricciones, preferencias,
// resultado de horarios). Es un Context + useState simple a propósito —
// la app es chica, no justifica una librería de estado aparte.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { MateriaConEstadoDTO, Preferencias, ResultadoHorariosDTO, RestriccionesObligatorias } from "../types/api";

interface AppState {
  carreraId: string | null;
  setCarreraId: ( id: string ) => void;

  materiasAprobadas: Set<string>;
  toggleMateriaAprobada: ( clave: string ) => void;

  materiasSeleccionadas: Set<string>;
  toggleMateriaSeleccionada: ( clave: string ) => void;

  /** Última respuesta de GET /api/materias — la retícula la deja aquí para que Restricciones pueda armar la lista de profesores sin volver a pedirla. */
  materiasInfo: MateriaConEstadoDTO[];
  setMateriasInfo: ( m: MateriaConEstadoDTO[] ) => void;

  restricciones: RestriccionesObligatorias;
  setRestricciones: ( r: RestriccionesObligatorias ) => void;

  preferencias: Preferencias;
  setPreferencias: ( p: Preferencias ) => void;

  resultado: ResultadoHorariosDTO | null;
  setResultado: ( r: ResultadoHorariosDTO | null ) => void;
}

const AppStateContext = createContext<AppState | null>( null );

function alternarEnSet( set: Set<string>, clave: string ): Set<string> {
  const copia = new Set( set );
  if ( copia.has( clave ) ) copia.delete( clave );
  else copia.add( clave );
  return copia;
}

export function AppStateProvider( { children }: { children: ReactNode } ) {
  const [ carreraId, setCarreraId ] = useState<string | null>( null );
  const [ materiasAprobadas, setMateriasAprobadas ] = useState<Set<string>>( new Set() );
  const [ materiasSeleccionadas, setMateriasSeleccionadas ] = useState<Set<string>>( new Set() );
  const [ materiasInfo, setMateriasInfo ] = useState<MateriaConEstadoDTO[]>( [] );
  const [ restricciones, setRestricciones ] = useState<RestriccionesObligatorias>( {} );
  const [ preferencias, setPreferencias ] = useState<Preferencias>( {} );
  const [ resultado, setResultado ] = useState<ResultadoHorariosDTO | null>( null );

  const value = useMemo<AppState>(
    () => ( {
      carreraId,
      setCarreraId,
      materiasAprobadas,
      toggleMateriaAprobada: ( clave: string ) => setMateriasAprobadas( ( prev ) => alternarEnSet( prev, clave ) ),
      materiasSeleccionadas,
      toggleMateriaSeleccionada: ( clave: string ) => setMateriasSeleccionadas( ( prev ) => alternarEnSet( prev, clave ) ),
      materiasInfo,
      setMateriasInfo,
      restricciones,
      setRestricciones,
      preferencias,
      setPreferencias,
      resultado,
      setResultado,
    } ),
    [ carreraId, materiasAprobadas, materiasSeleccionadas, materiasInfo, restricciones, preferencias, resultado ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext( AppStateContext );
  if ( !ctx ) throw new Error( "useAppState debe usarse dentro de <AppStateProvider>." );
  return ctx;
}
