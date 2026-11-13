"use server";

import { refresh, updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { requireAdmin } from "./auth";

type Result = { ok: true; stock: number } | { ok: false; error: string };
const UUID = /^[0-9a-f-]{36}$/i;

/** Entrada de mercadoria (soma ao estoque) ou correção para um valor exato (contagem). */
export async function changeStock(
  variantId: string,
  mode: "entrada" | "definir",
  quantity: number,
  note?: string,
): Promise<Result> {
  if (!UUID.test(variantId)) return { ok: false, error: "Variação inválida." };
  const qty = Math.trunc(Number(quantity));
  if (!Number.isFinite(qty) || qty < 0 || qty > 9999) return { ok: false, error: "Quantidade inválida." };
  if (mode === "entrada" && qty === 0) return { ok: false, error: "Informe quantas peças chegaram." };

  const { supabase } = await requireAdmin();
  let delta = qty;
  if (mode === "definir") {
    const { data, error } = await supabase.from("product_variants").select("stock").eq("id", variantId).single();
    if (error || !data) return { ok: false, error: "Variação não encontrada." };
    delta = qty - data.stock;
    if (delta === 0) return { ok: true, stock: qty };
  }

  const { data, error } = await supabase.rpc("adjust_stock", {
    p_variant_id: variantId,
    p_delta: delta,
    p_reason: mode === "entrada" ? "entrada" : "ajuste",
    p_note: note?.trim().slice(0, 200) || (mode === "entrada" ? "Entrada pelo painel" : "Correção de contagem"),
  });
  if (error) return { ok: false, error: "Não foi possível atualizar o estoque." };

  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, stock: Number(data) };
}
