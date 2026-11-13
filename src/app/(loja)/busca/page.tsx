import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getFilterOptions } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Buscar" };

export default async function SearchPage() {
  const { categories } = await getFilterOptions();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-24 sm:px-6">
      <h1 className="text-4xl sm:text-5xl">O que você procura?</h1>
      <form action="/catalogo" role="search" className="relative mt-8">
        <label htmlFor="busca" className="sr-only">
          Buscar produtos
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-5 size-6 -translate-y-1/2 text-marinho-soft" aria-hidden="true" />
        <input
          id="busca"
          name="busca"
          type="search"
          autoFocus
          required
          minLength={2}
          placeholder="Vestido, conjunto, body…"
          className="h-16 w-full rounded-full border-3 border-marinho/15 bg-white pr-32 pl-14 text-lg focus:border-marinho focus:outline-none"
        />
        <button
          type="submit"
          className="absolute top-1/2 right-2 h-12 -translate-y-1/2 rounded-full bg-marinho px-6 font-display text-lg font-semibold text-creme hover:bg-cobalto"
        >
          Buscar
        </button>
      </form>

      {categories.length > 0 && (
        <nav aria-label="Categorias" className="mt-10">
          <h2 className="text-xl">Ou navegue por categoria</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/catalogo?categoria=${c.slug}`}
                  className="inline-block rounded-full bg-white px-4 py-2.5 font-semibold ring-2 ring-marinho/10 hover:ring-marinho"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
