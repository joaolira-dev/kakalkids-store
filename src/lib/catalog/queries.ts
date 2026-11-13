import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { productImageUrl } from "@/lib/supabase/env";
import { PAGE_SIZE } from "./filters";
import type {
  CatalogFilters,
  CatalogProduct,
  FilterOptions,
  ProductDetail,
  ProductVariant,
  SizeChart,
} from "./types";

/** Tag usada para revalidar a vitrine quando o admin altera produtos. */
export const CATALOG_TAG = "catalog";

export async function getFilterOptions(): Promise<FilterOptions> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const supabase = createPublicClient();
  const [categories, colors, sizes] = await Promise.all([
    supabase.from("categories").select("name, slug").eq("active", true).order("sort_order"),
    supabase.from("colors").select("name, hex").order("name"),
    supabase.from("sizes").select("label, age_group").order("sort_order"),
  ]);

  const error = categories.error ?? colors.error ?? sizes.error;
  if (error) throw new Error(`Erro ao carregar filtros: ${error.message}`);

  return {
    categories: categories.data ?? [],
    colors: colors.data ?? [],
    sizes: sizes.data ?? [],
  };
}

export async function getCatalogProducts(
  filters: CatalogFilters,
): Promise<{ products: CatalogProduct[]; total: number }> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const supabase = createPublicClient();
  let query = supabase
    .from("catalog_products")
    .select(
      "id, name, slug, gender, age_group, min_price, compare_at_price, in_stock, sizes_available, colors_available, cover_image, created_at",
      { count: "exact" },
    );

  // "Meninas" também mostra as peças unissex (e vice-versa)
  if (filters.genero.length) {
    const genders = new Set<string>(filters.genero);
    if (genders.has("menina") || genders.has("menino")) genders.add("unissex");
    query = query.in("gender", [...genders]);
  }
  if (filters.idade.length) query = query.in("age_group", filters.idade);
  if (filters.categoria.length) query = query.in("category_slug", filters.categoria);
  if (filters.tamanho.length) query = query.overlaps("sizes_available", filters.tamanho);
  if (filters.cor.length) query = query.overlaps("colors_available", filters.cor);
  if (filters.promocao) query = query.not("compare_at_price", "is", null);
  if (filters.busca) query = query.ilike("name", `%${filters.busca.replace(/[%_]/g, "")}%`);

  if (filters.colecao) {
    const { data: collection } = await supabase
      .from("collections")
      .select("id")
      .eq("slug", filters.colecao)
      .maybeSingle();
    if (!collection) return { products: [], total: 0 };
    query = query.contains("collection_ids", [collection.id]);
  }

  // Esgotados por último
  query = query.order("in_stock", { ascending: false });
  if (filters.ordem === "menor-preco") query = query.order("min_price", { ascending: true });
  else if (filters.ordem === "maior-preco") query = query.order("min_price", { ascending: false });
  else query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });

  const from = (filters.pagina - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`Erro ao carregar produtos: ${error.message}`);

  return {
    products: (data ?? []).map((p) => ({
      ...p,
      min_price: Number(p.min_price),
      compare_at_price: p.compare_at_price === null ? null : Number(p.compare_at_price),
      cover_image: productImageUrl(p.cover_image),
    })),
    total: count ?? 0,
  };
}

type VariantRow = {
  id: string;
  sku: string | null;
  stock: number;
  price_override: number | null;
  color: { id: string; name: string; hex: string } | null;
  size: { id: string; label: string; sort_order: number };
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG, `product:${slug}`);

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, description, gender, age_group, base_price, compare_at_price,
       category:categories(name, slug),
       size_chart:size_charts(name, chart, notes),
       variants:product_variants(id, sku, stock, price_override,
         color:colors(id, name, hex),
         size:sizes(id, label, sort_order)),
       images:product_images(id, storage_path, alt, color_id, sort_order)`,
    )
    .eq("slug", slug)
    .eq("active", true)
    .eq("variants.active", true)
    .maybeSingle();

  if (error) throw new Error(`Erro ao carregar produto: ${error.message}`);
  if (!data) return null;

  const basePrice = Number(data.base_price);
  const variants: ProductVariant[] = (data.variants as unknown as VariantRow[])
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      stock: v.stock,
      price: v.price_override === null ? basePrice : Number(v.price_override),
      color: v.color,
      size: v.size,
    }))
    .sort((a, b) => a.size.sort_order - b.size.sort_order);

  const images = [...(data.images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      id: img.id,
      url: productImageUrl(img.storage_path)!,
      alt: img.alt,
      color_id: img.color_id,
    }));

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    gender: data.gender,
    age_group: data.age_group,
    base_price: basePrice,
    compare_at_price: data.compare_at_price === null ? null : Number(data.compare_at_price),
    category: data.category as unknown as ProductDetail["category"],
    size_chart: data.size_chart as unknown as ProductDetail["size_chart"],
    variants,
    images,
  };
}

export async function getSizeCharts(): Promise<SizeChart[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("size_charts").select("name, chart, notes").order("name");
  if (error) throw new Error(`Erro ao carregar tabelas de medidas: ${error.message}`);
  return (data ?? []) as SizeChart[];
}
