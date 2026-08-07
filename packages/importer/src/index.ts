#!/usr/bin/env node
// CLI: Excel -> JSONC. Se corre manualmente (o vía admin en el futuro)
// cada semestre; no es una dependencia en tiempo de ejecución de apps/backend.
//
// Uso:
//   npm run start --workspace=packages/importer -- <ruta-excel> [carpeta-salida]
// Por defecto lee ./dataset_mireticula.xlsx en la raíz del repo y escribe
// en apps/backend/src/data.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { leerOfertaAcademica } from "./excel-reader/index.js";
import { construirModelo, nombrePorClaveDesdeMateria } from "./build-model.js";
import {
  escribirCarrerasJsonc,
  escribirGruposJsonc,
  escribirMateriasJsonc,
  escribirPrerrequisitosJsonc,
  escribirProfesoresJsonc,
} from "./json-writer/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

async function main() {
  const rutaExcel = process.argv[2] ?? path.join(REPO_ROOT, "dataset_mireticula.xlsx");
  const carpetaSalida = process.argv[3] ?? path.join(REPO_ROOT, "apps/backend/src/data");

  console.log(`Leyendo oferta académica de: ${rutaExcel}`);
  const filas = leerOfertaAcademica(rutaExcel);
  console.log(`  ${filas.length} filas (sesiones de grupo) leídas.`);

  const modelo = construirModelo(filas);
  const nombresPorClave = nombrePorClaveDesdeMateria(modelo.materias);
  const nombresPorProfesorId = new Map(modelo.profesores.map((p) => [p.id, p.nombre]));

  await Promise.all([
    escribirCarrerasJsonc(modelo.carreras, nombresPorClave, path.join(carpetaSalida, "carreras.jsonc")),
    escribirMateriasJsonc(modelo.materias, path.join(carpetaSalida, "materias.jsonc")),
    escribirProfesoresJsonc(modelo.profesores, path.join(carpetaSalida, "profesores.jsonc")),
    escribirGruposJsonc(modelo.grupos, nombresPorClave, nombresPorProfesorId, path.join(carpetaSalida, "grupos.jsonc")),
    escribirPrerrequisitosJsonc(modelo.prerrequisitos, nombresPorClave, path.join(carpetaSalida, "prerrequisitos.jsonc")),
  ]);

  console.log(`\nArchivos generados en: ${carpetaSalida}`);
  console.log("  carreras.jsonc, materias.jsonc, profesores.jsonc, grupos.jsonc, prerrequisitos.jsonc");

  console.log("\nResumen:");
  console.log(`  Materias:                    ${modelo.resumen.totalMaterias}`);
  console.log(`  Grupos (sesiones de oferta):  ${modelo.resumen.totalGrupos}`);
  console.log(`  Profesores:                   ${modelo.profesores.length}`);
  console.log(`  Materias con requisitos:      ${modelo.resumen.totalMateriasConRequisitos}`);
  console.log(`  Requisitos especiales:        ${modelo.resumen.totalRequisitosEspeciales}`);
}

main().catch((err) => {
  console.error("Error al importar:", err);
  process.exitCode = 1;
});
