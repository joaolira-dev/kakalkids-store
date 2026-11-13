import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { ProductPurchase } from "@/components/product/product-purchase";
import { SizeChartTable } from "@/components/product/size-chart";
import { whatsappLink } from "@/config/site";
import { getProductBySlug } from "@/lib/catalog/queries";
import { ageGroupLabels } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };

  const description =
    product.description ?? `${product.name} por ${formatPrice(product.base_price)} na KakalKids Store.`;
  const image = product.images[0]?.url;
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: image ? [image] : undefined },
  };
}

export default function ProductPage({ params }: PageProps<"/produto/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-20 sm:px-6">
      <Suspense fallback={<ProductSkeleton />}>
        <Product params={params} />
      </Suspense>
    </div>
  );
}

async function Product({ params }: { params: PageProps<"/produto/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const whatsappHref = whatsappLink(`Oi! Tenho uma dúvida sobre o produto "${product.name}".`);

  return (
    <>
      <nav aria-label="Você está em" className="mb-6 text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-marinho-soft">
          <li>
            <Link href="/catalogo" className="hover:text-marinho hover:underline">
              Catálogo
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="size-4" /></li>
          <li>
            <Link href={`/catalogo?idade=${product.age_group}`} className="hover:text-marinho hover:underline">
              {ageGroupLabels[product.age_group]}
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden="true"><ChevronRight className="size-4" /></li>
              <li>
                <Link
                  href={`/catalogo?categoria=${product.category.slug}`}
                  className="hover:text-marinho hover:underline"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
        </ol>
      </nav>

      <ProductPurchase product={product} whatsappHref={whatsappHref} />

      {product.size_chart && (
        <div className="mt-16">
          <SizeChartTable chart={product.size_chart} />
        </div>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div aria-hidden="true" className="grid animate-pulse gap-8 motion-reduce:animate-none lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <div className="aspect-[4/5] rounded-[2rem] bg-creme-dark" />
      <div className="space-y-4">
        <div className="h-12 w-3/4 rounded-full bg-creme-dark" />
        <div className="h-8 w-40 rounded-full bg-creme-dark" />
        <div className="mt-8 h-12 w-64 rounded-full bg-creme-dark" />
        <div className="h-12 w-72 rounded-full bg-creme-dark" />
        <div className="h-14 rounded-full bg-creme-dark" />
      </div>
    </div>
  );
}
