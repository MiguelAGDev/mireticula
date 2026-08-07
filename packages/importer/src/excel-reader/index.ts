// Author: MiguelAGDev
// Date: 2026-08-06
// Description: Lee el Excel de oferta académica y lo convierte en filas
// tipadas. Una fila del Excel == una fila de la hoja "oferta académica"
// del contexto del proyecto: una sesión de un grupo de una materia.

// Last Update: 2026-08-06
// Description: Encabezado inicial y espaciado de paréntesis/llaves/
// corchetes según la convención de CLAUDE.md.

// El paquete xlsx (SheetJS) no expone `readFile`/`utils` como named exports
// bajo ESM (solo vía `default`), así que se importa el default y se
// desestructura desde ahí.
import pkg from "xlsx";
const { readFile, utils } = pkg;
import type { Dia, Sesion } from "@mi-reticula/shared-types";

const DIA_COLUMNAS: Record<Dia, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
};

export interface RawRow {
  clave: string;
  grupo: string;
  materia: string;
  catedratico: string;
  porcentajeNecesario: number;
  requisitos: string | null;
  correquisitos: string | null;
  sesiones: Sesion[];
}

interface RawSheetRow {
  Clave: string;
  Grupo: string;
  Materia: string;
  Lunes: string | null;
  Martes: string | null;
  Miércoles: string | null;
  Jueves: string | null;
  Viernes: string | null;
  "Catedrático": string;
  "%Necesario": number | null;
  Requisitos: string | null;
  Correquisitos: string | null;
}

/**
 * Convierte el contenido de una celda de día ("HH:MM-HH:MM/AULA" o "-/")
 * en una Sesion, o null si ese día no hay clase.
 */
function parseCeldaDia( dia: Dia, valor: string | null ): Sesion | null {
  if ( !valor || valor.trim() === "" || valor.trim() === "-/" ) return null;

  const [ horas, aula ] = valor.split( "/" );
  const [ horaInicio, horaFin ] = horas.split( "-" );
  if ( !horaInicio || !horaFin ) {
    throw new Error( `Celda de horario con formato inesperado: "${valor}" (día ${dia})` );
  }

  return { dia, horaInicio, horaFin, aula: aula ?? "" };
}

export function leerOfertaAcademica( rutaExcel: string ): RawRow[] {
  const workbook = readFile( rutaExcel );
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const filas = utils.sheet_to_json<RawSheetRow>( hoja, { defval: null } );

  return filas.map( ( fila ): RawRow => {
    const sesiones: Sesion[] = [];
    for ( const dia of Object.keys( DIA_COLUMNAS ) as Dia[] ) {
      const columna = DIA_COLUMNAS[dia] as keyof RawSheetRow;
      const sesion = parseCeldaDia( dia, fila[columna] as string | null );
      if ( sesion ) sesiones.push( sesion );
    }

    return {
      clave: fila.Clave,
      grupo: fila.Grupo,
      materia: fila.Materia,
      catedratico: fila["Catedrático"],
      porcentajeNecesario: fila["%Necesario"] ?? 0,
      requisitos: fila.Requisitos,
      correquisitos: fila.Correquisitos,
      sesiones,
    };
  } );
}
