// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Router raíz de la API: mapea método+ruta a su controller.
// No lleva lógica propia — solo cableado.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import { Router } from "express";
import { listarCarreras } from "../controllers/carrerasController.js";
import { listarEstadoMaterias } from "../controllers/materiasController.js";
import { generarHorariosController } from "../controllers/horariosController.js";

export const router = Router();

router.get( "/carreras", listarCarreras );
router.get( "/materias", listarEstadoMaterias );
router.post( "/horarios", generarHorariosController );
