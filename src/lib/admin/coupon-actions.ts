"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "./auth";

type Result = { ok: true } | { ok: false; error: string };
const UUID = /^[0-9a-f-]{36}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type CouponInput = {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  value: string;
  min_order_value: string;
  max_uses: string;
  starts_on: string; // AAAA-MM-DD (horário de Brasília)
  ends_on: string;
  active: boolean;
};

function num(v: string) {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export async function saveCoupon(input: CouponInput): Promise<Result> {
  const code = input.code.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    return { ok: false, error: "O código deve ter de 3 a 30 letras, números, - ou _ (sem espaços)." };
  }
  if (input.type !== "percent" && input.type !== "fixed") return { ok: false, error: "Escolha o tipo de desconto." };

  const value = num(input.value);
  if (!(value > 0)) return { ok: false, error: "Informe o valor do desconto." };
  if (input.type === "percent" && value > 100) return { ok: false, error: "O desconto em % não pode passar de 100." };

  const min = input.min_order_value.trim() ? num(input.min_order_value) : 0;
  if (!(min >= 0)) return { ok: false, error: "Pedido mínimo inválido." };

  const maxUses = input.max_uses.trim() ? Number.parseInt(input.max_uses, 10) : null;
  if (maxUses !== null && !(maxUses > 0)) return { ok: false, error: "Limite de usos inválido." };

  if ((input.starts_on && !DATE.test(input.starts_on)) || (input.ends_on && !DATE.test(input.ends_on))) {
    return { ok: false, error: "Data inválida." };
  }
  const startsAt = input.starts_on ? `${input.starts_on}T00:00:00-03:00` : null;
  const expiresAt = input.ends_on ? `${input.ends_on}T23:59:59-03:00` : null;
  if (startsAt && expiresAt && startsAt > expiresAt) return { ok: false, error: "A data final é antes da inicial." };

  const row = {
    code,
    type: input.type,
    value: Math.round(value * 100) / 100,
    min_order_value: Math.round(min * 100) / 100,
    max_uses: maxUses,
    starts_at: startsAt,
    expires_at: expiresAt,
    active: input.active,
  };

  const { supabase } = await requireAdmin();
  const { error } =
    input.id && UUID.test(input.id)
      ? await supabase.from("coupons").update(row).eq("id", input.id)
      : await supabase.from("coupons").insert(row);

  if (error) {
    return { ok: false, error: error.code === "23505" ? `Já existe um cupom ${code}.` : "Não foi possível salvar o cupom." };
  }
  refresh();
  return { ok: true };
}

export async function setCouponActive(id: string, active: boolean): Promise<Result> {
  if (!UUID.test(id)) return { ok: false, error: "Cupom inválido." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("coupons").update({ active }).eq("id", id);
  if (error) return { ok: false, error: "Não foi possível atualizar o cupom." };
  refresh();
  return { ok: true };
}

export async function deleteCoupon(id: string): Promise<Result> {
  if (!UUID.test(id)) return { ok: false, error: "Cupom inválido." };
  const { supabase } = await requireAdmin();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("coupon_id", id);
  if (count) return { ok: false, error: "Este cupom já foi usado em pedidos. Pause-o em vez de excluir." };
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { ok: false, error: "Não foi possível excluir o cupom." };
  refresh();
  return { ok: true };
}
