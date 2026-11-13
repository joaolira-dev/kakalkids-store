import "server-only";
import type { DeliveryMethod } from "@/config/site";
import { requireAdmin } from "./auth";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "canceled";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

export const ORDER_STATUSES = Object.keys(orderStatusLabels) as OrderStatus[];

export type OrderListItem = {
  id: string;
  number: number;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  total: number;
  created_at: string;
  item_count: number;
};

const PAGE_SIZE = 30;

export async function listOrders({ status, search, page }: { status: OrderStatus | null; search: string | null; page: number }) {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("orders")
    .select("id, number, customer_name, customer_phone, status, delivery_method, total, created_at, order_items(quantity)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (search) {
    const term = search.replace(/^#/, "").trim();
    if (/^\d+$/.test(term) && term.length <= 7) query = query.eq("number", Number(term));
    else if (/^\d{8,}$/.test(term)) query = query.ilike("customer_phone", `%${term}%`);
    else query = query.ilike("customer_name", `%${term.replace(/[%_]/g, "")}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`Erro ao carregar pedidos: ${error.message}`);

  const orders: OrderListItem[] = (data ?? []).map((o) => ({
    id: o.id,
    number: o.number,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    status: o.status,
    delivery_method: o.delivery_method,
    total: Number(o.total),
    created_at: o.created_at,
    item_count: (o.order_items as { quantity: number }[]).reduce((s, i) => s + i.quantity, 0),
  }));

  return { orders, total: count ?? 0, pageSize: PAGE_SIZE };
}

export async function countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
  const { supabase } = await requireAdmin();
  const results = await Promise.all(
    ORDER_STATUSES.map((s) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", s)),
  );
  return Object.fromEntries(ORDER_STATUSES.map((s, i) => [s, results[i].count ?? 0])) as Record<OrderStatus, number>;
}

export type OrderDetail = {
  id: string;
  number: number;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  subtotal: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  created_at: string;
  items: {
    id: string;
    variant_id: string | null;
    product_name: string;
    color_name: string | null;
    size_label: string;
    unit_price: number;
    quantity: number;
    current_stock: number | null;
  }[];
  history: { status: OrderStatus; created_at: string }[];
};

export async function getOrder(id: string): Promise<OrderDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, number, customer_name, customer_phone, notes, status, delivery_method, subtotal, discount, total,
       coupon_code, created_at,
       items:order_items(id, variant_id, product_name, color_name, size_label, unit_price, quantity,
         variant:product_variants(stock)),
       history:order_status_history(status, created_at)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Erro ao carregar pedido: ${error.message}`);
  if (!data) return null;

  type ItemRow = Omit<OrderDetail["items"][number], "current_stock"> & { variant: { stock: number } | null };

  return {
    ...data,
    subtotal: Number(data.subtotal),
    discount: Number(data.discount),
    total: Number(data.total),
    items: (data.items as unknown as ItemRow[]).map(({ variant, ...item }) => ({
      ...item,
      unit_price: Number(item.unit_price),
      current_stock: variant?.stock ?? null,
    })),
    history: [...(data.history as OrderDetail["history"])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

/** Próximos status possíveis a partir do atual (o banco cuida do estoque). */
export function nextStatuses(status: OrderStatus): OrderStatus[] {
  switch (status) {
    case "pending":
      return ["confirmed", "canceled"];
    case "confirmed":
      return ["shipped", "delivered", "canceled"];
    case "shipped":
      return ["delivered", "canceled"];
    default:
      return [];
  }
}
