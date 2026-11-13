"use server";

import { refresh, updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { requireAdmin } from "./auth";
import { nextStatuses, ORDER_STATUSES, type OrderStatus } from "./orders";

export async function updateOrderStatus(
  orderId: string,
  from: OrderStatus,
  to: OrderStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!ORDER_STATUSES.includes(to) || !nextStatuses(from).includes(to)) {
    return { ok: false, error: "Mudança de status não permitida." };
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("set_order_status", { p_order_id: orderId, p_status: to });

  if (error) {
    return {
      ok: false,
      error: error.code === "P0001" ? `${error.message}.` : "Não foi possível atualizar o pedido. Tente de novo.",
    };
  }

  // Confirmar/cancelar mexe no estoque: atualiza a vitrine na hora
  if (to === "confirmed" || to === "canceled") updateTag(CATALOG_TAG);
  refresh();
  return { ok: true };
}
