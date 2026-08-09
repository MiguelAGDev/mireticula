// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Arranque del servidor Express: middlewares base (cors,
// JSON body parser), monta el router de la API bajo /api, y escucha.

// Last Update: 2026-08-08
// Description: Puerto por defecto cambiado de 3001 a 3010 — un proceso
// huérfano de una sesión de pruebas se quedó pegado en 3001 y no hay
// forma de matarlo desde ahí, así que el proyecto se mueve de puerto en
// vez de seguir peleando con eso. vite.config.ts se actualizó a la par.

import cors    from "cors";
import express from "express";
import { router } from "./routes/index.js";

const PORT = process.env.PORT ? Number( process.env.PORT ) : 3010;

const app = express();
app.use( cors() );
app.use( express.json() );
app.use( "/api", router );

app.listen( PORT, () => {
  console.log( `Mi Retícula backend escuchando en http://localhost:${PORT}` );
} );
