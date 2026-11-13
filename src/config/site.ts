export const siteConfig = {
  name: "KakalKids Store",
  tagline: "Vestindo criança como criança.",
  city: "João Pessoa - PB",
  instagram: {
    handle: "@kakalkidsstore",
    url: "https://www.instagram.com/kakalkidsstore",
  },
  // Número só com dígitos, com DDI e DDD (ex.: 5583999999999).
  // Depois passa a vir de store_settings no Supabase.
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
} as const;

export function whatsappLink(message?: string) {
  const base = siteConfig.whatsappNumber
    ? `https://wa.me/${siteConfig.whatsappNumber}`
    : "https://wa.me/";
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "Novidades", href: "/catalogo?ordem=novidades" },
  { label: "Meninas", href: "/catalogo?genero=menina" },
  { label: "Meninos", href: "/catalogo?genero=menino" },
  { label: "Bebê", href: "/catalogo?idade=bebe" },
  { label: "Teen", href: "/catalogo?idade=teen" },
  { label: "Looks", href: "/looks" },
];

export const helpNav: NavItem[] = [
  { label: "Como comprar", href: "/como-comprar" },
  { label: "Entregas", href: "/entregas" },
  { label: "Trocas", href: "/trocas" },
  { label: "Guia de tamanhos", href: "/guia-de-tamanhos" },
];

export type DeliveryMethod = "pickup" | "local_delivery" | "shipping";

export const deliveryOptions: { value: DeliveryMethod; label: string; description: string }[] = [
  { value: "pickup", label: "Retirar", description: "Combine o horário e retire em João Pessoa" },
  { value: "local_delivery", label: "Entrega local", description: "Entregamos em João Pessoa e região" },
  { value: "shipping", label: "Envio pelos Correios", description: "Para todo o Brasil, frete combinado no WhatsApp" },
];
