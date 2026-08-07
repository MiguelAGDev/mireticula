// Author: MiguelAGDev
// Date: 2026-08-06
// Description: Escribe el modelo importado como archivos .jsonc (JSON +
// comentarios). JSON estricto no soporta comentarios, así que cada vez
// que un valor es una clave de materia o un id de profesor, se anota con
// un comentario `// Nombre completo` para poder leer el archivo sin
// cruzar contra materias.json / profesores.json constantemente.

// Last Update: 2026-08-06
// Description: Encabezado inicial y espaciado de paréntesis/llaves/
// corchetes según la convención de CLAUDE.md.

import { mkdir, writeFile } from "node:fs/promises";
import path                 from "node:path";
import type {
  Carrera,
  Grupo,
  Materia,
  PrerrequisitosMateria,
  Profesor,
} from "@mi-reticula/shared-types";

/** Claves de objeto cuyo valor (string) puede resolverse a un comentario. */
type ComentarioResolver = ( key: string | null, value: string ) => string | null;

const LINEA_CLAVE_VALOR = /^(\s*)"([^"]+)":\s*"((?:[^"\\]|\\.)*)"(,?)\s*$/;
const LINEA_VALOR_SUELTO = /^(\s*)"((?:[^"\\]|\\.)*)"(,?)\s*$/;

/**
 * Recorre el JSON ya serializado línea por línea y le agrega `// comentario`
 * a las líneas cuyo valor resuelve un comentario vía `resolver`. No es un
 * parser AST-aware: asume el formato estándar de `JSON.stringify(x, null, 2)`
 * (una clave/valor string por línea), suficiente para los modelos planos
 * que genera este importer.
 */
function anotarJson( json: string, resolver: ComentarioResolver ): string {
  return json
    .split( "\n" )
    .map( ( linea ) => {
      const conClave = linea.match( LINEA_CLAVE_VALOR );
      if ( conClave ) {
        const [ , indent, key, value, coma ] = conClave;
        const comentario = resolver( key, value );
        return comentario ? `${indent}"${key}": "${value}"${coma} // ${comentario}` : linea;
      }
      const suelto = linea.match( LINEA_VALOR_SUELTO );
      if ( suelto ) {
        const [ , indent, value, coma ] = suelto;
        const comentario = resolver( null, value );
        return comentario ? `${indent}"${value}"${coma} // ${comentario}` : linea;
      }
      return linea;
    } )
    .join( "\n" );
}

/**
 * Antepone el bloque Author/Date/Description/Last Update (convención de
 * CLAUDE.md) seguido del comentario descriptivo propio de cada archivo
 * generado. Se regenera en cada corrida del importer, así que "Date" y
 * "Last Update" siempre quedan como la fecha de la corrida actual.
 */
function conEncabezado( descripcion: string[], cuerpo: string ): string {
  const fecha = new Date().toISOString().slice( 0, 10 );
  const metadata = [
    "Author: MiguelAGDev",
    `Date: ${fecha}`,
    "Description: Generado automáticamente por packages/importer. No editar a mano.",
    "",
    `Last Update: ${fecha}`,
    "Description: Regenerado desde dataset_mireticula.xlsx.",
    "",
  ];
  const header = [ ...metadata, ...descripcion ].map( ( l ) => ( l === "" ? "//" : `// ${l}` ) ).join( "\n" );
  return `${header}\n${cuerpo}\n`;
}

async function escribirArchivo( rutaSalida: string, contenido: string ): Promise<void> {
  await mkdir( path.dirname( rutaSalida ), { recursive: true } );
  await writeFile( rutaSalida, contenido, "utf-8" );
}

export async function escribirCarrerasJsonc(
  carreras: Carrera[],
  materiasPorClave: Map<string, string>,
  rutaSalida: string,
): Promise<void> {
  const json = JSON.stringify( carreras, null, 2 );
  const anotado = anotarJson( json, ( key, value ) => ( key === null && materiasPorClave.has( value ) ? materiasPorClave.get( value )! : null ) );
  const contenido = conEncabezado(
    [
      "carreras.json — carreras soportadas por Mi Retícula.",
      "v1.0 solo cubre Ingeniería en Sistemas Computacionales (Tec Laguna).",
      "`materias` lista las claves del plan de estudios de la carrera.",
    ],
    anotado,
  );
  await escribirArchivo( rutaSalida, contenido );
}

export async function escribirMateriasJsonc( materias: Materia[], rutaSalida: string ): Promise<void> {
  const json = JSON.stringify( materias, null, 2 );
  const contenido = conEncabezado(
    [
      "materias.json — catálogo de materias de la oferta académica importada.",
      "IMPORTANTE: `creditos` y `semestre` NO vienen en dataset_mireticula.xlsx,",
      "quedan en null. Deben completarse manualmente cruzando contra la",
      "retícula oficial de Ingeniería en Sistemas Computacionales (Tec Laguna).",
    ],
    json,
  );
  await escribirArchivo( rutaSalida, contenido );
}

export async function escribirProfesoresJsonc( profesores: Profesor[], rutaSalida: string ): Promise<void> {
  const json = JSON.stringify( profesores, null, 2 );
  const contenido = conEncabezado(
    [
      "profesores.json — catedráticos que aparecen en la oferta académica.",
      "`id` es un slug derivado del nombre (sin acentos, en minúsculas).",
      "Los grupos con \"MAESTRO POR ASIGNAR\" en el Excel quedan con profesorId: null en grupos.json.",
    ],
    json,
  );
  await escribirArchivo( rutaSalida, contenido );
}

export async function escribirGruposJsonc(
  grupos: Grupo[],
  materiasPorClave: Map<string, string>,
  profesoresPorId: Map<string, string>,
  rutaSalida: string,
): Promise<void> {
  const json = JSON.stringify( grupos, null, 2 );
  const anotado = anotarJson( json, ( key, value ) => {
    if ( key === "materiaClave" && materiasPorClave.has( value ) ) return materiasPorClave.get( value )!;
    if ( key === "profesorId" && profesoresPorId.has( value ) ) return profesoresPorId.get( value )!;
    return null;
  } );
  const contenido = conEncabezado(
    [
      "grupos.json — oferta académica: un elemento por grupo de una materia,",
      "con sus sesiones semanales (día, hora inicio/fin, aula) y el % de",
      "créditos del plan necesario para inscribirlo (porcentajeCreditosNecesario, 0 = no aplica).",
    ],
    anotado,
  );
  await escribirArchivo( rutaSalida, contenido );
}

export async function escribirPrerrequisitosJsonc(
  prerrequisitos: PrerrequisitosMateria[],
  materiasPorClave: Map<string, string>,
  rutaSalida: string,
): Promise<void> {
  const json = JSON.stringify( prerrequisitos, null, 2 );
  const anotado = anotarJson( json, ( key, value ) => {
    if ( ( key === "materiaClave" || key === "clave" ) && materiasPorClave.has( value ) ) {
      return materiasPorClave.get( value )!;
    }
    return null;
  } );
  const contenido = conEncabezado(
    [
      "prerrequisitos.json — requisitos por materia. Solo incluye materias que",
      "tienen al menos un requisito. `requisitos[].tipo` distingue:",
      '  - "prerrequisito": materia que debe estar aprobada (columna Requisitos).',
      '  - "correquisito": materia a cursar junto, o ya aprobada (columna Correquisitos).',
      '  - "porcentajeCreditos": % de créditos del plan que se deben tener aprobados (columna %Necesario > 0).',
      '  - "requisitoEspecial": código en Requisitos/Correquisitos que NO es una clave de materia',
      "    válida del catálogo (ej. servicio social / avance crediticio para Residencia).",
      "    Ver `descripcion` en cada uno para la hipótesis y qué falta confirmar manualmente.",
    ],
    anotado,
  );
  await escribirArchivo( rutaSalida, contenido );
}
