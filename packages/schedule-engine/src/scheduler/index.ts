// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Genera combinaciones válidas de horario a partir de las
// materias que el estudiante quiere inscribir (con sus grupos
// candidatos) y las restricciones obligatorias. Usa backtracking con
// poda temprana: descarta una rama en cuanto choca en horario o rompe
// una restricción, en vez de generar todo y filtrar después.

// Last Update: 2026-08-09
// Description: Ya no exige que TODAS las materias seleccionadas quepan.
// Ahora busca, por branch-and-bound, el subconjunto más grande posible
// sin choques (incluyendo empates), y reporta por horario cuáles
// materias quedaron fuera y por qué — antes, un solo choque entre dos
// materias tumbaba el 100% de los resultados.

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

export interface MateriaExcluida {
  materiaClave: string;
  /** Explicación concreta de por qué esta materia no quedó en este horario en particular. */
  motivo: string;
}

export interface HorarioGenerado {
  /** Un Grupo por cada materia que sí quedó incluida en este horario — puede ser menos que materiasSeleccionadas. */
  grupos: Grupo[];
  creditosTotales: number;
  /** De materiasSeleccionadas, las que NO quedaron en este horario, con motivo. Vacío si cupieron todas. */
  materiasExcluidas: MateriaExcluida[];
}

export interface ResultadoScheduler {
  /** Todas con el mismo número de materias incluidas: el máximo que se pudo lograr sin choques. */
  horarios: HorarioGenerado[];
  /** Presente solo cuando horarios.length === 0: ni siquiera el mejor subconjunto posible cumple algo obligatorio (ej. creditosMin). */
  explicacionSinResultados?: string;
}

export interface OpcionesScheduler {
  /** Tope de combinaciones a devolver (todas del tamaño máximo), para no explotar en memoria/tiempo. */
  maxResultados?: number;
}

const MAX_RESULTADOS_DEFECTO = 50;
/** Red de seguridad: con la poda por cota superior esto no debería alcanzarse en la escala real (decenas de materias, pocos grupos cada una), pero evita que un caso patológico cuelgue el request — si se alcanza, se regresa el mejor subconjunto encontrado hasta ese punto. */
const TOPE_NODOS_EXPLORADOS = 200_000;

function seSolapan( a: Sesion, b: Sesion ): boolean {
  if ( a.dia !== b.dia ) return false;
  // "HH:MM" con cero a la izquierda compara igual como texto que como número.
  return a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;
}

function chocaConElegidos( candidato: Grupo, elegidos: Grupo[] ): boolean {
  return elegidos.some( ( g ) => g.sesiones.some( ( s1 ) => candidato.sesiones.some( ( s2 ) => seSolapan( s1, s2 ) ) ) );
}

/** Filtra por profesoresAEvitar y por la ventana horaEntradaMin/horaSalidaMax. Es poda temprana en el origen: nunca se llegan a probar esos grupos. Una materia que se queda sin candidatos aquí simplemente nunca podrá incluirse — no tumba a las demás. */
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

function cumpleCreditos( creditos: number, restricciones: RestriccionesObligatorias ): boolean {
  if ( restricciones.creditosMin !== undefined && creditos < restricciones.creditosMin ) return false;
  if ( restricciones.creditosMax !== undefined && creditos > restricciones.creditosMax ) return false;
  return true;
}

/**
 * Corrida rápida (sin backtracking real) para tener una cota inicial VÁLIDA
 * del tamaño de subconjunto alcanzable: mete materias en orden, una a la
 * vez, si no choca con lo ya elegido. Solo se usa como semilla de
 * `mejorTamanoGlobal` si de verdad cumple creditosMin/Max — si no se
 * valida, se descarta (usar un tamaño no confirmado como cota rompería la
 * poda: podría descartar por error el óptimo real). Con esta semilla la
 * poda por cota superior empieza a cortar ramas desde el primer nodo en
 * vez de tener que descubrir un buen resultado poco a poco.
 */
function tamanoSemillaValida( ordenadas: MateriaSeleccionada[], materiasPorClave: Map<string, Materia>, restricciones: RestriccionesObligatorias ): number {
  const elegidos: Grupo[] = [];
  for ( const materia of ordenadas ) {
    const candidato = materia.gruposCandidatos.find( ( c ) => !chocaConElegidos( c, elegidos ) );
    if ( candidato ) elegidos.push( candidato );
  }
  const creditos = elegidos.reduce( ( total, g ) => total + ( materiasPorClave.get( g.materiaClave )?.creditos ?? 0 ), 0 );
  return cumpleCreditos( creditos, restricciones ) ? elegidos.length : 0;
}

/** Por qué una materia en particular no quedó en ESTE horario: si ninguno de sus grupos candidatos chocaba con lo elegido, fue una decisión de combinación (hay otras opciones que sí la incluyen); si todos chocaban, se señala contra qué materia/grupo específico. */
function motivoExclusion( materia: MateriaSeleccionada, elegidos: Grupo[], materiasPorClave: Map<string, Materia> ): string {
  if ( materia.gruposCandidatos.length === 0 ) {
    return "Ningún grupo cumple las restricciones obligatorias configuradas (profesor a evitar y/o ventana de horario).";
  }

  const teniaOpcionLibre = materia.gruposCandidatos.some( ( c ) => !chocaConElegidos( c, elegidos ) );
  if ( teniaOpcionLibre ) {
    return "No quedó incluida en esta opción para lograr el máximo de materias sin choques — revisa las demás opciones generadas, alguna puede incluirla a cambio de otra.";
  }

  for ( const candidato of materia.gruposCandidatos ) {
    const elegidoQueChoca = elegidos.find( ( g ) => g.sesiones.some( ( s1 ) => candidato.sesiones.some( ( s2 ) => seSolapan( s1, s2 ) ) ) );
    if ( elegidoQueChoca ) {
      const nombreOtro = materiasPorClave.get( elegidoQueChoca.materiaClave )?.nombre ?? elegidoQueChoca.materiaClave;
      return `Choca en horario con ${nombreOtro} (grupo ${elegidoQueChoca.grupo}) en todos sus grupos disponibles.`;
    }
  }
  return "No se pudo incluir en esta opción.";
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

  const materiasFiltradas = materiasSeleccionadas.map( ( m ) => ( {
    materiaClave: m.materiaClave,
    gruposCandidatos: filtrarPorRestricciones( m.gruposCandidatos, restricciones ),
  } ) );

  // Heurística de variable más restringida: probar primero la materia con
  // menos opciones ayuda a la poda a descartar ramas malas antes.
  const ordenadas = [ ...materiasFiltradas ].sort( ( a, b ) => a.gruposCandidatos.length - b.gruposCandidatos.length );

  let mejorTamanoGlobal = tamanoSemillaValida( ordenadas, materiasPorClave, restricciones );
  const resultadosCrudos: { grupos: Grupo[]; creditosTotales: number; incluidas: Set<string> }[] = [];
  let nodosExplorados = 0;

  function backtrack( indice: number, elegidos: Grupo[], incluidas: string[], creditosAcumulados: number ): void {
    nodosExplorados++;
    if ( nodosExplorados > TOPE_NODOS_EXPLORADOS ) return;

    const materiasRestantes = ordenadas.length - indice;
    const cotaSuperior = incluidas.length + materiasRestantes;
    if ( cotaSuperior < mejorTamanoGlobal ) return; // ni empatando el mejor que ya se tiene, se poda

    if ( indice === ordenadas.length ) {
      if ( !cumpleCreditos( creditosAcumulados, restricciones ) ) return;

      if ( incluidas.length > mejorTamanoGlobal ) {
        mejorTamanoGlobal = incluidas.length;
        resultadosCrudos.length = 0; // ya no compiten los de tamaño menor
      }
      if ( incluidas.length === mejorTamanoGlobal && resultadosCrudos.length < maxResultados ) {
        resultadosCrudos.push( { grupos: [ ...elegidos ], creditosTotales: creditosAcumulados, incluidas: new Set( incluidas ) } );
      }
      return;
    }

    const materia = ordenadas[indice];

    // Rama A: incluirla, un grupo candidato a la vez.
    for ( const candidato of materia.gruposCandidatos ) {
      if ( chocaConElegidos( candidato, elegidos ) ) continue;
      elegidos.push( candidato );
      incluidas.push( materia.materiaClave );
      backtrack( indice + 1, elegidos, incluidas, creditosAcumulados + ( materiasPorClave.get( materia.materiaClave )?.creditos ?? 0 ) );
      incluidas.pop();
      elegidos.pop();
    }

    // Rama B: excluirla.
    backtrack( indice + 1, elegidos, incluidas, creditosAcumulados );
  }

  backtrack( 0, [], [], 0 );

  if ( resultadosCrudos.length === 0 ) {
    return {
      horarios: [],
      explicacionSinResultados:
        restricciones.creditosMin !== undefined || restricciones.creditosMax !== undefined
          ? "No existe ninguna combinación (ni siquiera reduciendo materias) que quede dentro del rango de créditos mínimo/máximo configurado."
          : "No se encontró ninguna combinación válida.",
    };
  }

  const horarios: HorarioGenerado[] = resultadosCrudos.map( ( { grupos, creditosTotales, incluidas } ) => ( {
    grupos,
    creditosTotales,
    materiasExcluidas: ordenadas
      .filter( ( m ) => !incluidas.has( m.materiaClave ) )
      .map( ( m ) => ( { materiaClave: m.materiaClave, motivo: motivoExclusion( m, grupos, materiasPorClave ) } ) ),
  } ) );

  return { horarios };
}
