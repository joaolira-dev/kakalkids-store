import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog/types";
import { Price } from "./price";
import { ProductPlaceholder } from "./product-placeholder";

type ProductCardProps = {
  product: CatalogProduct;
  colorHex: Record<string, string>;
  priority?: boolean;
};

export function ProductCard({ product, colorHex, priority = false }: ProductCardProps) {
  const colors = product.colors_available.slice(0, 5);
  const extraColors = product.colors_available.length - colors.length;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-creme-dark">
        {product.cover_image ? (
          <Image
            src={product.cover_image}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <ProductPlaceholder seed={product.slug} className="absolute inset-0" />
        )}
        {!product.in_stock && (
          <span className="absolute top-3 left-3 rounded-full bg-marinho px-3 py-1 text-xs font-bold text-creme">
            Esgotado
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1 px-1">
        <h3 className="font-sans text-base leading-snug font-semibold">
          <Link href={`/produto/${product.slug}`} className="after:absolute after:inset-0 hover:underline">
            {product.name}
          </Link>
        </h3>
        <Price price={product.min_price} compareAt={product.compare_at_price} />
        {colors.length > 0 && (
          <p className="mt-0.5 flex items-center gap-1.5">
            <span className="sr-only">Cores: {product.colors_available.join(", ")}</span>
            {colors.map((name) => (
              <span
                key={name}
                aria-hidden="true"
                title={name}
                className="size-3.5 rounded-full ring-1 ring-marinho/20"
                style={{ backgroundColor: colorHex[name] ?? "#ccc" }}
              />
            ))}
            {extraColors > 0 && (
              <span aria-hidden="true" className="text-xs text-marinho-soft">
                +{extraColors}
              </span>
            )}
          </p>
        )}
      </div>
    </article>
  );
}
