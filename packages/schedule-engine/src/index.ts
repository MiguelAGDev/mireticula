// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Punto de entrada público de packages/schedule-engine.
// apps/backend solo debe importar desde aquí, nunca de los subdirectorios
// directamente — así el paquete puede reorganizarse por dentro sin romper
// a sus consumidores.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

export type { ContextoAcademico, EstadoMateria, MateriaConEstado, RequisitoEvaluado } from "./parser/index.js";
export { resolverEstadoMaterias } from "./parser/index.js";

export type {
  HorarioGenerado,
  MateriaSeleccionada,
  OpcionesScheduler,
  ResultadoScheduler,
  RestriccionesObligatorias,
} from "./scheduler/index.js";
export { generarHorarios } from "./scheduler/index.js";

export type { CriterioPreferencia, CriterioPuntuacion, Preferencias, ResultadoScoring } from "./scorer/index.js";
export { puntuarHorario } from "./scorer/index.js";
