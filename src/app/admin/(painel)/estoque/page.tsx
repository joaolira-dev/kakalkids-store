import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { StockRowActions } from "@/components/admin/stock-row-actions";
import { listStock, listStockMovements, LOW_STOCK, type StockMovement } from "@/lib/admin/stock";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Estoque" };

type View = "repor" | "todos" | "historico";
const views: { value: View; label: string }[] = [
  { value: "repor", label: "Para repor" },
  { value: "todos", label: "Todo o estoque" },
  { value: "historico", label: "Histórico" },
];

export default function StockPage({ searchParams }: PageProps<"/admin/estoque">) {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl sm:text-4xl">Estoque</h1>
      <Suspense fallback={<div aria-hidden="true" className="mt-6 h-96 animate-pulse rounded-3xl bg-creme-dark" />}>
        <Stock searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Stock({ searchParams }: { searchParams: PageProps<"/admin/estoque">["searchParams"] }) {
  const params = await searchParams;
  const view = (views.some((v) => v.value === params.ver) ? params.ver : "repor") as View;
  const search = typeof params.busca === "string" ? params.busca.trim().toLowerCase().slice(0, 60) : "";

  const rows = await listStock();
  const total = rows.reduce((s, r) => s + r.stock, 0);
  const soldOut = rows.filter((r) => r.stock === 0).length;
  const low = rows.filter((r) => r.stock > 0 && r.stock <= LOW_STOCK).length;

  const href = (v: View) => `/admin/estoque${v === "repor" ? "" : `?ver=${v}`}`;

  return (
    <>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Peças em estoque" value={total} tone="bg-white" />
        <Stat label="Variações esgotadas" value={soldOut} tone={soldOut ? "bg-coral/15" : "bg-white"} />
        <Stat label={`Com ${LOW_STOCK} peças ou menos`} value={low} tone={low ? "bg-sol/40" : "bg-white"} />
      </dl>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Visualização" className="flex gap-2 overflow-x-auto">
          {views.map((v) => (
            <Link
              key={v.value}
              href={href(v.value)}
              aria-current={view === v.value ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 font-bold ${view === v.value ? "bg-marinho text-creme" : "bg-white hover:bg-creme-dark"}`}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        {view !== "historico" && (
          <form action="/admin/estoque" className="relative w-full sm:w-72">
            {view !== "repor" && <input type="hidden" name="ver" value={view} />}
            <label htmlFor="busca" className="sr-only">Buscar produto</label>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-marinho-soft" aria-hidden="true" />
            <input
              id="busca"
              name="busca"
              defaultValue={search}
              placeholder="Buscar pelo produto"
              className="h-11 w-full rounded-full border-2 border-marinho/15 bg-white pr-4 pl-10 focus:border-marinho focus:outline-none"
            />
          </form>
        )}
      </div>

      {view === "historico" ? (
        <Suspense fallback={<div aria-hidden="true" className="mt-6 h-96 animate-pulse rounded-3xl bg-creme-dark" />}>
          <History />
        </Suspense>
      ) : (
        <StockTable
          rows={rows.filter(
            (r) =>
              (view === "todos" || r.stock <= LOW_STOCK) &&
              (!search || r.product.name.toLowerCase().includes(search)),
          )}
          emptyText={view === "repor" ? "Tudo abastecido! Nenhuma variação com estoque baixo." : "Nenhuma variação encontrada."}
        />
      )}
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-3xl p-5 ${tone}`}>
      <dt className="font-semibold text-marinho-soft">{label}</dt>
      <dd className="mt-1 font-display text-4xl font-bold">{value}</dd>
    </div>
  );
}

function StockTable({ rows, emptyText }: { rows: Awaited<ReturnType<typeof listStock>>; emptyText: string }) {
  if (!rows.length) {
    return <p className="mt-6 rounded-3xl bg-white px-6 py-14 text-center font-display text-xl font-semibold">{emptyText}</p>;
  }
  return (
    <div className="mt-6 overflow-x-auto rounded-3xl bg-white ring-2 ring-marinho/5">
      <table className="w-full min-w-[46rem] text-left">
        <thead className="border-b-2 border-marinho/10 text-sm text-marinho-soft">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">Produto</th>
            <th scope="col" className="px-5 py-3 font-semibold">Variação</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Estoque</th>
            <th scope="col" className="px-5 py-3 font-semibold">Atualizar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const variant = [r.color?.name, `Tam. ${r.size.label}`].filter(Boolean).join(" · ");
            return (
              <tr key={r.id} className="border-t border-marinho/5">
                <td className="px-5 py-3">
                  <Link href={`/admin/produtos/${r.product.id}`} className="font-semibold hover:underline">
                    {r.product.name}
                  </Link>
                  {!r.product.active && <span className="ml-2 rounded-full bg-marinho/10 px-2 py-0.5 text-xs font-bold">inativo</span>}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2">
                    {r.color && <span aria-hidden="true" className="size-4 rounded-full ring-1 ring-marinho/20" style={{ backgroundColor: r.color.hex }} />}
                    {variant}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={`inline-flex min-w-10 justify-center rounded-full px-2.5 py-1 font-display text-lg font-bold ${
                      r.stock === 0 ? "bg-coral/15" : r.stock <= LOW_STOCK ? "bg-sol/50" : ""
                    }`}
                  >
                    {r.stock}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <StockRowActions variantId={r.id} stock={r.stock} label={`${r.product.name}, ${variant}`} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const reasonLabel: Record<StockMovement["reason"], string> = {
  entrada: "Entrada",
  venda: "Venda",
  ajuste: "Ajuste",
  cancelamento: "Cancelamento",
};

async function History() {
  const movements = await listStockMovements();
  if (!movements.length) {
    return <p className="mt-6 rounded-3xl bg-white px-6 py-14 text-center font-display text-xl font-semibold">Nenhuma movimentação ainda.</p>;
  }
  return (
    <div className="mt-6 overflow-x-auto rounded-3xl bg-white ring-2 ring-marinho/5">
      <table className="w-full min-w-[48rem] text-left">
        <thead className="border-b-2 border-marinho/10 text-sm text-marinho-soft">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">Quando</th>
            <th scope="col" className="px-5 py-3 font-semibold">Produto</th>
            <th scope="col" className="px-5 py-3 font-semibold">Tipo</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Qtd.</th>
            <th scope="col" className="px-5 py-3 font-semibold">Detalhe</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id} className="border-t border-marinho/5">
              <td className="px-5 py-3 text-sm whitespace-nowrap text-marinho-soft">{formatDateTime(m.created_at)}</td>
              <td className="px-5 py-3">
                {m.variant ? (
                  <>
                    <Link href={`/admin/produtos/${m.variant.product.id}`} className="font-semibold hover:underline">
                      {m.variant.product.name}
                    </Link>
                    <p className="text-sm text-marinho-soft">
                      {[m.variant.color?.name, `Tam. ${m.variant.size.label}`].filter(Boolean).join(" · ")}
                    </p>
                  </>
                ) : (
                  "Variação removida"
                )}
              </td>
              <td className="px-5 py-3">{reasonLabel[m.reason]}</td>
              <td className={`px-5 py-3 text-right font-display text-lg font-bold ${m.delta > 0 ? "text-cobalto" : ""}`}>
                {m.delta > 0 ? `+${m.delta}` : `−${Math.abs(m.delta)}`}
              </td>
              <td className="px-5 py-3 text-sm">
                {m.order ? (
                  <Link href={`/admin/pedidos/${m.order.id}`} className="font-semibold underline underline-offset-4">
                    Pedido #{m.order.number}
                  </Link>
                ) : (
                  <span className="text-marinho-soft">{m.note}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
