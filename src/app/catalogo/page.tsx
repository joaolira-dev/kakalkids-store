import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CatalogFiltersPanel } from "@/components/catalog/catalog-filters";
import { ProductCard } from "@/components/catalog/product-card";
import {
  catalogHref,
  countActiveFilters,
  emptyFilters,
  PAGE_SIZE,
  parseFilters,
  toggleHref,
} from "@/lib/catalog/filters";
import { getCatalogProducts, getFilterOptions } from "@/lib/catalog/queries";
import {
  ageGroupLabels,
  genderLabels,
  sortLabels,
  type CatalogFilters,
  type SortOption,
} from "@/lib/catalog/types";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Roupas infantis e teen para meninas e meninos, do RN aos 18 anos.",
};

export default function CatalogPage({ searchParams }: PageProps<"/catalogo">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6">
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function pageTitle(filters: CatalogFilters) {
  if (filters.busca) return `Resultados para “${filters.busca}”`;
  if (filters.promocao && countActiveFilters(filters) === 1) return "Promoções";
  const parts: string[] = [];
  if (filters.genero.length === 1) parts.push(genderLabels[filters.genero[0]]);
  if (filters.idade.length === 1) parts.push(ageGroupLabels[filters.idade[0]]);
  if (parts.length) return parts.join(", ");
  if (filters.ordem === "novidades" && countActiveFilters(filters) === 0) return "Novidades";
  return "Todos os produtos";
}

async function Catalog({ searchParams }: { searchParams: PageProps<"/catalogo">["searchParams"] }) {
  const filters = parseFilters(await searchParams);
  const [options, { products, total }] = await Promise.all([
    getFilterOptions(),
    getCatalogProducts(filters),
  ]);

  const colorHex = Object.fromEntries(options.colors.map((c) => [c.name, c.hex]));
  const activeCount = countActiveFilters(filters);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">{pageTitle(filters)}</h1>
          <p className="mt-2 text-marinho-soft" aria-live="polite">
            {total === 1 ? "1 peça encontrada" : `${total} peças encontradas`}
          </p>
        </div>
        <SortLinks filters={filters} />
      </header>

      {activeCount > 0 && <ActiveFilters filters={filters} />}

      <div className="mt-8 grid gap-10 lg:grid-cols-[16rem_1fr]">
        {/* Filtros: gaveta no mobile, coluna fixa no desktop */}
        <details className="group rounded-3xl border-2 border-marinho/10 bg-white/60 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 font-display text-lg font-semibold">
            <SlidersHorizontal className="size-5" aria-hidden="true" />
            Filtrar
            {activeCount > 0 && (
              <span className="rounded-full bg-sol px-2 text-sm">{activeCount}</span>
            )}
          </summary>
          <div className="border-t-2 border-marinho/10 px-5 py-6">
            <CatalogFiltersPanel filters={filters} options={options} />
          </div>
        </details>
        <aside aria-label="Filtros" className="hidden lg:block">
          <CatalogFiltersPanel filters={filters} options={options} />
        </aside>

        <section aria-label="Produtos">
          {products.length === 0 ? (
            <EmptyState hasFilters={activeCount > 0 || !!filters.busca} />
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
                {products.map((product, i) => (
                  <li key={product.id}>
                    <ProductCard product={product} colorHex={colorHex} priority={i < 3} />
                  </li>
                ))}
              </ul>
              {totalPages > 1 && <Pagination filters={filters} totalPages={totalPages} />}
            </>
          )}
        </section>
      </div>
    </>
  );
}

function SortLinks({ filters }: { filters: CatalogFilters }) {
  return (
    <nav aria-label="Ordenar por" className="flex flex-wrap items-center gap-1 rounded-full bg-white p-1 ring-2 ring-marinho/10">
      {(Object.keys(sortLabels) as SortOption[]).map((option) => {
        const active = filters.ordem === option;
        return (
          <Link
            key={option}
            href={catalogHref({ ...filters, ordem: option, pagina: 1 })}
            aria-current={active ? "true" : undefined}
            scroll={false}
            className={`rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${active ? "bg-sol" : "hover:bg-creme-dark"}`}
          >
            {sortLabels[option]}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveFilters({ filters }: { filters: CatalogFilters }) {
  const chips: { label: string; href: string }[] = [
    ...filters.genero.map((v) => ({ label: genderLabels[v], href: toggleHref(filters, "genero", v) })),
    ...filters.idade.map((v) => ({ label: ageGroupLabels[v], href: toggleHref(filters, "idade", v) })),
    ...filters.categoria.map((v) => ({ label: v.replace(/-/g, " "), href: toggleHref(filters, "categoria", v) })),
    ...filters.tamanho.map((v) => ({ label: `Tam. ${v}`, href: toggleHref(filters, "tamanho", v) })),
    ...filters.cor.map((v) => ({ label: v, href: toggleHref(filters, "cor", v) })),
    ...(filters.promocao
      ? [{ label: "Em promoção", href: catalogHref({ ...filters, promocao: false, pagina: 1 }) }]
      : []),
  ];

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.href}
          href={chip.href}
          scroll={false}
          className="inline-flex items-center gap-1.5 rounded-full bg-turquesa px-3.5 py-1.5 text-sm font-bold capitalize"
        >
          <span className="sr-only">Remover filtro </span>
          {chip.label}
          <X className="size-4" aria-hidden="true" />
        </Link>
      ))}
      <Link
        href={catalogHref({ ...emptyFilters, busca: filters.busca, colecao: filters.colecao, ordem: filters.ordem })}
        scroll={false}
        className="px-2 text-sm font-bold underline underline-offset-4"
      >
        Limpar filtros
      </Link>
    </div>
  );
}

function Pagination({ filters, totalPages }: { filters: CatalogFilters; totalPages: number }) {
  const { pagina } = filters;
  return (
    <nav aria-label="Paginação" className="mt-12 flex items-center justify-center gap-3">
      {pagina > 1 && (
        <Link
          href={catalogHref({ ...filters, pagina: pagina - 1 })}
          className="rounded-full bg-white px-5 py-2.5 font-bold ring-2 ring-marinho/15 hover:ring-marinho"
        >
          Anterior
        </Link>
      )}
      <span className="text-marinho-soft">
        Página {pagina} de {totalPages}
      </span>
      {pagina < totalPages && (
        <Link
          href={catalogHref({ ...filters, pagina: pagina + 1 })}
          className="rounded-full bg-marinho px-5 py-2.5 font-bold text-creme hover:bg-cobalto"
        >
          Próxima
        </Link>
      )}
    </nav>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-[2rem] bg-white/70 px-6 py-16 text-center">
      <h2 className="text-2xl">Nenhuma peça encontrada</h2>
      <p className="mt-2 max-w-sm text-marinho-soft">
        {hasFilters
          ? "Tente tirar alguns filtros ou escolher outro tamanho."
          : "Os produtos ainda estão sendo cadastrados. Volte em breve!"}
      </p>
      {hasFilters && (
        <Link
          href="/catalogo"
          className="mt-6 rounded-full bg-marinho px-6 py-3 font-display font-semibold text-creme hover:bg-cobalto"
        >
          Ver todos os produtos
        </Link>
      )}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
      <div className="h-12 w-64 rounded-full bg-creme-dark" />
      <div className="mt-3 h-5 w-40 rounded-full bg-creme-dark" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
        <div className="hidden h-96 rounded-3xl bg-creme-dark lg:block" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[4/5] rounded-[1.75rem] bg-creme-dark" />
          ))}
        </div>
      </div>
    </div>
  );
}
