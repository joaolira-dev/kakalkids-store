"use client";

import { getBrowserClient } from "@/lib/supabase/browser";

const MAX_SIDE = 1600;
const QUALITY = 0.85;

/**
 * Reduz a foto no próprio navegador (máx. 1600px, WebP) antes de subir.
 * Fotos de celular têm 3–8 MB; assim ficam com ~150–400 KB.
 */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao converter a imagem."))), "image/webp", QUALITY),
  );
}

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} não é uma imagem.`);
  if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} é grande demais (máx. 25 MB).`);

  const blob = await compress(file);
  const path = `${productId}/${crypto.randomUUID()}.webp`;
  const { error } = await getBrowserClient()
    .storage.from("product-images")
    .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });

  if (error) throw new Error(`Não foi possível enviar ${file.name}.`);
  return path;
}
