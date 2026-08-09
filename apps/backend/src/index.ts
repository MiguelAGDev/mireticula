// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Arranque del servidor Express: middlewares base (cors,
// JSON body parser), monta el router de la API bajo /api, y escucha.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import cors    from "cors";
import express from "express";
import { router } from "./routes/index.js";

const PORT = process.env.PORT ? Number( process.env.PORT ) : 3001;

const app = express();
app.use( cors() );
app.use( express.json() );
app.use( "/api", router );

app.listen( PORT, () => {
  console.log( `Mi Retícula backend escuchando en http://localhost:${PORT}` );
} );
