function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não configurada. Veja o .env.example.`);
  }
  return value;
}

export const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabasePublishableKey = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Converte o caminho salvo em product_images.storage_path numa URL pública. */
export function productImageUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
}
