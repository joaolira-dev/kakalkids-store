"use server";

import { deliveryOptions, whatsappLink, type DeliveryMethod } from "@/config/site";
import { createPublicClient } from "@/lib/supabase/public";
import { buildOrderMessage, type PlacedOrder } from "./message";

export type CouponPreview = { valid: boolean; discount: number; message: string };

export async function previewCoupon(code: string, subtotal: number): Promise<CouponPreview> {
  const clean = code.trim().slice(0, 40);
  if (!clean) return { valid: false, discount: 0, message: "Digite um cupom" };

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .rpc("preview_coupon", { p_code: clean, p_subtotal: Math.max(0, subtotal) })
    .single<CouponPreview>();

  if (error || !data) return { valid: false, discount: 0, message: "Não foi possível validar o cupom agora" };
  return { valid: data.valid, discount: Number(data.discount), message: data.message };
}

export type PlaceOrderInput = {
  name: string;
  phone: string;
  delivery: DeliveryMethod;
  notes: string;
  coupon: string | null;
  items: { variantId: string; quantity: number }[];
  /** Campo invisível: pessoas deixam vazio, robôs de spam preenchem. */
  website?: string;
};

export type PlaceOrderResult =
  | { ok: true; orderNumber: number; total: number; whatsappUrl: string }
  | { ok: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (input.website?.trim()) return { ok: false, error: "Não conseguimos registrar seu pedido agora. Tente de novo em instantes." };

  const name = input.name.trim().slice(0, 120);
  const phone = input.phone.replace(/\D/g, "");
  const notes = input.notes.trim().slice(0, 500);

  if (!name) return { ok: false, error: "Informe seu nome." };
  if (phone.length < 10 || phone.length > 13) return { ok: false, error: "Informe um WhatsApp válido com DDD." };
  if (!deliveryOptions.some((o) => o.value === input.delivery)) {
    return { ok: false, error: "Escolha a forma de entrega." };
  }
  if (!input.items.length) return { ok: false, error: "Sua sacola está vazia." };

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("create_order", {
    p_customer_name: name,
    p_customer_phone: phone,
    p_items: input.items.slice(0, 50).map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
    p_delivery_method: input.delivery,
    p_coupon_code: input.coupon?.trim() || null,
    p_notes: notes || null,
  });

  if (error) {
    // Erros de regra de negócio (estoque, cupom, telefone) vêm do banco já em português
    const businessError = error.code === "P0001";
    return {
      ok: false,
      error: businessError ? `${error.message}.` : "Não conseguimos registrar seu pedido agora. Tente de novo em instantes.",
    };
  }

  const order = data as PlacedOrder;
  const message = buildOrderMessage({
    order,
    customerName: name,
    customerPhone: phone,
    delivery: input.delivery,
    notes,
  });

  return {
    ok: true,
    orderNumber: order.order_number,
    total: Number(order.total),
    whatsappUrl: whatsappLink(message),
  };
}
