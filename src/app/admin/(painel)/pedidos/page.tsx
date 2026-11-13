import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { deliveryOptions } from "@/config/site";
import { countOrdersByStatus, listOrders, ORDER_STATUSES, type OrderStatus } from "@/lib/admin/orders";
import { formatDateTime, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Pedidos" };

const tabLabels: Record<OrderStatus, string> = {
  pending: "Aguardando",
  confirmed: "Confirmados",
  shipped: "Enviados",
  delivered: "Entregues",
  canceled: "Cancelados",
};

function href(status: OrderStatus | null, search?: string | null, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("busca", search);
  if (page > 1) params.set("pagina", String(page));
  const qs = params.toString();
  return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
}

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const params = await searchParams;
  const rawStatus = typeof params.status === "string" ? params.status : null;
  const status = rawStatus && (ORDER_STATUSES as string[]).includes(rawStatus) ? (rawStatus as OrderStatus) : null;
  const search = typeof params.busca === "string" && params.busca.trim() ? params.busca.trim().slice(0, 60) : null;
  const page = Math.max(1, Number(params.pagina) || 1);

  const [{ orders, total, pageSize }, counts] = await Promise.all([
    listOrders({ status, search, page }),
    countOrdersByStatus(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const deliveryLabel = Object.fromEntries(deliveryOptions.map((o) => [o.value, o.label]));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Pedidos</h1>
          {counts.pending > 0 && (
            <p className="mt-1 text-marinho-soft">
              {counts.pending === 1 ? "1 pedido aguardando confirmação" : `${counts.pending} pedidos aguardando confirmação`}
            </p>
          )}
        </div>
        <form action="/admin/pedidos" className="relative w-full sm:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="busca" className="sr-only">
            Buscar pedido
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-marinho-soft" aria-hidden="true" />
          <input
            id="busca"
            name="busca"
            defaultValue={search ?? ""}
            placeholder="Nº, nome ou telefone"
            className="h-11 w-full rounded-full border-2 border-marinho/15 bg-white pr-4 pl-10 focus:border-marinho focus:outline-none"
          />
        </form>
      </div>

      <nav aria-label="Filtrar por status" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        <TabLink href={href(null, search)} active={!status}>
          Todos
        </TabLink>
        {ORDER_STATUSES.map((s) => (
          <TabLink key={s} href={href(s, search)} active={status === s}>
            {tabLabels[s]}
            <span className="rounded-full bg-marinho/10 px-2 text-xs">{counts[s]}</span>
          </TabLink>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">Nenhum pedido aqui</p>
          <p className="mt-1 text-marinho-soft">
            {search ? "Tente buscar por outro número ou nome." : "Os pedidos feitos no site aparecem nesta lista."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl bg-white ring-2 ring-marinho/5">
          <table className="w-full min-w-[46rem] text-left">
            <thead className="border-b-2 border-marinho/10 text-sm text-marinho-soft">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Pedido</th>
                <th scope="col" className="px-5 py-3 font-semibold">Cliente</th>
                <th scope="col" className="px-5 py-3 font-semibold">Entrega</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Peças</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="relative border-t border-marinho/5 hover:bg-creme/60">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="font-display text-lg font-semibold after:absolute after:inset-0 hover:underline"
                    >
                      #{o.number}
                    </Link>
                    <p className="text-sm text-marinho-soft">{formatDateTime(o.created_at)}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold">{o.customer_name}</td>
                  <td className="px-5 py-4">{deliveryLabel[o.delivery_method]}</td>
                  <td className="px-5 py-4 text-right">{o.item_count}</td>
                  <td className="px-5 py-4 text-right font-semibold">{formatPrice(o.total)}</td>
                  <td className="px-5 py-4">
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginação" className="mt-6 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={href(status, search, page - 1)} className="rounded-full bg-white px-5 py-2 font-bold ring-2 ring-marinho/15">
              Anterior
            </Link>
          )}
          <span className="text-marinho-soft">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link href={href(status, search, page + 1)} className="rounded-full bg-marinho px-5 py-2 font-bold text-creme">
              Próxima
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-bold transition-colors ${active ? "bg-marinho text-creme" : "bg-white hover:bg-creme-dark"}`}
    >
      {children}
    </Link>
  );
}
