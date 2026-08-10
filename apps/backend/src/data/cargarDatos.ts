// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Lee los .jsonc generados por packages/importer (JSON +
// comentarios) y los regresa ya tipados. Se cachean en memoria para no
// releer disco en cada request.

// Last Update: 2026-08-09
// Description: La caché se invalida sola comparando el mtime de los
// archivos — antes solo se refrescaba reiniciando el proceso, y como
// `tsx watch` no reinicia por cambios en .jsonc (se leen con
// readFileSync, no como módulo importado), un edit a mano a los datos
// nunca se veía reflejado hasta apagar y prender el backend a mano.
// Con esto, editar un .jsonc en disco se refleja en la siguiente
// request sin tener que tocar el proceso.

import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Carrera, Grupo, Materia, PrerrequisitosMateria, Profesor } from "@mi-reticula/shared-types";

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const ARCHIVOS_DATOS = [ "carreras.jsonc", "materias.jsonc", "profesores.jsonc", "grupos.jsonc", "prerrequisitos.jsonc" ];

function mtimeMasReciente(): number {
  return Math.max( ...ARCHIVOS_DATOS.map( ( nombre ) => statSync( path.join( __dirname, nombre ) ).mtimeMs ) );
}

export interface DatosAcademicos {
  carreras: Carrera[];
  materias: Materia[];
  profesores: Profesor[];
  grupos: Grupo[];
  prerrequisitos: PrerrequisitosMateria[];
}

/**
 * Quita los comentarios `//` que agrega packages/importer para poder
 * parsear el archivo con JSON.parse normal. Dos pasadas porque hay dos
 * formas de comentario en estos archivos:
 *  1. Líneas de comentario completas (el encabezado, las líneas de
 *     descripción) — pueden contener comillas (ej. `// - "prerrequisito": ...`),
 *     así que se quita la línea entera sin importar su contenido.
 *  2. Comentarios al final de una línea con datos reales (ej.
 *     `"materiaClave": "C16", // ADMINISTRACION DE BASE DE DATOS`) — esos
 *     nunca traen comillas, así que se puede cortar justo en el `//`.
 */
function quitarComentarios( jsonc: string ): string {
  const sinLineasDeComentario = jsonc.replace( /^\s*\/\/.*$/gm, "" );
  const sinComentariosAlFinal = sinLineasDeComentario.replace( /\/\/[^\n"]*$/gm, "" );
  return sinComentariosAlFinal;
}

function leerJsonc<T>( nombreArchivo: string ): T {
  const ruta = path.join( __dirname, nombreArchivo );
  const contenido = readFileSync( ruta, "utf-8" );
  return JSON.parse( quitarComentarios( contenido ) ) as T;
}

let datosCacheados: DatosAcademicos | null = null;
let mtimeCacheado = -1;

export function cargarDatosAcademicos(): DatosAcademicos {
  const mtimeActual = mtimeMasReciente();
  if ( datosCacheados && mtimeActual === mtimeCacheado ) return datosCacheados;

  mtimeCacheado = mtimeActual;
  datosCacheados = {
    carreras: leerJsonc<Carrera[]>( "carreras.jsonc" ),
    materias: leerJsonc<Materia[]>( "materias.jsonc" ),
    profesores: leerJsonc<Profesor[]>( "profesores.jsonc" ),
    grupos: leerJsonc<Grupo[]>( "grupos.jsonc" ),
    prerrequisitos: leerJsonc<PrerrequisitosMateria[]>( "prerrequisitos.jsonc" ),
  };
  return datosCacheados;
}
