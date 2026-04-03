"use client";

import { useEffect, useState } from "react";

interface CategoryPhaseUIProps {
  isHost: boolean;
  onSelectCategory: (category: string) => void;
}

export function CategoryPhaseUI({
  isHost,
  onSelectCategory,
}: CategoryPhaseUIProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = ["Aleatorio", ...categories];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/categories`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar las categorias.");
        }
        const data = await response.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        setError("No se pudieron cargar las categorias.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="mx-auto w-full max-w-5xl rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-950/80 p-6 text-left shadow-2xl shadow-cyan-500/10 backdrop-blur">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Fase de seleccion</p>
        <h2 className="font-display text-3xl sm:text-4xl">Elige la categoria de la ronda</h2>
        <p className="text-base text-slate-300">
          {isHost
            ? "Solo el host puede seleccionar la categoria."
            : "Esperando a que el host seleccione la categoria."}
        </p>
      </header>

      <div className="mt-6">
        {isLoading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-6 text-center text-slate-300">
            Cargando categorias...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-center text-rose-200">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((category) => {
              const isRandom = category === "Aleatorio";
              return (
                <button
                  key={category}
                  type="button"
                  className={`group flex min-h-[72px] flex-col items-start justify-center rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                    isRandom
                      ? "border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                      : "border-slate-700 bg-slate-900/60 text-slate-100 hover:border-cyan-400/40 hover:bg-slate-900"
                  } ${!isHost ? "cursor-not-allowed opacity-60" : "hover:-translate-y-0.5"}`}
                  onClick={() => onSelectCategory(isRandom ? "random" : category)}
                  disabled={!isHost}
                >
                  <span className="text-lg font-semibold">
                    {category}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400 group-hover:text-cyan-200">
                    {isRandom ? "Sorpresa" : "Seleccion"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
