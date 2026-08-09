// Author: MiguelAGDev
// Date: 2026-08-08
// Description: 👍/👎 + comentario por horario (paso 7 del flujo). v1.0
// no tiene backend de feedback (sin base de datos, ver PROYECTO.md) —
// vive como estado local de la pantalla, no se persiste.

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

import { useState } from "react";

type Voto = "up" | "down" | null;

function FeedbackHorario() {
  const [ voto, setVoto ] = useState<Voto>( null );
  const [ comentario, setComentario ] = useState( "" );
  const [ enviado, setEnviado ] = useState( false );

  if ( enviado ) {
    return <p className="text-xs text-slate-500">Gracias por tu feedback.</p>;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-slate-800 pt-2 text-xs">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setVoto( "up" )}
          className={`rounded-md border px-2 py-1 ${voto === "up" ? "border-emerald-500 bg-emerald-950" : "border-slate-700"}`}
        >
          👍
        </button>
        <button
          type="button"
          onClick={() => setVoto( "down" )}
          className={`rounded-md border px-2 py-1 ${voto === "down" ? "border-red-500 bg-red-950" : "border-slate-700"}`}
        >
          👎
        </button>
      </div>
      <textarea
        placeholder="Comentario (opcional)"
        value={comentario}
        onChange={( e ) => setComentario( e.target.value )}
        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
        rows={2}
      />
      <button
        type="button"
        disabled={!voto}
        onClick={() => setEnviado( true )}
        className="self-start rounded-md bg-slate-700 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Enviar
      </button>
    </div>
  );
}

export default FeedbackHorario;
