import { deliveryOptions, type DeliveryMethod } from "@/config/site";
import { formatPrice } from "@/lib/format";

export type PlacedOrder = {
  order_id: string;
  order_number: number;
  subtotal: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  items: { name: string; color: string | null; size: string; unit_price: number; quantity: number }[];
};

type MessageInput = {
  order: PlacedOrder;
  customerName: string;
  customerPhone: string;
  delivery: DeliveryMethod;
  notes?: string | null;
};

function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

/** Mensagem que o cliente envia para a loja pelo WhatsApp (formatação do WhatsApp: *negrito*). */
export function buildOrderMessage({ order, customerName, customerPhone, delivery, notes }: MessageInput) {
  const deliveryLabel = deliveryOptions.find((o) => o.value === delivery)?.label ?? delivery;

  const lines = [
    `Olá! Quero finalizar meu pedido *#${order.order_number}* feito no site 🛍️`,
    "",
    "*Itens*",
    ...order.items.map((item) => {
      const variant = [item.color, `tam. ${item.size}`].filter(Boolean).join(", ");
      return `• ${item.quantity}x ${item.name} (${variant}) — ${formatPrice(Number(item.unit_price) * item.quantity)}`;
    }),
    "",
    `Subtotal: ${formatPrice(Number(order.subtotal))}`,
    ...(Number(order.discount) > 0
      ? [`Cupom ${order.coupon_code}: −${formatPrice(Number(order.discount))}`]
      : []),
    `*Total: ${formatPrice(Number(order.total))}*`,
    "",
    `*Entrega:* ${deliveryLabel}`,
    `*Nome:* ${customerName}`,
    `*Telefone:* ${formatPhone(customerPhone)}`,
    ...(notes?.trim() ? [`*Observações:* ${notes.trim()}`] : []),
    "",
    "Aguardo a confirmação da disponibilidade e do pagamento. Obrigado(a)!",
  ];

  return lines.join("\n");
}
