import "server-only";
import { requireAdmin } from "./auth";

export type AdminCoupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order_value: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  pending_orders: number;
  discount_total: number;
};

export type CouponState = "ativo" | "pausado" | "agendado" | "expirado" | "esgotado";

export function couponState(c: Pick<AdminCoupon, "active" | "starts_at" | "expires_at" | "max_uses" | "used_count">, now = new Date()): CouponState {
  if (!c.active) return "pausado";
  if (c.expires_at && new Date(c.expires_at) < now) return "expirado";
  if (c.max_uses !== null && c.used_count >= c.max_uses) return "esgotado";
  if (c.starts_at && new Date(c.starts_at) > now) return "agendado";
  return "ativo";
}

export async function listCoupons(): Promise<AdminCoupon[]> {
  const { supabase } = await requireAdmin();
  const [coupons, orders] = await Promise.all([
    supabase
      .from("coupons")
      .select("id, code, type, value, min_order_value, max_uses, used_count, starts_at, expires_at, active")
      .order("code"),
    supabase.from("orders").select("coupon_id, status, discount").not("coupon_id", "is", null).neq("status", "canceled"),
  ]);
  if (coupons.error) throw new Error(`Erro ao carregar cupons: ${coupons.error.message}`);

  const stats = new Map<string, { pending: number; discount: number }>();
  for (const o of orders.data ?? []) {
    const s = stats.get(o.coupon_id) ?? { pending: 0, discount: 0 };
    if (o.status === "pending") s.pending++;
    else s.discount += Number(o.discount);
    stats.set(o.coupon_id, s);
  }

  return (coupons.data ?? []).map((c) => ({
    ...c,
    code: String(c.code),
    value: Number(c.value),
    min_order_value: Number(c.min_order_value),
    pending_orders: stats.get(c.id)?.pending ?? 0,
    discount_total: stats.get(c.id)?.discount ?? 0,
  }));
}
