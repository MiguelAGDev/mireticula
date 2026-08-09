// Author: MiguelAGDev
// Date: 2026-08-08
// Description: Pantalla de Inicio: bienvenida y botón "Comenzar" (sin
// navegación funcional todavía, se conecta cuando exista Selección de
// Carrera).

// Last Update: 2026-08-08
// Description: Encabezado inicial, sin cambios de contenido.

function Inicio() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-slate-100">
      <h1 className="text-4xl font-bold">Mi Retícula</h1>
      <p className="max-w-md text-slate-400">
        Genera los mejores horarios posibles para Ingeniería en Sistemas
        Computacionales del Tec Laguna, y entiende por qué cada uno fue
        seleccionado.
      </p>
      <button
        type="button"
        className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-500"
      >
        Comenzar
      </button>
    </main>
  );
}

export default Inicio;
