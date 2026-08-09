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

## 2026-08-08

### `shared-types` — recreación de `src/index.ts`
- **Descripción:** el archivo se había borrado; se volvió a mostrar el
  contenido completo en el chat (explicado línea por línea) y se creó
  solo tras confirmación explícita del usuario.
- **Tiempo invertido:** 10 min

### Frontend — Paso 4: `index.html`
- **Descripción:** punto de entrada HTML que usa Vite: `<div id="root">`
  donde React monta la app, y `<script type="module" src="/src/main.tsx">`
  que carga el TSX fuente directo (Vite lo compila al vuelo en dev).
- **Tiempo invertido:** 5 min

### Frontend — Paso 5: `src/index.css`
- **Descripción:** único CSS del proyecto: `@import "tailwindcss";`
  (Tailwind v4, sin `tailwind.config.js` ni `postcss.config.js` aparte —
  lo resuelve el plugin de Vite del Paso 3).
- **Tiempo invertido:** 5 min

### Frontend — Pasos 6–8: arranque de React y Pantalla de Inicio
- **Descripción:** `src/main.tsx` (monta `<App />` en el `#root` de
  `index.html`), `src/App.tsx` (raíz, hoy solo renderiza `Inicio`) y
  `src/pages/Inicio.tsx` (bienvenida + botón "Comenzar", sin navegación
  funcional todavía). Se corrigió `tsconfig.node.json` (le faltaba
  `"composite": true`, lo exige `tsc -b`) y se verificó con
  `npm run build --workspace=apps/frontend` y `--workspace=packages/importer`
  que todo compila.
- **Tiempo invertido:** 20 min

### `PROYECTO.md` — documento de propósito, plan y estado
- **Descripción:** documento único para lectura humana (a diferencia de
  `CLAUDE.md`, que es contexto para IA): qué es Mi Retícula, alcance,
  propósito de cada pieza de la arquitectura, flujo de la app, requisitos,
  roadmap, y una tabla de estado actual verificada contra el repo real.
- **Tiempo invertido:** 15 min

### `packages/schedule-engine` — Fase 1 (parser, scheduler, scorer)
- **Descripción:** motor de horarios completo, TypeScript puro sin
  dependencias de Express/React:
  - `parser`: resuelve estado de cada materia (aprobada/disponible/
    bloqueada) contra prerrequisitos, correquisitos y % de créditos, con
    motivo explicado en texto por cada requisito evaluado.
  - `scheduler`: backtracking con poda temprana (heurística de variable
    más restringida primero), filtra por restricciones obligatorias antes
    de combinar, y devuelve por qué no hubo resultados cuando aplica.
  - `scorer`: puntuación 0-100 con desglose estructurado por preferencia
    (entrar tarde, salir temprano, sin huecos, viernes libre).
  - Se verificó con un script ad-hoc (no commiteado) contra los datos
    reales de `apps/backend/src/data/*.jsonc`, lo que destapó un bug real:
    `RequisitoPorcentajeCreditos.porcentaje` sí es fracción 0-1 (no 0-100
    como se había asumido al reformatear `shared-types` el día 6) — se
    corrigió el comentario y la lógica del parser.
  - De paso: `RequisitoMateria` se dividió en `RequisitoPrerrequisito` +
    `RequisitoCorequisito` porque TypeScript no angostaba bien el
    discriminated union con un solo campo `tipo` de tipo unión.
  - `npm run build` limpio en `schedule-engine`, `importer` y `frontend`.
- **Tiempo invertido:** 55 min

### `apps/backend` — Fase 2 (Express delgado)
- **Descripción:** servidor Express que carga los `.jsonc` de
  `apps/backend/src/data` (con un parser propio que quita los
  comentarios que agrega el importer) y expone 3 endpoints, todos
  delgados — la lógica real vive en `schedule-engine`:
  - `GET /api/carreras` — catálogo de carreras.
  - `GET /api/materias?carreraId=&aprobadas=` — estado de cada materia
    (retícula interactiva), vía `resolverEstadoMaterias`.
  - `POST /api/horarios` — valida que las materias pedidas estén
    "disponible", genera combinaciones con `generarHorarios`, las
    puntúa con `puntuarHorario` y las regresa ordenadas de mayor a
    menor puntuación (o la explicación si no hubo resultados).
  - Se probaron los 3 endpoints en caliente contra los datos reales
    (`curl`): desbloqueo de materias al marcar una aprobada, generación
    de horarios con preferencias, y los dos casos de error (materia
    inexistente, arreglo vacío).
  - `npm run build --workspace=apps/backend` limpio.
- **Tiempo invertido:** 45 min

### `materias.jsonc` — semestre de cada materia (retícula oficial)
- **Descripción:** se llenó a mano `semestre` (1-8) para las 52 materias
  que sí aparecen en la retícula visual que compartió el usuario, leyendo
  su columna (I-VIII). `R19` (RESIDENCIA) y `T11` (TUTORIA) se dejan sin
  semestre a propósito — no aparecen como recuadro en la retícula oficial
  y por eso la pantalla de Retícula interactiva los excluye.
  **`creditos` se dejó en `null` a propósito**: la imagen los muestra como
  "horas teoría-práctica-créditos" (ej. "3-2-5") y no había certeza
  suficiente para transcribir los 54 valores sin verificarlos — se
  decidió no adivinar un número que se vea autoritativo sin serlo.
  ⚠️ Esto es una lectura manual de una imagen, no un dato del Excel — el
  semestre de las 6 electivas (`11D`/`21D`/`31D`/`41D`/`51D`/`61D`) tiene
  menos certeza que el resto; pendiente de que el usuario lo verifique.
  ⚠️ Además, si se vuelve a correr `npm run import`, este archivo se
  regenera desde el Excel y se pierde este llenado manual (el importer no
  lo preserva) — pendiente para una fase futura.
- **Tiempo invertido:** 20 min

### `apps/frontend` — Fase 3 (pantallas 2-6 + Feedback)
- **Descripción:** el resto del flujo de usuario, conectado al backend
  real:
  - `react-router-dom` + `AppStateProvider` (Context simple, sin librería
    de estado externa) para compartir carrera/materias/restricciones/
    preferencias/resultado entre pantallas.
  - `services/api.ts` + `types/api.ts`: cliente HTTP y tipos de la API —
    a propósito NO importan `@mi-reticula/schedule-engine` (solo el
    backend lo consume, por arquitectura), duplican la forma de los DTOs.
  - `vite.config.ts`: proxy de `/api` al backend en dev, para no
    pelearse con CORS ni hardcodear el host.
  - `SeleccionCarrera.tsx` — pantalla 2.
  - `ReticulaInteractiva.tsx` — pantalla 3: grid de 8 columnas
    (semestres), color por área derivado del prefijo de la clave, click
    para marcar aprobada, checkbox "Inscribir" en las disponibles.
  - `Restricciones.tsx` — pantalla 4: form de obligatorias + preferencias,
    dispara `POST /api/horarios`.
  - `Resultados.tsx` + `CuadriculaSemanal.tsx` + `FeedbackHorario.tsx` —
    pantallas 6-7: cuadrícula semanal real (posicionada por hora),
    desglose ✓/✗, y 👍/👎 + comentario por horario (solo estado local,
    v1.0 no tiene backend de feedback).
  - Verificado: `npm run build --workspace=apps/frontend` limpio, y
    prueba en caliente del flujo `GET /api/carreras` → `GET /api/materias`
    (semestre + exclusión de R19/T11 confirmadas) → proxy `/api` del
    frontend funcionando end-to-end.
- **Tiempo invertido:** 1h 40min

---

## Tiempo total invertido

**5h 55min**

_Nota sobre el método:_ los tiempos se calculan a partir de marcas de
tiempo reales (commits de git, fecha de modificación de archivos) cuando
existen; cuando una tarea no deja marcas de tiempo exactas para separar de
otra, se reparte con una estimación razonable según la complejidad
relativa. A partir de ahora, cada punto que cerremos se cronometra igual
y se suma aquí.
