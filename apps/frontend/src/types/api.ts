// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Formas de las respuestas/peticiones de la API del
// backend. El frontend NO depende de packages/schedule-engine (solo
// apps/backend lo consume, ver CLAUDE.md) — estos tipos describen el
// formato de red (JSON), a propósito duplicados en vez de importados.

// Last Update: 2026-08-09
// Description: HorarioConPuntuacionDTO gana materiasExcluidas — el
// scheduler ya no exige que quepan todas las materias seleccionadas,
// ahora puede devolver el mejor subconjunto posible y reportar qué
// quedó fuera y por qué.

import type { Carrera, Grupo, Materia, Requisito } from "@mi-reticula/shared-types";

export type EstadoMateria = "aprobada" | "disponible" | "bloqueada";

export interface RequisitoEvaluadoDTO {
  requisito: Requisito;
  cumplido: boolean;
  motivo: string;
}

export interface MateriaConEstadoDTO {
  materia: Materia;
  estado: EstadoMateria;
  requisitos: RequisitoEvaluadoDTO[];
  gruposCandidatos: Grupo[];
}

export interface RestriccionesObligatorias {
  creditosMin?: number;
  creditosMax?: number;
  horaEntradaMin?: string;
  horaSalidaMax?: string;
  profesoresAEvitar?: string[];
}

export interface Preferencias {
  entrarTarde?: boolean;
  salirTemprano?: boolean;
  sinHuecos?: boolean;
  viernesLibre?: boolean;
}

export interface CriterioPuntuacionDTO {
  criterio: keyof Preferencias;
  cumplido: boolean;
  detalle: string;
}

export interface MateriaExcluidaDTO {
  materiaClave: string;
  motivo: string;
}

export interface HorarioConPuntuacionDTO {
  grupos: Grupo[];
  creditosTotales: number;
  puntuacion: number;
  desglose: CriterioPuntuacionDTO[];
  /** De las materias que se seleccionaron para inscribir, las que NO quedaron en este horario. Vacío si cupieron todas. */
  materiasExcluidas: MateriaExcluidaDTO[];
}

export interface ResultadoHorariosDTO {
  horarios: HorarioConPuntuacionDTO[];
  explicacionSinResultados?: string;
}

export interface CarrerasResponse {
  carreras: Carrera[];
}

export interface MateriasResponse {
  carreraId: string;
  materias: MateriaConEstadoDTO[];
}
