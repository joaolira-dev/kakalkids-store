"use server";

import { refresh, updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import type { AgeGroup, Gender } from "@/lib/catalog/types";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/env";
import { requireAdmin } from "./auth";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const GENDERS: Gender[] = ["menina", "menino", "unissex"];
const AGES: AgeGroup[] = ["bebe", "infantil", "teen"];
const UUID = /^[0-9a-f-]{36}$/i;

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function money(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

function done() {
  updateTag(CATALOG_TAG);
  refresh();
}

// ---------------------------------------------------------------------
// Dados principais
// ---------------------------------------------------------------------

export type ProductInput = {
  id?: string;
  name: string;
  description: string;
  category_id: string | null;
  gender: Gender;
  age_group: AgeGroup;
  base_price: string | number;
  compare_at_price: string | number | null;
  size_chart_id: string | null;
  active: boolean;
  featured: boolean;
  collection_ids: string[];
};

export async function saveProduct(input: ProductInput): Promise<Result<{ id: string; slug: string }>> {
  const { supabase } = await requireAdmin();

  const name = input.name.trim().slice(0, 120);
  const price = money(input.base_price);
  const compareAt = money(input.compare_at_price);

  if (!name) return { ok: false, error: "Dê um nome ao produto." };
  if (price === null || Number.isNaN(price) || price <= 0) return { ok: false, error: "Informe um preço válido." };
  if (Number.isNaN(compareAt)) return { ok: false, error: "O preço “de” está inválido." };
  if (compareAt !== null && compareAt <= price) {
    return { ok: false, error: "O preço “de” (riscado) precisa ser maior que o preço de venda." };
  }
  if (!GENDERS.includes(input.gender) || !AGES.includes(input.age_group)) {
    return { ok: false, error: "Escolha para quem é e a faixa de idade." };
  }

  const row = {
    name,
    description: input.description.trim().slice(0, 4000) || null,
    category_id: input.category_id && UUID.test(input.category_id) ? input.category_id : null,
    gender: input.gender,
    age_group: input.age_group,
    base_price: price,
    compare_at_price: compareAt,
    size_chart_id: input.size_chart_id && UUID.test(input.size_chart_id) ? input.size_chart_id : null,
    active: input.active,
    featured: input.featured,
  };

  let id = input.id && UUID.test(input.id) ? input.id : null;
  let slug: string;

  if (id) {
    const { data, error } = await supabase.from("products").update(row).eq("id", id).select("slug").single();
    if (error) return { ok: false, error: "Não foi possível salvar o produto." };
    slug = String(data.slug);
  } else {
    // Slug único a partir do nome: vestido-babados, vestido-babados-2...
    const base = slugify(name) || "produto";
    const { data: existing } = await supabase.from("products").select("slug").ilike("slug", `${base}%`);
    const taken = new Set((existing ?? []).map((p) => String(p.slug)));
    slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;

    const { data, error } = await supabase.from("products").insert({ ...row, slug }).select("id").single();
    if (error || !data) return { ok: false, error: "Não foi possível criar o produto." };
    id = data.id as string;
  }

  // Coleções
  const collectionIds = input.collection_ids.filter((c) => UUID.test(c));
  await supabase.from("product_collections").delete().eq("product_id", id);
  if (collectionIds.length) {
    await supabase.from("product_collections").insert(collectionIds.map((collection_id) => ({ product_id: id, collection_id })));
  }

  done();
  return { ok: true, id: id!, slug };
}

export async function setProductFlag(id: string, flag: "active" | "featured", value: boolean): Promise<Result> {
  if (!UUID.test(id)) return { ok: false, error: "Produto inválido." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").update({ [flag]: value }).eq("id", id);
  if (error) return { ok: false, error: "Não foi possível atualizar o produto." };
  done();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Variações (cor × tamanho) e estoque
// ---------------------------------------------------------------------

export type VariantInput = {
  id?: string;
  color_id: string | null;
  size_id: string;
  stock: number;
  price_override: string | number | null;
  sku: string | null;
};

export async function saveVariants(productId: string, variants: VariantInput[]): Promise<Result<{ changed: number }>> {
  if (!UUID.test(productId)) return { ok: false, error: "Produto inválido." };
  if (variants.length > 300) return { ok: false, error: "Variações demais para um produto." };
  const { supabase } = await requireAdmin();

  const { data: existingRows, error: loadError } = await supabase
    .from("product_variants")
    .select("id, color_id, size_id, stock, price_override, sku, active")
    .eq("product_id", productId);
  if (loadError) return { ok: false, error: "Não foi possível carregar as variações." };

  const existing = new Map((existingRows ?? []).map((v) => [`${v.color_id ?? "-"}|${v.size_id}`, v]));
  const keep = new Set<string>();
  const inserts: Record<string, unknown>[] = [];
  let changed = 0;

  for (const v of variants) {
    if (!UUID.test(v.size_id) || (v.color_id && !UUID.test(v.color_id))) continue;
    const stock = Math.max(0, Math.min(9999, Math.trunc(Number(v.stock) || 0)));
    const price = money(v.price_override);
    if (Number.isNaN(price)) return { ok: false, error: "Há um preço especial inválido na grade." };
    const sku = v.sku?.trim().slice(0, 40) || null;
    const key = `${v.color_id ?? "-"}|${v.size_id}`;
    keep.add(key);

    const current = existing.get(key);
    if (current) {
      const fields = { price_override: price, sku, active: true };
      if (
        Number(current.price_override ?? -1) !== (price ?? -1) ||
        (current.sku ?? null) !== sku ||
        !current.active
      ) {
        const { error } = await supabase.from("product_variants").update(fields).eq("id", current.id);
        if (error) return { ok: false, error: error.code === "23505" ? `O SKU ${sku} já está em uso.` : "Erro ao salvar variação." };
        changed++;
      }
      const delta = stock - current.stock;
      if (delta !== 0) {
        const { error } = await supabase.rpc("adjust_stock", {
          p_variant_id: current.id,
          p_delta: delta,
          p_reason: "ajuste",
          p_note: "Ajuste pelo cadastro do produto",
        });
        if (error) return { ok: false, error: "Erro ao ajustar estoque." };
        changed++;
      }
    } else {
      inserts.push({ product_id: productId, color_id: v.color_id, size_id: v.size_id, stock, price_override: price, sku });
    }
  }

  // Variações novas vão num único insert
  if (inserts.length) {
    const { error } = await supabase.from("product_variants").insert(inserts);
    if (error) return { ok: false, error: error.code === "23505" ? "Há um SKU repetido na grade." : "Erro ao criar variações." };
    changed += inserts.length;
  }

  // Variações que saíram da grade são desativadas (o histórico de pedidos continua intacto)
  const removed = (existingRows ?? []).filter((v) => v.active && !keep.has(`${v.color_id ?? "-"}|${v.size_id}`));
  if (removed.length) {
    await supabase.from("product_variants").update({ active: false }).in("id", removed.map((v) => v.id));
    changed += removed.length;
  }

  done();
  return { ok: true, changed };
}

export async function createColor(name: string, hex: string): Promise<Result<{ color: { id: string; name: string; hex: string } }>> {
  const { supabase } = await requireAdmin();
  const clean = name.trim().slice(0, 40);
  if (!clean) return { ok: false, error: "Dê um nome para a cor." };
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return { ok: false, error: "Cor inválida." };
  const { data, error } = await supabase.from("colors").insert({ name: clean, hex: hex.toUpperCase() }).select("id, name, hex").single();
  if (error) return { ok: false, error: error.code === "23505" ? "Já existe uma cor com esse nome." : "Erro ao criar a cor." };
  done();
  return { ok: true, color: data };
}

// ---------------------------------------------------------------------
// Fotos (o upload do arquivo é feito pelo navegador direto no Storage)
// ---------------------------------------------------------------------

export async function addProductImages(productId: string, paths: string[]): Promise<Result> {
  if (!UUID.test(productId)) return { ok: false, error: "Produto inválido." };
  const valid = paths.filter((p) => p.startsWith(`${productId}/`) && /^[\w/-]+\.(webp|jpe?g|png)$/i.test(p));
  if (!valid.length) return { ok: false, error: "Nenhuma foto válida." };
  const { supabase } = await requireAdmin();

  const { data: last } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("product_images")
    .insert(valid.map((storage_path, i) => ({ product_id: productId, storage_path, sort_order: start + i })));
  if (error) return { ok: false, error: "Não foi possível salvar as fotos." };
  done();
  return { ok: true };
}

export async function updateProductImage(
  imageId: string,
  changes: { color_id?: string | null; alt?: string | null },
): Promise<Result> {
  if (!UUID.test(imageId)) return { ok: false, error: "Foto inválida." };
  const { supabase } = await requireAdmin();
  const patch: Record<string, string | null> = {};
  if ("color_id" in changes) patch.color_id = changes.color_id && UUID.test(changes.color_id) ? changes.color_id : null;
  if ("alt" in changes) patch.alt = changes.alt?.trim().slice(0, 200) || null;
  const { error } = await supabase.from("product_images").update(patch).eq("id", imageId);
  if (error) return { ok: false, error: "Não foi possível atualizar a foto." };
  done();
  return { ok: true };
}

export async function reorderProductImages(productId: string, orderedIds: string[]): Promise<Result> {
  if (!UUID.test(productId) || orderedIds.some((id) => !UUID.test(id))) return { ok: false, error: "Ordem inválida." };
  const { supabase } = await requireAdmin();
  for (const [i, id] of orderedIds.entries()) {
    const { error } = await supabase.from("product_images").update({ sort_order: i }).eq("id", id).eq("product_id", productId);
    if (error) return { ok: false, error: "Não foi possível reordenar as fotos." };
  }
  done();
  return { ok: true };
}

export async function deleteProductImage(imageId: string): Promise<Result> {
  if (!UUID.test(imageId)) return { ok: false, error: "Foto inválida." };
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("product_images").delete().eq("id", imageId).select("storage_path").single();
  if (error || !data) return { ok: false, error: "Não foi possível remover a foto." };
  if (!data.storage_path.startsWith("http") && !data.storage_path.startsWith("/")) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([data.storage_path]);
  }
  done();
  return { ok: true };
}
