"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import {
  addProductImages,
  deleteProductImage,
  reorderProductImages,
  updateProductImage,
} from "@/lib/admin/product-actions";
import { uploadProductImage } from "@/lib/admin/image-upload";
import type { EditableProduct, ProductFormOptions } from "@/lib/admin/products";

type Props = {
  productId: string;
  images: EditableProduct["images"];
  colors: ProductFormOptions["colors"];
};

export function ProductImages({ productId, images, colors }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFiles(fileList: FileList | null) {
    const files = [...(fileList ?? [])].filter((f) => f.type.startsWith("image/")).slice(0, 12);
    if (!files.length) return;
    setError(null);
    setUploading({ done: 0, total: files.length });
    const paths: string[] = [];
    const failures: string[] = [];
    for (const file of files) {
      try {
        paths.push(await uploadProductImage(productId, file));
      } catch (e) {
        failures.push(e instanceof Error ? e.message : file.name);
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    if (paths.length) {
      const result = await addProductImages(productId, paths);
      if (!result.ok) failures.push(result.error);
    }
    setUploading(null);
    if (failures.length) setError(failures.join(" "));
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(index: number, to: number) {
    const ids = images.map((i) => i.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(to, 0, moved);
    startTransition(async () => {
      const r = await reorderProductImages(productId, ids);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <section aria-labelledby="fotos" className="rounded-3xl bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="fotos" className="text-2xl">
          Fotos
        </h2>
        <p className="text-sm text-marinho-soft">A primeira foto é a capa. Associe fotos a uma cor para trocar junto na loja.</p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`mt-4 flex flex-col items-center justify-center rounded-3xl border-3 border-dashed px-6 py-8 text-center transition-colors ${dragOver ? "border-cobalto bg-cobalto/5" : "border-marinho/15"}`}
      >
        {uploading ? (
          <p className="flex items-center gap-2 font-semibold" role="status">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Enviando {uploading.done} de {uploading.total}…
          </p>
        ) : (
          <>
            <ImagePlus className="size-8 text-marinho-soft" aria-hidden="true" />
            <p className="mt-2 font-semibold">Arraste as fotos aqui</p>
            <p className="text-sm text-marinho-soft">ou</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-2 rounded-full bg-marinho px-5 py-2.5 font-bold text-creme hover:bg-cobalto"
            >
              Escolher fotos
            </button>
            <p className="mt-2 text-xs text-marinho-soft">JPG, PNG ou WebP. As fotos são otimizadas antes de enviar.</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-coral/15 p-3 text-sm font-semibold">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="flex flex-col gap-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-creme-dark">
                <Image src={img.url} alt={img.alt ?? ""} fill sizes="(min-width: 1024px) 14rem, 45vw" className="object-cover" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-sol px-2.5 py-0.5 text-xs font-bold">Capa</span>
                )}
              </div>
              <select
                aria-label={`Cor da foto ${i + 1}`}
                value={img.color_id ?? ""}
                disabled={pending}
                onChange={(e) =>
                  startTransition(async () => {
                    const r = await updateProductImage(img.id, { color_id: e.target.value || null });
                    if (!r.ok) setError(r.error);
                  })
                }
                className="h-10 rounded-xl border-2 border-marinho/15 bg-white px-2 text-sm"
              >
                <option value="">Todas as cores</option>
                {colors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {confirmDelete === img.id ? (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        const r = await deleteProductImage(img.id);
                        if (!r.ok) setError(r.error);
                        setConfirmDelete(null);
                      })
                    }
                    className="flex-1 rounded-xl bg-coral py-2 text-sm font-bold text-white"
                  >
                    Remover
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 rounded-xl bg-creme-dark py-2 text-sm font-bold"
                  >
                    Voltar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <IconButton label="Mover para a esquerda" disabled={i === 0 || pending} onClick={() => move(i, i - 1)}>
                    <ArrowLeft className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Mover para a direita"
                    disabled={i === images.length - 1 || pending}
                    onClick={() => move(i, i + 1)}
                  >
                    <ArrowRight className="size-4" />
                  </IconButton>
                  <IconButton label="Usar como capa" disabled={i === 0 || pending} onClick={() => move(i, 0)}>
                    <Star className="size-4" />
                  </IconButton>
                  <IconButton label="Remover foto" disabled={pending} onClick={() => setConfirmDelete(img.id)} className="ml-auto">
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
  className = "",
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-xl bg-creme-dark hover:bg-sol disabled:opacity-30 disabled:hover:bg-creme-dark ${className}`}
    >
      {children}
    </button>
  );
}
