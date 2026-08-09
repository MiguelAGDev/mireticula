// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Tipos compartidos entre apps/frontend y apps/backend. No
// depende de Express ni de React. Es la única fuente de verdad para las
// formas de datos que produce packages/importer y consume
// packages/schedule-engine.

// Last Update: 2026-08-08
// Description: Se documentó (con evidencia verificada contra los datos
// reales) que RequisitoPorcentajeCreditos.porcentaje SÍ es fracción 0-1,
// tal como decía el comentario original. RequisitoMateria se dividió en
// RequisitoPrerrequisito/RequisitoCorequisito para que TS angoste bien el
// discriminated union (lo necesitó packages/schedule-engine/src/parser).

/** Días de la semana en los que puede haber sesiones de clase. */
export type Dia = "lunes" | "martes" | "miercoles" | "jueves" | "viernes";

export interface Carrera {
  id: string;
  nombre: string;
  /** Claves de materias que conforman el plan de estudios de esta carrera. */
  materias: string[];
}

export interface Materia {
  clave: string;
  nombre: string;
  /**
   * No vienen en el Excel de oferta académica (dataset_mireticula.xlsx).
   * Quedan en null hasta completarse manualmente contra la retícula oficial
   * de Ingeniería en Sistemas Computacionales (Tec Laguna).
   */
  creditos: number | null;
  semestre: number | null;
}

export interface Profesor {
  id: string;
  nombre: string;
}

export interface Sesion {
  dia: Dia;
  horaInicio: string; // "HH:MM"
  horaFin: string; // "HH:MM"
  aula: string;
}

export interface Grupo {
  materiaClave: string;
  grupo: string;
  /** null cuando el Excel indica "MAESTRO POR ASIGNAR" (sin profesor definido aún). */
  profesorId: string | null;
  sesiones: Sesion[];
  /**
   * Porcentaje de créditos del plan de estudios que se deben tener
   * aprobados para poder inscribir este grupo (columna %Necesario).
   * 0 significa que no aplica esta restricción.
   */
  porcentajeCreditosNecesario: number;
}

/** Tipos de requisito que puede tener una materia, explícitamente distinguidos. */
export type TipoRequisito =
  | "prerrequisito" // columna Requisitos: materia que debe estar aprobada
  | "correquisito" // columna Correquisitos: materia a cursar junto (o ya aprobada)
  | "porcentajeCreditos" // columna %Necesario > 0: % de créditos del plan aprobados
  | "requisitoEspecial"; // no es una clave de materia válida (servicio social, avance crediticio, etc.)

export interface RequisitoPrerrequisito {
  tipo: "prerrequisito";
  /** Clave de la materia requerida. */
  clave: string;
}

export interface RequisitoCorequisito {
  tipo: "correquisito";
  /** Clave de la materia requerida. */
  clave: string;
}

/**
 * Unión de los dos tipos anteriores. Están separados (en vez de un solo
 * `tipo: "prerrequisito" | "correquisito"`) para que TypeScript pueda
 * angostar (narrow) el tipo con un simple `if (r.tipo === "...")` — con
 * un discriminante que es a su vez una unión, el angostamiento del `else`
 * no siempre excluye la interface completa.
 */
export type RequisitoMateria = RequisitoPrerrequisito | RequisitoCorequisito;

export interface RequisitoPorcentajeCreditos {
  tipo: "porcentajeCreditos";
  /**
   * Fracción 0-1 (ej. 0.6 significa 60% de los créditos del plan). El
   * Excel muestra la celda con formato "60%", pero SheetJS devuelve el
   * valor subyacente de una celda de Excel con formato porcentaje, que es
   * la fracción decimal — verificado contra apps/backend/src/data/
   * prerrequisitos.jsonc.
   */
  porcentaje: number;
}

export interface RequisitoEspecial {
  tipo: "requisitoEspecial";
  /** Texto original tal como aparece en el Excel (ej. "A1C S1S"). */
  codigoOriginal: string;
  /** Explicación de a qué podría corresponder (servicio social, avance crediticio, etc.). */
  descripcion: string;
}

export type Requisito =
  | RequisitoPrerrequisito
  | RequisitoCorequisito
  | RequisitoPorcentajeCreditos
  | RequisitoEspecial;

export interface PrerrequisitosMateria {
  materiaClave: string;
  requisitos: Requisito[];
}
