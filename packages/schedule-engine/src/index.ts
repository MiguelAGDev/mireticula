// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Punto de entrada público de packages/schedule-engine.
// apps/backend solo debe importar desde aquí, nunca de los subdirectorios
// directamente — así el paquete puede reorganizarse por dentro sin romper
// a sus consumidores.

// Last Update: 2026-08-09
// Description: Se exporta el nuevo tipo MateriaExcluida (scheduler ahora
// reporta subconjuntos parciales, no solo todo-o-nada).

export type { ContextoAcademico, EstadoMateria, MateriaConEstado, RequisitoEvaluado } from "./parser/index.js";
export { resolverEstadoMaterias } from "./parser/index.js";

export type {
  HorarioGenerado,
  MateriaExcluida,
  MateriaSeleccionada,
  OpcionesScheduler,
  ResultadoScheduler,
  RestriccionesObligatorias,
} from "./scheduler/index.js";
export { generarHorarios } from "./scheduler/index.js";

export type { CriterioPreferencia, CriterioPuntuacion, Preferencias, ResultadoScoring } from "./scorer/index.js";
export { puntuarHorario } from "./scorer/index.js";
