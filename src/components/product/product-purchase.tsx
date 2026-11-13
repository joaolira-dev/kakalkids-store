"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { Price } from "@/components/catalog/price";
import { ProductPlaceholder } from "@/components/catalog/product-placeholder";
import { cart } from "@/lib/cart/store";
import { installments } from "@/lib/format";
import type { ProductDetail } from "@/lib/catalog/types";

type Props = { product: ProductDetail; whatsappHref: string };

const LOW_STOCK = 2;

export function ProductPurchase({ product, whatsappHref }: Props) {
  const colors = useMemo(() => {
    const seen = new Map<string, NonNullable<ProductDetail["variants"][number]["color"]>>();
    for (const v of product.variants) if (v.color && !seen.has(v.color.id)) seen.set(v.color.id, v.color);
    return [...seen.values()];
  }, [product.variants]);

  const firstInStockColor = colors.find((c) => product.variants.some((v) => v.color?.id === c.id && v.stock > 0));
  const [colorId, setColorId] = useState<string | null>(firstInStockColor?.id ?? colors[0]?.id ?? null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizes = product.variants.filter((v) => (v.color?.id ?? null) === colorId);
  const selected = sizes.find((v) => v.id === variantId) ?? null;
  const color = colors.find((c) => c.id === colorId) ?? null;
  const price = selected?.price ?? Math.min(...sizes.map((v) => v.price), product.base_price);
  const allSoldOut = product.variants.every((v) => v.stock === 0);

  // Fotos da cor escolhida primeiro; se a cor não tiver foto, mostra as gerais
  const images = useMemo(() => {
    const byColor = product.images.filter((img) => img.color_id === colorId);
    const general = product.images.filter((img) => img.color_id === null);
    return byColor.length ? [...byColor, ...general] : product.images;
  }, [product.images, colorId]);
  const currentImage = images[Math.min(imageIndex, images.length - 1)];

  function chooseColor(id: string) {
    setColorId(id);
    setImageIndex(0);
    // Mantém o mesmo tamanho na nova cor, se existir
    const label = selected?.size.label;
    const same = product.variants.find((v) => v.color?.id === id && v.size.label === label);
    setVariantId(same && same.stock > 0 ? same.id : null);
    setQuantity(1);
    setError(null);
  }

  function addToCart() {
    if (!selected) {
      setError("Escolha um tamanho para continuar.");
      return;
    }
    cart.add(
      {
        variantId: selected.id,
        productSlug: product.slug,
        name: product.name,
        color: color?.name ?? null,
        size: selected.size.label,
        price: selected.price,
        image: currentImage?.url ?? null,
        maxQuantity: selected.stock,
      },
      quantity,
    );
    setAdded(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      {/* Galeria */}
      <div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-creme-dark">
          {currentImage ? (
            <Image
              src={currentImage.url}
              alt={currentImage.alt ?? `${product.name}${color ? ` na cor ${color.name}` : ""}`}
              fill
              priority
              sizes="(min-width: 1024px) 34rem, 100vw"
              className="object-cover"
            />
          ) : (
            <ProductPlaceholder seed={product.slug} className="absolute inset-0" />
          )}
        </div>
        {images.length > 1 && (
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Fotos do produto">
            {images.map((img, i) => (
              <li key={img.id}>
                <button
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Ver foto ${i + 1} de ${images.length}`}
                  aria-current={i === imageIndex ? "true" : undefined}
                  className={`relative block size-20 overflow-hidden rounded-2xl ring-2 ${i === imageIndex ? "ring-marinho" : "ring-transparent"}`}
                >
                  <Image src={img.url} alt="" fill sizes="5rem" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Compra */}
      <div className="flex flex-col">
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] leading-tight">{product.name}</h1>
        <div className="mt-3">
          <Price price={price} compareAt={product.compare_at_price} size="lg" />
          {installments(price) && (
            <p className="mt-1 text-marinho-soft">ou {installments(price)} sem juros</p>
          )}
        </div>

        {colors.length > 0 && (
          <fieldset className="mt-8">
            <legend className="font-display text-lg font-semibold">
              Cor: <span className="font-sans font-normal">{color?.name}</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {colors.map((c) => {
                const hasStock = product.variants.some((v) => v.color?.id === c.id && v.stock > 0);
                const active = c.id === colorId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => chooseColor(c.id)}
                    aria-pressed={active}
                    aria-label={`${c.name}${hasStock ? "" : " (esgotada)"}`}
                    title={c.name}
                    className={`relative size-11 rounded-full ring-offset-2 ring-offset-creme transition ${active ? "ring-3 ring-marinho" : "ring-1 ring-marinho/25 hover:ring-2 hover:ring-marinho/60"} ${hasStock ? "" : "opacity-40"}`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset className="mt-7">
          <div className="flex items-baseline justify-between">
            <legend className="font-display text-lg font-semibold">Tamanho</legend>
            {product.size_chart && (
              <a href="#medidas" className="text-sm font-bold underline underline-offset-4">
                Ver tabela de medidas
              </a>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((v) => {
              const soldOut = v.stock === 0;
              const active = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    setVariantId(v.id);
                    setQuantity(1);
                    setError(null);
                    setAdded(false);
                  }}
                  aria-pressed={active}
                  aria-label={`Tamanho ${v.size.label}${soldOut ? ", esgotado" : ""}`}
                  className={`h-12 min-w-12 rounded-2xl border-2 px-3 font-display text-lg font-semibold transition-colors ${
                    active
                      ? "border-marinho bg-marinho text-creme"
                      : soldOut
                        ? "cursor-not-allowed border-marinho/10 text-marinho/35 line-through"
                        : "border-marinho/20 bg-white hover:border-marinho"
                  }`}
                >
                  {v.size.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 min-h-6 text-sm font-semibold" aria-live="polite">
            {error ? (
              <span className="text-coral">{error}</span>
            ) : selected && selected.stock <= LOW_STOCK ? (
              <span className="text-cobalto">
                {selected.stock === 1 ? "Última peça neste tamanho!" : `Só restam ${selected.stock} peças neste tamanho`}
              </span>
            ) : null}
          </p>
        </fieldset>

        {allSoldOut ? (
          <div className="mt-6 rounded-3xl bg-white p-5">
            <p className="font-display text-xl font-semibold">Esgotado no momento</p>
            <p className="mt-1 text-marinho-soft">Chama a gente no WhatsApp para saber da reposição.</p>
            <a href={whatsappHref} className="mt-4 inline-block rounded-full bg-marinho px-6 py-3 font-display font-semibold text-creme">
              Avise-me pelo WhatsApp
            </a>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex h-14 items-center rounded-full bg-white ring-2 ring-marinho/15">
              <button
                type="button"
                className="flex size-14 items-center justify-center rounded-full disabled:opacity-30"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuir quantidade"
              >
                <Minus className="size-5" />
              </button>
              <span className="w-6 text-center font-display text-xl font-semibold" aria-live="polite">
                <span className="sr-only">Quantidade: </span>
                {quantity}
              </span>
              <button
                type="button"
                className="flex size-14 items-center justify-center rounded-full disabled:opacity-30"
                onClick={() => setQuantity((q) => Math.min(selected?.stock ?? 1, q + 1))}
                disabled={!selected || quantity >= selected.stock}
                aria-label="Aumentar quantidade"
              >
                <Plus className="size-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={addToCart}
              className="flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-rosa px-8 font-display text-lg font-semibold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <ShoppingBag className="size-5" aria-hidden="true" />
              Adicionar à sacola
            </button>
          </div>
        )}

        {added && (
          <div role="status" className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl bg-turquesa/25 p-4">
            <Check className="size-5 shrink-0" aria-hidden="true" />
            <p className="flex-1 font-semibold">Adicionado à sacola!</p>
            <Link href="/sacola" className="rounded-full bg-marinho px-5 py-2.5 font-display font-semibold text-creme">
              Ver sacola
            </Link>
          </div>
        )}

        {product.description && (
          <div className="mt-8 border-t-2 border-marinho/10 pt-6">
            <h2 className="text-xl">Sobre a peça</h2>
            <p className="mt-2 leading-relaxed text-marinho-soft">{product.description}</p>
          </div>
        )}

        <p className="mt-6 text-sm text-marinho-soft">
          Ficou com dúvida?{" "}
          <a href={whatsappHref} className="font-bold text-marinho underline underline-offset-4">
            Fale com a gente no WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}
