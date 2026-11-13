import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Search } from "lucide-react";
import { ProductFlagToggle } from "@/components/admin/product-flag-toggle";
import { ProductPlaceholder } from "@/components/catalog/product-placeholder";
import { listAdminProducts, type ProductListFilter } from "@/lib/admin/products";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Produtos" };

const filters: { value: ProductListFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
  { value: "sem-estoque", label: "Sem estoque" },
];

export default function ProductsPage({ searchParams }: PageProps<"/admin/produtos">) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center gap-2 rounded-full bg-rosa px-5 py-3 font-display text-lg font-semibold text-white hover:-translate-y-0.5"
        >
          <Plus className="size-5" aria-hidden="true" />
          Novo produto
        </Link>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="mt-6 h-96 animate-pulse rounded-3xl bg-creme-dark" />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProductList({ searchParams }: { searchParams: PageProps<"/admin/produtos">["searchParams"] }) {
  const params = await searchParams;
  const search = typeof params.busca === "string" && params.busca.trim() ? params.busca.trim().slice(0, 60) : null;
  const rawFilter = typeof params.filtro === "string" ? params.filtro : "todos";
  const filter = (filters.some((f) => f.value === rawFilter) ? rawFilter : "todos") as ProductListFilter;

  const products = await listAdminProducts({ search, filter });

  const href = (f: ProductListFilter) => {
    const p = new URLSearchParams();
    if (f !== "todos") p.set("filtro", f);
    if (search) p.set("busca", search);
    const qs = p.toString();
    return qs ? `/admin/produtos?${qs}` : "/admin/produtos";
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtrar produtos" className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={href(f.value)}
              aria-current={filter === f.value ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 font-bold ${filter === f.value ? "bg-marinho text-creme" : "bg-white hover:bg-creme-dark"}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/produtos" className="relative w-full sm:w-72">
          {filter !== "todos" && <input type="hidden" name="filtro" value={filter} />}
          <label htmlFor="busca" className="sr-only">
            Buscar produto
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-marinho-soft" aria-hidden="true" />
          <input
            id="busca"
            name="busca"
            defaultValue={search ?? ""}
            placeholder="Buscar pelo nome"
            className="h-11 w-full rounded-full border-2 border-marinho/15 bg-white pr-4 pl-10 focus:border-marinho focus:outline-none"
          />
        </form>
      </div>

      {products.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">Nenhum produto encontrado</p>
          <p className="mt-1 text-marinho-soft">
            {search || filter !== "todos" ? "Tente outro filtro ou busca." : "Cadastre o primeiro produto da loja."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl bg-white ring-2 ring-marinho/5">
          <table className="w-full min-w-[52rem] text-left">
            <thead className="border-b-2 border-marinho/10 text-sm text-marinho-soft">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Produto</th>
                <th scope="col" className="px-5 py-3 font-semibold">Preço</th>
                <th scope="col" className="px-5 py-3 font-semibold">Estoque</th>
                <th scope="col" className="px-5 py-3 font-semibold">Ativo</th>
                <th scope="col" className="px-5 py-3 font-semibold">Destaque</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="relative border-t border-marinho/5 hover:bg-creme/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-creme-dark">
                        {p.cover ? (
                          <Image src={p.cover} alt="" fill sizes="3.5rem" className="object-cover" />
                        ) : (
                          <ProductPlaceholder seed={p.slug} className="absolute inset-0" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/produtos/${p.id}`}
                          className="font-semibold after:absolute after:inset-0 hover:underline"
                        >
                          {p.name}
                        </Link>
                        <p className="text-sm text-marinho-soft">{p.category ?? "Sem categoria"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {p.compare_at_price && (
                      <s className="block text-sm text-marinho-soft">{formatPrice(p.compare_at_price)}</s>
                    )}
                    <span className="font-semibold">{formatPrice(p.base_price)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${p.total_stock === 0 ? "text-coral" : ""}`}>
                      {p.total_stock === 0 ? "Esgotado" : `${p.total_stock} peças`}
                    </span>
                    <p className="text-sm text-marinho-soft">
                      {p.variant_count} variações
                      {p.sold_out_variants > 0 && p.total_stock > 0 && ` · ${p.sold_out_variants} esgotadas`}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <ProductFlagToggle productId={p.id} flag="active" value={p.active} label={`Produto ${p.name} ativo`} />
                  </td>
                  <td className="px-5 py-3">
                    <ProductFlagToggle productId={p.id} flag="featured" value={p.featured} label={`Produto ${p.name} em destaque`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
