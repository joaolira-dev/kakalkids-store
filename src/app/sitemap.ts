import type { MetadataRoute } from "next";
import { getSitemapProducts } from "@/lib/catalog/queries";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getSitemapProducts();
  const pages = ["", "/catalogo", "/como-comprar", "/entregas", "/trocas", "/guia-de-tamanhos", "/privacidade"];

  return [
    ...pages.map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.6 })),
    ...products.map((p) => ({
      url: `${siteUrl}/produto/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
