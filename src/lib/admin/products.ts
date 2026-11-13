import "server-only";
import { productImageUrl } from "@/lib/supabase/env";
import type { AgeGroup, Gender } from "@/lib/catalog/types";
import { requireAdmin } from "./auth";

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  featured: boolean;
  base_price: number;
  compare_at_price: number | null;
  category: string | null;
  cover: string | null;
  total_stock: number;
  variant_count: number;
  sold_out_variants: number;
};

export type ProductListFilter = "todos" | "ativos" | "inativos" | "sem-estoque";

export async function listAdminProducts({ search, filter }: { search: string | null; filter: ProductListFilter }) {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("products")
    .select(
      `id, name, slug, active, featured, base_price, compare_at_price, created_at,
       category:categories(name),
       variants:product_variants(stock, active),
       images:product_images(storage_path, sort_order)`,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (search) query = query.ilike("name", `%${search.replace(/[%_]/g, "")}%`);
  if (filter === "ativos") query = query.eq("active", true);
  if (filter === "inativos") query = query.eq("active", false);

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao carregar produtos: ${error.message}`);

  const rows: AdminProductRow[] = (data ?? []).map((p) => {
    const variants = (p.variants as { stock: number; active: boolean }[]).filter((v) => v.active);
    const images = [...(p.images as { storage_path: string; sort_order: number }[])].sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      active: p.active,
      featured: p.featured,
      base_price: Number(p.base_price),
      compare_at_price: p.compare_at_price === null ? null : Number(p.compare_at_price),
      category: (p.category as unknown as { name: string } | null)?.name ?? null,
      cover: productImageUrl(images[0]?.storage_path),
      total_stock: variants.reduce((s, v) => s + v.stock, 0),
      variant_count: variants.length,
      sold_out_variants: variants.filter((v) => v.stock === 0).length,
    };
  });

  return filter === "sem-estoque" ? rows.filter((r) => r.total_stock === 0) : rows;
}

export type ProductFormOptions = {
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  colors: { id: string; name: string; hex: string }[];
  sizes: { id: string; label: string; age_group: AgeGroup }[];
  sizeCharts: { id: string; name: string }[];
};

export async function getProductFormOptions(): Promise<ProductFormOptions> {
  const { supabase } = await requireAdmin();
  const [categories, collections, colors, sizes, sizeCharts] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("collections").select("id, name").order("sort_order"),
    supabase.from("colors").select("id, name, hex").order("name"),
    supabase.from("sizes").select("id, label, age_group").order("sort_order"),
    supabase.from("size_charts").select("id, name").order("name"),
  ]);
  return {
    categories: categories.data ?? [],
    collections: collections.data ?? [],
    colors: colors.data ?? [],
    sizes: sizes.data ?? [],
    sizeCharts: sizeCharts.data ?? [],
  };
}

export type EditableProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  gender: Gender;
  age_group: AgeGroup;
  base_price: number;
  compare_at_price: number | null;
  size_chart_id: string | null;
  active: boolean;
  featured: boolean;
  collection_ids: string[];
  variants: {
    id: string;
    color_id: string | null;
    size_id: string;
    sku: string | null;
    stock: number;
    price_override: number | null;
    active: boolean;
  }[];
  images: { id: string; storage_path: string; url: string; color_id: string | null; sort_order: number; alt: string | null }[];
};

export async function getEditableProduct(id: string): Promise<EditableProduct | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, description, category_id, gender, age_group, base_price, compare_at_price,
       size_chart_id, active, featured,
       collections:product_collections(collection_id),
       variants:product_variants(id, color_id, size_id, sku, stock, price_override, active),
       images:product_images(id, storage_path, color_id, sort_order, alt)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Erro ao carregar produto: ${error.message}`);
  if (!data) return null;

  return {
    ...data,
    slug: String(data.slug),
    description: data.description ?? "",
    base_price: Number(data.base_price),
    compare_at_price: data.compare_at_price === null ? null : Number(data.compare_at_price),
    collection_ids: (data.collections as { collection_id: string }[]).map((c) => c.collection_id),
    variants: (data.variants as EditableProduct["variants"]).map((v) => ({
      ...v,
      price_override: v.price_override === null ? null : Number(v.price_override),
    })),
    images: [...(data.images as Omit<EditableProduct["images"][number], "url">[])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({ ...img, url: productImageUrl(img.storage_path)! })),
  };
}
