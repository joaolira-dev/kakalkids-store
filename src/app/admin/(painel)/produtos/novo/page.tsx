import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { getProductFormOptions } from "@/lib/admin/products";

export const metadata: Metadata = { title: "Novo produto" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/produtos" className="inline-flex items-center gap-1.5 font-bold text-marinho-soft hover:text-marinho">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Produtos
      </Link>
      <h1 className="mt-3 mb-6 text-3xl sm:text-4xl">Novo produto</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-[36rem] animate-pulse rounded-3xl bg-creme-dark" />}>
        <NewProductForm />
      </Suspense>
    </div>
  );
}

async function NewProductForm() {
  const options = await getProductFormOptions();
  return <ProductForm options={options} product={null} />;
}
