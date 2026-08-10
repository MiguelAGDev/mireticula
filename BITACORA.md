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

## 2026-08-09

### Puerto del backend: 3001 → 3010
- **Descripción:** un proceso de pruebas de una sesión anterior se quedó
  pegado en el puerto 3001 (ni el sandbox de la IA ni el usuario pudieron
  matarlo). Se cambió el puerto por defecto de `apps/backend` (y el proxy
  de `vite.config.ts`) a 3010 en vez de seguir peleando con eso.
- **Tiempo invertido:** 10 min

### `materias.jsonc` — semestre corregido contra el documento oficial real
- **Descripción:** el usuario compartió el documento oficial completo
  ("PLAN RETICULAR INGENIERÍA EN SISTEMAS COMPUTACIONALES", ISIC-2010-224
  / especialidad ISIE-TDS-2024-01) con la lista exacta de materias por
  semestre. Se cruzó contra `prerrequisitos.jsonc` (dato real del Excel)
  y se encontraron 2 discrepancias reales entre la descripción y los
  datos reales, reportadas antes de asumir nada: Graficación no está
  entre Fund. Ingeniería de Software e Ingeniería de Software (su
  prerrequisito real es Estructura de Datos), y las materias `****`
  (60% créditos) no tienen prerrequisito de materia, solo el
  `porcentajeCreditos`. Se corrigieron los semestres mal asignados
  (C14, C15, D16, B15, E13, C17, F17, E14, C18, A18, 31D, C16, 41D) y se
  agregó el **Semestre IX** (51D, 61D) que no existía antes. Se confirmó
  el conteo final por semestre contra la lista del usuario (52 materias
  distribuidas en 9 semestres + 2 excluidas).
- **Tiempo invertido:** 40 min

### Retícula interactiva — reescritura a posiciones fijas
- **Descripción:** el layout anterior apilaba materias en filas simples
  que se reacomodaban según la lista. Se reescribió con una tabla
  estática `clave -> {semestre, fila}` (única fuente de la posición) y
  tarjetas `position: absolute` de tamaño fijo — la posición y el tamaño
  ya no cambian al aprobar/interactuar. Flechas de prerrequisito en un
  `<svg>` superpuesto, calculadas con la misma fórmula analítica (no
  medición del DOM), dibujadas solo para requisitos reales tipo
  prerrequisito/correquisito (no para `porcentajeCreditos`, que no tiene
  materia de origen). Verificado con Playwright (temporal, no
  commiteado): capturas antes/después de aprobar una materia confirmando
  que nada se mueve y que el desbloqueo funciona sin recargar.
- **Tiempo invertido:** 1h 10min

### Retícula interactiva — 5 ajustes visuales/funcionales
- **Descripción:** a partir de feedback puntual del usuario sobre las
  capturas:
  1. Flechas ruteadas en codo (ortogonales, `M x y H mitad V y2 H x2`) en
     vez de línea recta, y con z-index detrás de las tarjetas (antes
     cruzaban el texto de tarjetas intermedias).
  2. Encabezados de columna en números romanos (I-IX).
  3. Más espaciado entre columnas/filas y padding interno de tarjeta.
  4. Colores más saturados (`-900`/`-500` en vez de `-950`/`-700`),
     estado "aprobada" con ✅ + anillo verde en toda la tarjeta, hover
     con escala + sombra.
  5. Toggle de dos modos nuevo: "Marcar cursadas" (comportamiento
     original) vs "Elegir a inscribir" (solo materias disponibles
     responden a click, selección múltiple con anillo azul); el estado
     de aprobadas se conserva al cambiar de modo, y el contador del
     botón "Continuar" cambia según el modo activo.
  - Se investigó el aviso del usuario sobre Gestión de Proyectos de
    Software (2 horas el viernes, `10:00-12:00`): confirmado que es un
    solo bloque real de 2 horas (no un dato duplicado), y que ningún
    código del proyecto asume duración fija de sesión — no hizo falta
    corregir nada.
  - Verificado otra vez con Playwright (temporal): 4 capturas cubriendo
    ambos modos, el zoom a la zona de flechas que el usuario señaló, y
    el estado "aprobada" con dos materias marcadas.
- **Tiempo invertido:** 1h 05min

### Fusión de Restricciones + Resultados en `/plan`
- **Descripción:** `Restricciones.tsx` y `Resultados.tsx` (rutas
  separadas) se fusionaron en `PlanDeHorario.tsx`, una sola vista en
  `/plan` con dos columnas (restricciones a la izquierda, resultados a
  la derecha) — sin navegación entre configurar y ver resultados, el
  botón "Generar" solo actualiza la columna derecha. Verificado con
  Playwright: la URL nunca cambia de `/plan` al generar.
- **Tiempo invertido:** 30 min

### Regeneración de datos desde el portal oficial de horarios
- **Descripción:** `dataset_mireticula.xlsx` se corrompió dos veces al
  editarlo a mano (encabezados desfasados, `Requisitos`/`Correq.`
  invertidos — ver entrada anterior). Se encontró que
  `apps2.itlalaguna.edu.mx/horarios` es un portal público (sin login,
  pese al nombre `login.aspx`) que expone la misma oferta académica en
  vivo. Se automatizó con Playwright (temporal, no commiteado): elegir
  "INGENIERIA EN SISTEMAS COMPUTACIONALES" y extraer la tabla completa
  (141 grupos) directo del DOM — el usuario confirmó con un PDF exportado
  del mismo portal que el contenido coincide exactamente.
  - Se detectó el nuevo formato de horario: una columna `Horario` general
    + aula por día (`L M I J V`), con la hora especial de un día pegada
    al código de aula sin separador cuando difiere (ej. `19M10:00-12:00`
    para el viernes de Gestión de Proyectos) — se parseó con una regex
    dedicada, verificado contra los 3 casos reales que existen.
  - Los datos se reprocesaron con `construirModelo` + `json-writer` de
    `packages/importer` **sin modificarlos** (se armó el `RawRow[]` a
    mano desde el scrape en vez de tocar el excel-reader) — los 5
    `.jsonc` quedaron regenerados. `semestre` (llenado a mano) se
    restauró desde un respaldo tomado antes de regenerar, porque el
    importer siempre lo deja en `null`.
  - **`dataset_mireticula.xlsx` se reescribió limpio**, en el formato
    original que `excel-reader` ya sabía leer (columnas por día con
    `"HH:MM-HH:MM/AULA"`) — verificado con round-trip: se leyó con el
    importer real sin modificar y produjo exactamente los mismos datos.
    Ningún código del importer cambió.
  - Diff final contra los `.jsonc` anteriores: solo cambió lo esperado
    (fechas de encabezado, y el código especial de requisitos de R19 que
    ahora viene concatenado `"A1CS1S"` en vez de `"A1C S1S"` — R19 ya está
    excluida de la app, sin impacto funcional). Todo lo demás
    (prerrequisitos, horarios, profesores) es idéntico. `npm run build`
    limpio en los 4 workspaces.
- **Tiempo invertido:** 1h 15min

### `materias.jsonc` — `creditos` llenado (bug real destapado en uso real)
- **Descripción:** el usuario probó la retícula aprobando semestres I-VI
  y las materias de especialidad (60% créditos) seguían bloqueadas.
  Causa raíz: `creditos` estaba en `null` en las 54 materias, así que
  `creditosTotalPlan` sumaba 0 y la fracción del requisito
  `porcentajeCreditos` daba 0% siempre, sin importar cuánto se aprobara —
  no era un bug de lógica, era la consecuencia directa del hueco de datos
  que ya se había dejado documentado. Se llenó `creditos` a mano desde la
  imagen oficial (formato "T-P-C", se usa el crédito). ⚠️ Menos confiable
  que `semestre` (no hay con qué cruzarlo): suma 241 para semestres I-VIII
  contra ~235 que muestra el resumen de la imagen — puede haber 2-3
  materias con el número real distinto. Verificado con el mismo escenario
  de la captura del usuario (semestres I-VI aprobados): 72.2%, desbloquea
  A18/C16 correctamente. `npm run build` limpio.
- **Tiempo invertido:** 25 min

### Caché del backend no se refrescaba con datos editados a mano

- **Descripción:** el fix de créditos no se veía reflejado en la app aunque
  el archivo en disco ya tenía los valores correctos. Causa: `cargarDatos.ts`
  cachea los `.jsonc` en memoria al primer request y solo se refresca
  reiniciando el proceso — y `tsx watch` no reinicia por cambios en esos
  archivos porque se leen con `readFileSync`, no como módulo importado, así
  que no entran en su grafo de dependencias. El servidor de la sesión
  anterior se quedó sirviendo datos viejos (creditos: null) sin que nada lo
  avisara. `cargarDatosAcademicos()` ahora compara el mtime de los 5
  `.jsonc` en cada request y sólo relee disco si cambió — se sigue
  cacheando en el caso normal, pero un edit manual a los datos ya no
  requiere apagar y prender el backend. `npm run build` limpio, verificado
  contra el mismo escenario del usuario (semestres I-VI aprobados).
- **Tiempo invertido:** 20 min

### Ajustes visuales a /plan: proporción de columnas y alineación de horas

- **Descripción:** columna de restricciones/resultados cambiada de 50/50 a
  30/70 (`grid-cols-[3fr_7fr]`) — las cuadrículas semanales necesitan más
  ancho, son el contenido que el usuario realmente compara. Además, la
  columna de horas de `CuadriculaSemanal` no tenía un espaciador
  equivalente al encabezado "Lun/Mar/.../Vie" de las columnas de días, así
  que las etiquetas de hora quedaban corridas hacia arriba respecto a los
  bloques reales; se agregó un spacer invisible con la misma altura del
  encabezado. Verificado con capturas (Playwright) antes/después y
  confirmado por el usuario contra lo que él veía.
- **Tiempo invertido:** 30 min

### Scheduler: subconjunto máximo en vez de todo-o-nada, + bug real en profesoresAEvitar

- **Descripción:** `generarHorarios` exigía que TODAS las materias
  seleccionadas cupieran sin choques — un solo choque entre dos materias
  tumbaba el 100% de los resultados en vez de ofrecer lo mejor posible.
  Reescrito con backtracking de inclusión/exclusión + branch-and-bound
  (poda por cota superior `incluidas + restantes < mejorTamañoGlobal`,
  semilla inicial validada por un greedy rápido): ahora busca el
  subconjunto más grande de materias que sí cabe, regresa TODOS los
  empates de ese tamaño máximo (hasta `maxResultados`), y cada horario
  resultante trae `materiasExcluidas` con el motivo concreto (choque
  específico contra qué materia/grupo, o explicación genérica si la
  exclusión fue una decisión de combinación y no un choque directo).
  `PlanDeHorario.tsx` ahora muestra ese detalle por opción. De paso,
  probando con datos reales via curl directo al backend, apareció un bug
  independiente y preexistente: `profesoresAEvitar` llega del body como
  arreglo JSON plano pero el scheduler esperaba un `Set` real (`.has()`)
  — cualquier request real con al menos un profesor a evitar tronaba el
  endpoint con 500. Corregido en el controller. Verificado con: prueba
  unitaria sintética (2 pares de materias en conflicto, confirma 4
  combinaciones empatadas con motivo exacto por exclusión), prueba contra
  datos reales del dataset (10 materias sin choque, caben las 10), y
  prueba end-to-end real vía POST /api/horarios forzando un choque real
  (C16 vs C12) con profesoresAEvitar — confirma 3/4 incluidas, C16
  excluida con motivo correcto, 28 combinaciones empatadas. `npm run
  build` limpio en schedule-engine, backend y frontend.
- **Tiempo invertido:** 1h 10min

---

## Tiempo total invertido

**14h 10min**

_Nota sobre el método:_ los tiempos se calculan a partir de marcas de
tiempo reales (commits de git, fecha de modificación de archivos) cuando
existen; cuando una tarea no deja marcas de tiempo exactas para separar de
otra, se reparte con una estimación razonable según la complejidad
relativa. A partir de ahora, cada punto que cerremos se cronometra igual
y se suma aquí.
