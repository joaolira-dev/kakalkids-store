import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Permite abrir o servidor de dev por 127.0.0.1 além de localhost
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      { source: "/admin", destination: "/admin/pedidos", permanent: false },
      // "Looks" (como nos destaques do Instagram) = conjuntos prontos
      { source: "/looks", destination: "/catalogo?categoria=conjuntos", permanent: false },
    ];
  },
  images: {
    // As fotos já são comprimidas em WebP no upload e servidas pelo CDN do
    // Supabase. Sem otimização, o Next não as passa pelo CDN da hospedagem,
    // o que poupa a banda do plano gratuito.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
