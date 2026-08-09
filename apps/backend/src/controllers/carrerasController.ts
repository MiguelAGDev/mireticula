// Author: MiguelAGDev
// Date: 2026-08-08
// Description: GET /api/carreras — catálogo de carreras (Selección de
// carrera). Solo lee datos y responde JSON, sin lógica de negocio.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import type { Request, Response } from "express";
import { cargarDatosAcademicos } from "../data/cargarDatos.js";

export function listarCarreras( _req: Request, res: Response ): void {
  const { carreras } = cargarDatosAcademicos();
  res.json( { carreras } );
}
