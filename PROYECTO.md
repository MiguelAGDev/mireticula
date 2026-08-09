# Mi Retícula — Propósito, plan y estado del proyecto

Este documento es la foto completa del proyecto: qué es, para qué sirve, cómo está pensado que funcione, qué hace falta, y qué tan avanzado va. Es para ti (o para cualquier persona que se una al proyecto) — no hace falta releer el chat para entender dónde estamos.

---

## 1. Qué es Mi Retícula

**Mi Retícula** es una aplicación web para estudiantes de Ingeniería en Sistemas Computacionales (ISC) del Tec Laguna. El problema que resuelve: cada semestre, armar un horario a mano —cruzando materias, grupos, profesores, horarios y prerrequisitos— toma tiempo y es fácil terminar con un horario peor del que se pudo haber tenido. La app genera automáticamente los mejores horarios posibles a partir de la oferta académica real y de las preferencias del estudiante.

**El diferenciador clave es el modo de explicación.** La mayoría de herramientas de este tipo solo escupen un horario. Esta no: para cada horario generado, explica *por qué* fue seleccionado y qué restricciones influyeron en su puntuación. Y si no existe ningún horario válido con las restricciones dadas, explica la causa concreta (ej. "la materia X y la Y siempre chocan en todos sus grupos") en vez de solo fallar sin decir nada.

## 2. Alcance de v1.0

Lo que **sí** entra:
- Solo la carrera de Ingeniería en Sistemas Computacionales, Tec Laguna.
- Toda la información vive local: no hay usuarios, no hay login, no hay base de datos.
- La fuente de datos es un Excel (`dataset_mireticula.xlsx`) que se convierte a JSON una vez por semestre.

Lo que **no** entra en v1.0 (ver sección 6, "Ideas futuras"): otras carreras/universidades, cuentas de usuario, comparar horarios lado a lado, exportar a PDF, etc.

## 3. Propósito de cada pieza (arquitectura)

El repo es un monorepo con `apps/` (lo que corre) y `packages/` (lo que se comparte/reutiliza):

```
mi-reticula/
├── apps/
│   ├── frontend/        # React + Vite — la interfaz que usa el estudiante
│   └── backend/         # Express — expone los datos y el motor por HTTP
├── packages/
│   ├── schedule-engine/ # La lógica real de generar y puntuar horarios
│   ├── importer/        # CLI: convierte el Excel de oferta académica a JSON
│   └── shared-types/    # Los tipos (Materia, Grupo, Horario...) que todos comparten
```

**Por qué está separado así:**

- **`schedule-engine` no depende de nada de `apps/`.** Es lógica pura de TypeScript (sin Express, sin React). Solo `apps/backend` lo usa. La razón: si mañana quisiéramos una app de escritorio, un CLI, o cambiar de framework de backend, el motor de horarios se reutiliza tal cual — no está atado a Express.
- **`shared-types` vive en `packages/`, no adentro de un app**, porque tanto `frontend` como `backend` lo necesitan, y ninguno de los dos debe depender del otro directamente. Con los workspaces de npm, ambos lo instalan como si fuera una librería normal (`"@mi-reticula/shared-types": "*"`), y así hay una sola definición de "qué es una Materia" en todo el proyecto — si cambia ahí, TypeScript avisa en cualquier lado que haya quedado desactualizado.
- **`importer` no corre en producción.** Es un CLI que alguien ejecuta a mano (o vía un panel de administración, más adelante) una vez por semestre, cuando sale la nueva oferta académica. Convierte el Excel en los `.jsonc` que `apps/backend` lee. El backend nunca toca el Excel directamente.
- **`apps/backend` es delgado a propósito.** Su trabajo es: cargar los JSON, llamarle al `schedule-engine`, devolver el resultado por HTTP. Nada de lógica de horarios vive en un route handler — toda esa lógica está en `schedule-engine`, donde se puede probar de forma aislada.

**Dentro de `schedule-engine`** (todavía no construido, ver sección 7) va a haber tres partes:
- `parser`: convierte el JSON en estructuras tipadas y resuelve el grafo de prerrequisitos (qué materias dependen de qué otras).
- `scheduler`: genera las combinaciones válidas de horario. La estrategia es **backtracking con poda temprana** — descarta una combinación en cuanto rompe una restricción obligatoria, en vez de generar todas las combinaciones posibles y filtrar después (con la oferta completa de materias, generar todo y filtrar sería demasiado lento).
- `scorer`: una función pura que toma un horario y las preferencias del usuario, y devuelve una puntuación **más un desglose estructurado** (no un texto libre) de por qué obtuvo esa puntuación — así el frontend puede pintar cada ✓/✗ directamente, sin tener que interpretar texto.

## 4. Flujo de la aplicación (lo que ve y hace el estudiante)

1. **Inicio** — pantalla de bienvenida con un botón "Comenzar".
2. **Selección de carrera** — por ahora solo aparece ISC, pero la arquitectura permite agregar más carreras después sin rediseñar nada.
3. **Retícula interactiva** — el estudiante ve la retícula oficial y marca qué materias ya aprobó. Cada materia tiene un estado visual: 🟢 aprobada, ⚪ no aprobada, 🔒 bloqueada porque le faltan prerrequisitos, y opcionalmente 🔵 cursándola ahora mismo. Al marcar una materia como aprobada, las que dependían de ella se desbloquean solas.
4. **Configuración de restricciones** — el estudiante define dos tipos de reglas:
   - *Obligatorias* (eliminan horarios que las rompan): créditos mínimos/máximos, hora de entrada/salida, materias que sí o sí quiere cursar, materias a evitar, profesores a evitar.
   - *Preferencias* (no eliminan nada, solo suben o bajan la puntuación): entrar tarde, salir temprano, no tener huecos entre clases, tener los viernes libres.
5. **Generación de horarios** — el `schedule-engine` genera las combinaciones válidas, descarta las que chocan en horario o rompen una restricción obligatoria, puntúa el resto, y se quedan los mejores.
6. **Resultados** — se muestra cada horario como una cuadrícula semanal (materias, profesores, créditos), junto con su puntuación y el desglose de por qué obtuvo esa puntuación.
7. **Feedback** — el estudiante puede darle 👍/👎 a un horario específico y dejar un comentario. (Sirve para ir ajustando el sistema de puntuación con el tiempo.)

## 5. Requisitos

**De datos (entrada):** el Excel de oferta académica trae estas hojas —
- **Carrera** — catálogo de carreras.
- **Materias** — clave, nombre, créditos, semestre.
- **Prerrequisitos** — qué materia requiere a cuál otra.
- **Profesores** — id, nombre.
- **Oferta académica** — una fila por sesión: materia, grupo, profesor, día, hora de inicio/fin, aula.

`packages/importer` procesa eso y genera: `carreras.jsonc`, `materias.jsonc`, `prerrequisitos.jsonc`, `profesores.jsonc`, `grupos.jsonc` — ya funcionando (ver sección 7).

**Funcionales:** el sistema de restricciones vive en dos niveles (obligatorias vs. preferencias, ver sección 4, paso 4) porque no son lo mismo: una obligatoria descarta el horario por completo; una preferencia solo mueve la puntuación hacia arriba o hacia abajo. Esta distinción es la base de cómo funciona `scorer` en `schedule-engine`.

## 6. Roadmap

**Inmediato (v1.0):** Pantalla de inicio · Selección de carrera · Retícula interactiva · Importación desde Excel · Generación de horarios · Restricciones básicas · Puntuación · Visualización en cuadrícula · Feedback sencillo.

**Futuras (fuera de v1.0):** Exportar a PDF/imagen · comparar dos horarios lado a lado · profesores favoritos · varios perfiles · otras carreras/universidades · actualización automática de oferta académica.

## 7. Estado actual

Verificado directamente contra el repo (commits + árbol de archivos):

| Pieza | Estado |
|---|---|
| `packages/shared-types` | ✅ Completo — todos los tipos de dominio definidos. |
| `packages/importer` | ✅ Completo y ya corrido — genera los 5 `.jsonc` en `apps/backend/src/data/` a partir del Excel real. |
| `apps/frontend` | 🟡 Bootstrap listo: Vite + React + TypeScript + Tailwind v4 configurados, compila (`npm run build`) y corre. Solo tiene la **Pantalla de Inicio** (sin navegación real todavía — el botón "Comenzar" no hace nada aún). |
| `apps/backend` | ⬜ No empezado — solo la estructura de carpetas (`routes/`, `controllers/`, `data/`). |
| `packages/schedule-engine` | ⬜ No empezado — solo la estructura de carpetas (`parser/`, `scheduler/`, `scorer/`). Es la pieza más importante que falta: sin esto no hay generación de horarios. |
| Pantallas 2–7 del flujo (Selección de carrera, Retícula interactiva, Restricciones, Resultados, Feedback) | ⬜ No empezadas. |

## 8. Dónde vive cada cosa

| Documento | Para qué sirve |
|---|---|
| `CLAUDE.md` | Contexto para que una sesión de IA (Claude Code, Copilot, etc.) arranque sabiendo el proyecto completo: idea, stack, arquitectura y **convenciones de código obligatorias**. |
| `BITACORA.md` | Registro cronológico: qué se hizo, cuándo, y cuánto tiempo tomó cada tarea. |
| `PROYECTO.md` | Este documento — la foto completa de propósito, plan, flujo, requisitos y estado, pensada para un humano. |
| `README.md` | Lo que tenga configurado como presentación pública/mínima del repo. |
