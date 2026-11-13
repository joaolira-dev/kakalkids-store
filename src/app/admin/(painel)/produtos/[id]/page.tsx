import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImages } from "@/components/admin/product-images";
import { VariantGrid } from "@/components/admin/variant-grid";
import { getEditableProduct, getProductFormOptions } from "@/lib/admin/products";

export const metadata: Metadata = { title: "Editar produto" };

export default function EditProductPage({ params, searchParams }: PageProps<"/admin/produtos/[id]">) {
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/produtos" className="inline-flex items-center gap-1.5 font-bold text-marinho-soft hover:text-marinho">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Produtos
      </Link>
      <Suspense fallback={<div aria-hidden="true" className="mt-4 h-[40rem] animate-pulse rounded-3xl bg-creme-dark" />}>
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Editor({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/produtos/[id]">["params"];
  searchParams: PageProps<"/admin/produtos/[id]">["searchParams"];
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [product, options] = await Promise.all([getEditableProduct(id), getProductFormOptions()]);
  if (!product) notFound();

  const isNew = query.novo === "1";
  const hasVariants = product.variants.some((v) => v.active);

  return (
    <>
      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl sm:text-4xl">{product.name}</h1>
        {product.active && hasVariants && (
          <Link
            href={`/produto/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-bold ring-2 ring-marinho/15 hover:ring-marinho"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Ver na loja
          </Link>
        )}
      </div>

      {isNew && (
        <p role="status" className="mb-6 rounded-2xl bg-turquesa/25 p-4 font-semibold">
          Produto criado! Agora adicione as fotos e monte a grade de cores, tamanhos e estoque.
        </p>
      )}
      {!hasVariants && !isNew && (
        <p className="mb-6 rounded-2xl bg-sol/40 p-4 font-semibold">
          Este produto ainda não tem variações com estoque, então não aparece na loja para compra.
        </p>
      )}

      <div className="flex flex-col gap-6">
        <ProductImages productId={product.id} images={product.images} colors={options.colors} />
        <VariantGrid
          productId={product.id}
          basePrice={product.base_price}
          variants={product.variants}
          colors={options.colors}
          sizes={options.sizes}
        />
        <div>
          <h2 className="mb-3 text-2xl">Informações</h2>
          <ProductForm options={options} product={product} />
        </div>
      </div>
    </>
  );
}
