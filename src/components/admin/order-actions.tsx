"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateOrderStatus } from "@/lib/admin/order-actions";
import type { OrderStatus } from "@/lib/admin/orders";

const actionLabels: Record<OrderStatus, string> = {
  pending: "Voltar para aguardando",
  confirmed: "Confirmar pedido",
  shipped: "Marcar como enviado",
  delivered: "Marcar como entregue",
  canceled: "Cancelar pedido",
};

const hints: Partial<Record<OrderStatus, string>> = {
  confirmed: "Dá baixa no estoque das peças.",
  canceled: "Se o pedido já estava confirmado, as peças voltam para o estoque.",
};

export function OrderActions({ orderId, status, next }: { orderId: string; status: OrderStatus; next: OrderStatus[] }) {
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<OrderStatus | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (next.length === 0) {
    return (
      <p className="text-marinho-soft">
        {status === "canceled" ? "Pedido cancelado. Nenhuma ação disponível." : "Pedido concluído."}
      </p>
    );
  }

  function run(to: OrderStatus) {
    setError(null);
    setRunning(to);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status, to);
      if (!result.ok) setError(result.error);
      setRunning(null);
      setConfirmCancel(false);
    });
  }

  const main = next.filter((s) => s !== "canceled");
  const canCancel = next.includes("canceled");

  return (
    <div className="flex flex-col gap-3">
      {main.map((to, i) => (
        <div key={to}>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(to)}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-full font-display text-lg font-semibold disabled:opacity-60 ${
              i === 0 ? "bg-marinho text-creme hover:bg-cobalto" : "bg-white ring-2 ring-marinho/15 hover:ring-marinho"
            }`}
          >
            {running === to && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            {actionLabels[to]}
          </button>
          {hints[to] && <p className="mt-1.5 text-center text-sm text-marinho-soft">{hints[to]}</p>}
        </div>
      ))}

      {canCancel &&
        (confirmCancel ? (
          <div className="rounded-2xl bg-coral/10 p-4">
            <p className="font-semibold">Cancelar este pedido?</p>
            <p className="mt-1 text-sm text-marinho-soft">{hints.canceled}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => run("canceled")}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-coral py-2.5 font-bold text-white disabled:opacity-60"
              >
                {running === "canceled" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Sim, cancelar
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="flex-1 rounded-full bg-white py-2.5 font-bold ring-2 ring-marinho/15"
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmCancel(true)}
            className="py-2 font-bold text-marinho-soft underline underline-offset-4 hover:text-marinho"
          >
            Cancelar pedido
          </button>
        ))}

      {error && (
        <p role="alert" className="rounded-2xl bg-coral/15 p-3 text-sm font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}
