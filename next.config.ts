import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Permite abrir o servidor de dev por 127.0.0.1 além de localhost
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [{ source: "/admin", destination: "/admin/pedidos", permanent: false }];
  },
  images: {
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
