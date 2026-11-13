import "server-only";
import { requireAdmin } from "./auth";

export const LOW_STOCK = 2;

export type StockRow = {
  id: string;
  stock: number;
  product: { id: string; name: string; active: boolean };
  color: { name: string; hex: string } | null;
  size: { label: string; sort_order: number };
};

export async function listStock(): Promise<StockRow[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, stock, product:products!inner(id, name, active), color:colors(name, hex), size:sizes!inner(label, sort_order)")
    .eq("active", true)
    .limit(5000);
  if (error) throw new Error(`Erro ao carregar estoque: ${error.message}`);

  return ((data ?? []) as unknown as StockRow[]).sort(
    (a, b) =>
      a.product.name.localeCompare(b.product.name) ||
      (a.color?.name ?? "").localeCompare(b.color?.name ?? "") ||
      a.size.sort_order - b.size.sort_order,
  );
}

export type StockMovement = {
  id: string;
  delta: number;
  reason: "entrada" | "venda" | "ajuste" | "cancelamento";
  note: string | null;
  created_at: string;
  order: { id: string; number: number } | null;
  variant: { product: { id: string; name: string }; color: { name: string } | null; size: { label: string } } | null;
};

export async function listStockMovements(limit = 150): Promise<StockMovement[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      `id, delta, reason, note, created_at,
       order:orders(id, number),
       variant:product_variants(product:products(id, name), color:colors(name), size:sizes(label))`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Erro ao carregar histórico: ${error.message}`);
  return (data ?? []) as unknown as StockMovement[];
}
