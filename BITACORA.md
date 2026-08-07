# Mi Retícula — Bitácora

Registro del progreso del proyecto: qué se hizo, cuándo y cuánto tiempo tomó.

## 2026-08-06

### `shared-types` — tipos compartidos
- **Descripción:** definición de los tipos de dominio (`Carrera`, `Materia`,
  `Profesor`, `Grupo`, `Sesion`, `Requisito` y variantes) que usan
  `importer`, `schedule-engine`, `backend` y `frontend` como única fuente
  de verdad.
- **Tiempo invertido:** 15 min (calculado a partir de la marca de tiempo
  del archivo `packages/shared-types/src/index.ts`, dentro de la sesión
  00:54–01:34)

### `importer` — Excel → JSON
- **Descripción:** CLI (`excel-reader` + `build-model` + `json-writer`) que
  lee `dataset_mireticula.xlsx` y genera `carreras.jsonc`, `materias.jsonc`,
  `profesores.jsonc`, `grupos.jsonc` y `prerrequisitos.jsonc` en
  `apps/backend/src/data`. Ya corrido al menos una vez con datos reales.
- **Tiempo invertido:** 25 min (resto de la misma sesión 00:54–01:34;
  incluye más archivos que `shared-types`)

### Bitácora del proyecto
- **Descripción:** creación de este archivo (`BITACORA.md`) para llevar el
  registro de tareas, descripción y tiempo invertido a partir de ahora.
- **Tiempo invertido:** 5 min

### Frontend — Paso 1: `package.json`
- **Descripción:** dependencias y scripts (`dev`/`build`/`preview`) del
  workspace `apps/frontend`: React, Vite, TypeScript, Tailwind v4.
- **Tiempo invertido:** 5 min

### Frontend — Paso 2: `tsconfig.json` + `tsconfig.node.json`
- **Descripción:** config de TypeScript del frontend, separando el código
  que corre en el navegador (`src/`) del que corre en Node
  (`vite.config.ts`), extendiendo `tsconfig.base.json` de la raíz.
- **Tiempo invertido:** 5 min

### Frontend — Paso 3: `vite.config.ts`
- **Descripción:** configuración de Vite (plugin de React + plugin de
  Tailwind v4, alias `@` → `src/`); se agregó `@types/node` al
  `package.json` porque este archivo corre en Node.
- **Tiempo invertido:** 5 min

### Convenciones de código + reformateo del repo
- **Descripción:** se agregó a `CLAUDE.md` la convención de espaciado de
  paréntesis/llaves/corchetes, la alineación vertical de bloques de
  líneas similares (ej. `from` en imports), y el encabezado obligatorio
  de archivo (Author/Date/Description/Last Update). Se reformateraron
  todos los archivos de código existentes (`shared-types`, `importer`,
  `tsconfig.*`, `vite.config.ts`) para cumplirlas.
- **Tiempo invertido:** 20 min

---

## Tiempo total invertido

**1h 20min**

_Nota sobre el método:_ los tiempos se calculan a partir de marcas de
tiempo reales (commits de git, fecha de modificación de archivos) cuando
existen; cuando una tarea no deja marcas de tiempo exactas para separar de
otra, se reparte con una estimación razonable según la complejidad
relativa. A partir de ahora, cada punto que cerremos se cronometra igual
y se suma aquí.
