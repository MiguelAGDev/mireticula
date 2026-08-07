// Transforma las filas crudas del Excel (RawRow) en el modelo de dominio
// que packages/schedule-engine y apps/backend consumen: materias,
// profesores, grupos y prerrequisitos/requisitos.

import type {
  Carrera,
  Grupo,
  Materia,
  PrerrequisitosMateria,
  Profesor,
  Requisito,
} from "@mi-reticula/shared-types";
import type { RawRow } from "./excel-reader/index.js";

export interface ModeloImportado {
  carreras: Carrera[];
  materias: Materia[];
  profesores: Profesor[];
  grupos: Grupo[];
  prerrequisitos: PrerrequisitosMateria[];
  /** Para el resumen que se muestra al usuario tras correr el importer. */
  resumen: {
    totalMaterias: number;
    totalGrupos: number;
    totalMateriasConRequisitos: number;
    totalRequisitosEspeciales: number;
  };
}

const ID_CARRERA_ISC = "ISC";
const NOMBRE_CARRERA_ISC = "Ingeniería en Sistemas Computacionales";

/** Quita acentos/diacríticos y produce un slug estable en minúsculas. */
function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Un token de la columna Requisitos/Correquisitos que no corresponde a
 * ninguna clave de materia del catálogo (ej. "A1C", "S1S" en la fila de
 * RESIDENCIA). No podemos saber con certeza qué representa cada código sin
 * el catálogo oficial de servicio social / residencias del Tec Laguna, así
 * que se documenta como hipótesis y debe confirmarse manualmente.
 */
function describirRequisitoEspecial(codigo: string, materiaClave: string, materiaNombre: string): string {
  return (
    `Código "${codigo}" en la columna Requisitos de ${materiaClave} (${materiaNombre}) ` +
    `no corresponde a ninguna clave de materia del catálogo. Probablemente se refiera a ` +
    `avance crediticio y/o servicio social (típico para Residencia Profesional). ` +
    `Verificar manualmente contra los lineamientos del Tec Laguna.`
  );
}

export function construirModelo(filas: RawRow[]): ModeloImportado {
  const clavesValidas = new Set(filas.map((f) => f.clave));

  // ---- materias.json ----
  const materiasPorClave = new Map<string, Materia>();
  for (const fila of filas) {
    if (!materiasPorClave.has(fila.clave)) {
      materiasPorClave.set(fila.clave, {
        clave: fila.clave,
        nombre: fila.materia,
        creditos: null, // no vienen en este Excel; completar con la retícula oficial
        semestre: null, // no vienen en este Excel; completar con la retícula oficial
      });
    }
  }
  const materias = [...materiasPorClave.values()].sort((a, b) => a.clave.localeCompare(b.clave));

  // ---- profesores.json ----
  const profesoresPorId = new Map<string, Profesor>();
  for (const fila of filas) {
    if (fila.catedratico === "MAESTRO POR ASIGNAR") continue;
    const id = slugify(fila.catedratico);
    if (!profesoresPorId.has(id)) {
      profesoresPorId.set(id, { id, nombre: fila.catedratico });
    }
  }
  const profesores = [...profesoresPorId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));

  // ---- grupos.json ----
  const grupos: Grupo[] = filas.map((fila) => ({
    materiaClave: fila.clave,
    grupo: fila.grupo,
    profesorId: fila.catedratico === "MAESTRO POR ASIGNAR" ? null : slugify(fila.catedratico),
    sesiones: fila.sesiones,
    porcentajeCreditosNecesario: fila.porcentajeNecesario,
  }));

  // ---- prerrequisitos.json ----
  let totalRequisitosEspeciales = 0;
  const prerrequisitos: PrerrequisitosMateria[] = [];

  for (const fila of filas) {
    // Requisitos/Correquisitos/porcentajeNecesario son iguales para todas
    // las filas (grupos) de una misma clave, así que basta procesar cada
    // materia una vez (la primera fila en la que aparece).
    if (fila !== filas.find((f) => f.clave === fila.clave)) continue;

    const requisitos: Requisito[] = [];

    if (fila.requisitos) {
      for (const token of fila.requisitos.split(/\s+/).filter(Boolean)) {
        if (clavesValidas.has(token)) {
          requisitos.push({ tipo: "prerrequisito", clave: token });
        } else {
          requisitos.push({
            tipo: "requisitoEspecial",
            codigoOriginal: token,
            descripcion: describirRequisitoEspecial(token, fila.clave, fila.materia),
          });
          totalRequisitosEspeciales++;
        }
      }
    }

    if (fila.correquisitos) {
      for (const token of fila.correquisitos.split(/\s+/).filter(Boolean)) {
        if (clavesValidas.has(token)) {
          requisitos.push({ tipo: "correquisito", clave: token });
        } else {
          requisitos.push({
            tipo: "requisitoEspecial",
            codigoOriginal: token,
            descripcion: describirRequisitoEspecial(token, fila.clave, fila.materia),
          });
          totalRequisitosEspeciales++;
        }
      }
    }

    if (fila.porcentajeNecesario > 0) {
      requisitos.push({ tipo: "porcentajeCreditos", porcentaje: fila.porcentajeNecesario });
    }

    if (requisitos.length > 0) {
      prerrequisitos.push({ materiaClave: fila.clave, requisitos });
    }
  }
  prerrequisitos.sort((a, b) => a.materiaClave.localeCompare(b.materiaClave));

  // ---- carreras.json ----
  const carreras: Carrera[] = [
    {
      id: ID_CARRERA_ISC,
      nombre: NOMBRE_CARRERA_ISC,
      materias: materias.map((m) => m.clave),
    },
  ];

  return {
    carreras,
    materias,
    profesores,
    grupos,
    prerrequisitos,
    resumen: {
      totalMaterias: materias.length,
      totalGrupos: grupos.length,
      totalMateriasConRequisitos: prerrequisitos.length,
      totalRequisitosEspeciales,
    },
  };
}

/** Mapa clave -> nombre de materia, usado por json-writer para anotar comentarios. */
export function nombrePorClaveDesdeMateria(materias: Materia[]): Map<string, string> {
  return new Map(materias.map((m) => [m.clave, m.nombre]));
}
