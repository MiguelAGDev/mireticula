// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Resuelve el grafo de prerrequisitos: dado el catálogo de
// materias/grupos/prerrequisitos y las materias que el estudiante ya
// aprobó, calcula el estado de cada materia (aprobada/disponible/
// bloqueada) y, para las disponibles, sus grupos candidatos.

// Last Update: 2026-08-08
// Description: Se corrigió evaluarRequisito para "porcentajeCreditos" —
// comparaba la fracción 0-1 real contra un requisito.porcentaje asumido
// en escala 0-100; el smoke test contra datos reales lo destapó.

import type {
  Grupo,
  Materia,
  PrerrequisitosMateria,
  Requisito,
} from "@mi-reticula/shared-types";

export type EstadoMateria = "aprobada" | "disponible" | "bloqueada";

/** Evaluación de un requisito individual, con explicación en texto para el "modo de explicación". */
export interface RequisitoEvaluado {
  requisito: Requisito;
  cumplido: boolean;
  motivo: string;
}

export interface MateriaConEstado {
  materia: Materia;
  estado: EstadoMateria;
  /** Vacío si la materia no tiene requisitos registrados. */
  requisitos: RequisitoEvaluado[];
  /** Solo tiene contenido cuando estado === "disponible". */
  gruposCandidatos: Grupo[];
}

export interface ContextoAcademico {
  materias: Materia[];
  grupos: Grupo[];
  prerrequisitos: PrerrequisitosMateria[];
  /** Claves de materias que el estudiante ya tiene aprobadas. */
  materiasAprobadas: ReadonlySet<string>;
}

/**
 * Créditos aprobados y créditos totales del plan, para evaluar requisitos
 * de tipo "porcentajeCreditos". Las materias con `creditos: null` (todavía
 * sin completar contra la retícula oficial, ver PROYECTO.md) cuentan como
 * 0 — es una simplificación documentada, no un cálculo definitivo.
 */
function calcularCreditos( materias: Materia[], materiasAprobadas: ReadonlySet<string> ) {
  let creditosTotalPlan = 0;
  let creditosAprobados = 0;
  for ( const materia of materias ) {
    const creditos = materia.creditos ?? 0;
    creditosTotalPlan += creditos;
    if ( materiasAprobadas.has( materia.clave ) ) creditosAprobados += creditos;
  }
  return { creditosTotalPlan, creditosAprobados };
}

function nombrePorClave( materias: Materia[] ): Map<string, string> {
  return new Map( materias.map( ( m ) => [ m.clave, m.nombre ] ) );
}

/**
 * Evalúa un requisito contra lo que el estudiante ya tiene aprobado.
 *
 * Simplificación documentada: un "correquisito" se trata igual que un
 * "prerrequisito" (debe estar ya aprobado) porque el parser no conoce qué
 * materias se van a inscribir junto en este mismo ciclo — eso se decide
 * después, al elegir qué materias mandar al scheduler. Soportar
 * correquisitos "en paralelo" de verdad queda fuera de este alcance.
 */
function evaluarRequisito(
  requisito: Requisito,
  materiasAprobadas: ReadonlySet<string>,
  nombresPorClave: Map<string, string>,
  creditosAprobados: number,
  creditosTotalPlan: number,
): RequisitoEvaluado {
  if ( requisito.tipo === "prerrequisito" || requisito.tipo === "correquisito" ) {
    const cumplido = materiasAprobadas.has( requisito.clave );
    const nombre = nombresPorClave.get( requisito.clave ) ?? requisito.clave;
    return {
      requisito,
      cumplido,
      motivo: cumplido
        ? `Ya tienes aprobada ${requisito.clave} (${nombre}).`
        : `Requiere tener aprobada ${requisito.clave} (${nombre}).`,
    };
  }

  if ( requisito.tipo === "porcentajeCreditos" ) {
    const fraccionActual = creditosTotalPlan > 0 ? creditosAprobados / creditosTotalPlan : 0;
    const cumplido = fraccionActual >= requisito.porcentaje;
    const requerido = ( requisito.porcentaje * 100 ).toFixed( 0 );
    const actual = ( fraccionActual * 100 ).toFixed( 1 );
    return {
      requisito,
      cumplido,
      motivo: cumplido
        ? `Cumples el ${requerido}% de créditos del plan requerido (llevas ${actual}%).`
        : `Requiere el ${requerido}% de créditos del plan aprobados (llevas ${actual}%).`,
    };
  }

  // "requisitoEspecial": código que no corresponde a ninguna materia del
  // catálogo (ej. servicio social, avance crediticio). No se puede
  // evaluar automáticamente — se marca como no cumplido y se explica por
  // qué, en vez de asumir que sí se cumple.
  return {
    requisito,
    cumplido: false,
    motivo: `Requisito "${requisito.codigoOriginal}" no se puede verificar automáticamente: ${requisito.descripcion}`,
  };
}

export function resolverEstadoMaterias( contexto: ContextoAcademico ): MateriaConEstado[] {
  const { materias, grupos, prerrequisitos, materiasAprobadas } = contexto;
  const requisitosPorClave = new Map( prerrequisitos.map( ( p ) => [ p.materiaClave, p.requisitos ] ) );
  const nombresPorClave = nombrePorClave( materias );
  const { creditosTotalPlan, creditosAprobados } = calcularCreditos( materias, materiasAprobadas );

  return materias.map( ( materia ): MateriaConEstado => {
    if ( materiasAprobadas.has( materia.clave ) ) {
      return { materia, estado: "aprobada", requisitos: [], gruposCandidatos: [] };
    }

    const requisitosDeLaMateria = requisitosPorClave.get( materia.clave ) ?? [];
    const requisitosEvaluados = requisitosDeLaMateria.map( ( requisito ) =>
      evaluarRequisito( requisito, materiasAprobadas, nombresPorClave, creditosAprobados, creditosTotalPlan ),
    );
    const disponible = requisitosEvaluados.every( ( r ) => r.cumplido );

    return {
      materia,
      estado: disponible ? "disponible" : "bloqueada",
      requisitos: requisitosEvaluados,
      gruposCandidatos: disponible ? grupos.filter( ( g ) => g.materiaClave === materia.clave ) : [],
    };
  } );
}
