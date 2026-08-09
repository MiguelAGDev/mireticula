// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Genera combinaciones válidas de horario a partir de las
// materias que el estudiante quiere inscribir (con sus grupos
// candidatos) y las restricciones obligatorias. Usa backtracking con
// poda temprana: descarta una rama en cuanto choca en horario o rompe
// una restricción, en vez de generar todo y filtrar después.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import type { Grupo, Materia, Sesion } from "@mi-reticula/shared-types";

export interface MateriaSeleccionada {
  materiaClave: string;
  /** Normalmente MateriaConEstado.gruposCandidatos del parser, ya filtrado a materias "disponible". */
  gruposCandidatos: Grupo[];
}

export interface RestriccionesObligatorias {
  creditosMin?: number;
  creditosMax?: number;
  /** "HH:MM" — ningún grupo con una sesión que empiece antes de esta hora. */
  horaEntradaMin?: string;
  /** "HH:MM" — ningún grupo con una sesión que termine después de esta hora. */
  horaSalidaMax?: string;
  /** profesorId a evitar; se descartan sus grupos antes de siquiera intentar combinarlos. */
  profesoresAEvitar?: ReadonlySet<string>;
}

export interface HorarioGenerado {
  /** Un Grupo por cada materia de materiasSeleccionadas, en el mismo orden en que se recibieron. */
  grupos: Grupo[];
  creditosTotales: number;
}

export interface ResultadoScheduler {
  horarios: HorarioGenerado[];
  /** Presente solo cuando horarios.length === 0: qué restricción dejó todo sin opciones. */
  explicacionSinResultados?: string;
}

export interface OpcionesScheduler {
  /** Tope de combinaciones a devolver, para no explotar en memoria/tiempo. */
  maxResultados?: number;
}

const MAX_RESULTADOS_DEFECTO = 50;

function seSolapan( a: Sesion, b: Sesion ): boolean {
  if ( a.dia !== b.dia ) return false;
  // "HH:MM" con cero a la izquierda compara igual como texto que como número.
  return a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;
}

function chocaConElegidos( candidato: Grupo, elegidos: Grupo[] ): boolean {
  return elegidos.some( ( g ) => g.sesiones.some( ( s1 ) => candidato.sesiones.some( ( s2 ) => seSolapan( s1, s2 ) ) ) );
}

/** Filtra por profesoresAEvitar y por la ventana horaEntradaMin/horaSalidaMax. Es poda temprana en el origen: nunca se llegan a probar esos grupos. */
function filtrarPorRestricciones( grupos: Grupo[], restricciones: RestriccionesObligatorias ): Grupo[] {
  return grupos.filter( ( grupo ) => {
    if ( restricciones.profesoresAEvitar && grupo.profesorId && restricciones.profesoresAEvitar.has( grupo.profesorId ) ) {
      return false;
    }
    if ( restricciones.horaEntradaMin && grupo.sesiones.some( ( s ) => s.horaInicio < restricciones.horaEntradaMin! ) ) {
      return false;
    }
    if ( restricciones.horaSalidaMax && grupo.sesiones.some( ( s ) => s.horaFin > restricciones.horaSalidaMax! ) ) {
      return false;
    }
    return true;
  } );
}

export function generarHorarios(
  materiasSeleccionadas: MateriaSeleccionada[],
  materiasPorClave: Map<string, Materia>,
  restricciones: RestriccionesObligatorias = {},
  opciones: OpcionesScheduler = {},
): ResultadoScheduler {
  const maxResultados = opciones.maxResultados ?? MAX_RESULTADOS_DEFECTO;

  if ( materiasSeleccionadas.length === 0 ) {
    return { horarios: [], explicacionSinResultados: "No se seleccionó ninguna materia para generar horarios." };
  }

  // Pre-filtrado por materia; si alguna se queda sin candidatos, ya sabemos
  // exactamente por qué no puede haber ningún horario válido.
  const materiasFiltradas = materiasSeleccionadas.map( ( m ) => ( {
    materiaClave: m.materiaClave,
    gruposCandidatos: filtrarPorRestricciones( m.gruposCandidatos, restricciones ),
  } ) );

  const materiaSinCandidatos = materiasFiltradas.find( ( m ) => m.gruposCandidatos.length === 0 );
  if ( materiaSinCandidatos ) {
    const nombre = materiasPorClave.get( materiaSinCandidatos.materiaClave )?.nombre ?? materiaSinCandidatos.materiaClave;
    return {
      horarios: [],
      explicacionSinResultados: `Ningún grupo de ${materiaSinCandidatos.materiaClave} (${nombre}) cumple las restricciones obligatorias (profesor a evitar y/o ventana de horario).`,
    };
  }

  // Heurística de variable más restringida: probar primero la materia con
  // menos opciones ayuda a la poda a descartar ramas malas antes.
  const ordenadas = [ ...materiasFiltradas ].sort( ( a, b ) => a.gruposCandidatos.length - b.gruposCandidatos.length );

  const horarios: HorarioGenerado[] = [];
  let huboChoqueDeHorario = false;
  let huboProblemaDeCreditos = false;

  function calcularCreditos( grupos: Grupo[] ): number {
    return grupos.reduce( ( total, g ) => total + ( materiasPorClave.get( g.materiaClave )?.creditos ?? 0 ), 0 );
  }

  function backtrack( indice: number, elegidos: Grupo[] ): void {
    if ( horarios.length >= maxResultados ) return;

    if ( indice === ordenadas.length ) {
      const creditosTotales = calcularCreditos( elegidos );
      if ( restricciones.creditosMin !== undefined && creditosTotales < restricciones.creditosMin ) {
        huboProblemaDeCreditos = true;
        return;
      }
      if ( restricciones.creditosMax !== undefined && creditosTotales > restricciones.creditosMax ) {
        huboProblemaDeCreditos = true;
        return;
      }
      horarios.push( { grupos: [ ...elegidos ], creditosTotales } );
      return;
    }

    for ( const candidato of ordenadas[indice].gruposCandidatos ) {
      if ( horarios.length >= maxResultados ) return;
      if ( chocaConElegidos( candidato, elegidos ) ) {
        huboChoqueDeHorario = true;
        continue; // poda: no baja a explorar esta rama
      }
      elegidos.push( candidato );
      backtrack( indice + 1, elegidos );
      elegidos.pop();
    }
  }

  backtrack( 0, [] );

  if ( horarios.length > 0 ) return { horarios };

  const explicacionSinResultados = huboProblemaDeCreditos
    ? "Todas las combinaciones sin choques de horario quedaron fuera del rango de créditos mínimo/máximo."
    : huboChoqueDeHorario
      ? "Todas las combinaciones posibles tienen algún choque de horario entre materias seleccionadas."
      : "No se encontró ninguna combinación válida.";

  return { horarios: [], explicacionSinResultados };
}
