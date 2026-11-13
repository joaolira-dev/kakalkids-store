import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { deliveryOptions } from "@/config/site";
import { getOrder, nextStatuses, orderStatusLabels } from "@/lib/admin/orders";
import { customerWhatsappLink, formatDateTime, formatPhone, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Pedido" };

export default async function OrderPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const delivery = deliveryOptions.find((o) => o.value === order.delivery_method);
  const firstName = order.customer_name.split(" ")[0];
  const whatsapp = customerWhatsappLink(
    order.customer_phone,
    `Oi, ${firstName}! Aqui é da KakalKids, sobre o seu pedido #${order.number}.`,
  );
  const lowStock = order.status === "pending" && order.items.some((i) => i.current_stock !== null && i.current_stock < i.quantity);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/pedidos" className="inline-flex items-center gap-1.5 font-bold text-marinho-soft hover:text-marinho">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Pedidos
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl sm:text-4xl">Pedido #{order.number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-marinho-soft">Feito em {formatDateTime(order.created_at)}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="itens" className="rounded-3xl bg-white p-5 sm:p-6">
            <h2 id="itens" className="text-xl">
              Itens
            </h2>
            {lowStock && (
              <p className="mt-3 rounded-2xl bg-sol/40 p-3 text-sm font-semibold">
                Atenção: algum item não tem estoque suficiente para confirmar. Confira antes de confirmar.
              </p>
            )}
            <ul className="mt-3 divide-y divide-marinho/10">
              {order.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">
                      {item.quantity}× {item.product_name}
                    </p>
                    <p className="text-sm text-marinho-soft">
                      {[item.color_name, `Tam. ${item.size_label}`].filter(Boolean).join(" · ")}
                      {order.status === "pending" && item.current_stock !== null && (
                        <> · {item.current_stock} em estoque</>
                      )}
                    </p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.unit_price * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t-2 border-marinho/10 pt-4">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-cobalto">
                  <dt>Cupom {order.coupon_code}</dt>
                  <dd>−{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between font-display text-xl font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="cliente" className="rounded-3xl bg-white p-5 sm:p-6">
            <h2 id="cliente" className="text-xl">
              Cliente e entrega
            </h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-marinho-soft">Nome</dt>
                <dd className="font-semibold">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-sm text-marinho-soft">WhatsApp</dt>
                <dd className="font-semibold">{formatPhone(order.customer_phone)}</dd>
              </div>
              <div>
                <dt className="text-sm text-marinho-soft">Entrega</dt>
                <dd className="font-semibold">{delivery?.label}</dd>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm text-marinho-soft">Observações</dt>
                  <dd>{order.notes}</dd>
                </div>
              )}
            </dl>
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-turquesa px-5 py-2.5 font-bold"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              Conversar no WhatsApp
            </a>
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-10">
          <section aria-labelledby="acoes" className="rounded-3xl bg-white p-5 sm:p-6">
            <h2 id="acoes" className="mb-4 text-xl">
              Ações
            </h2>
            <OrderActions orderId={order.id} status={order.status} next={nextStatuses(order.status)} />
          </section>

          <section aria-labelledby="historico" className="rounded-3xl bg-white p-5 sm:p-6">
            <h2 id="historico" className="text-xl">
              Histórico
            </h2>
            <ol className="mt-3 space-y-3">
              {order.history.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-marinho" />
                  <div>
                    <p className="font-semibold">{orderStatusLabels[h.status]}</p>
                    <p className="text-sm text-marinho-soft">{formatDateTime(h.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
