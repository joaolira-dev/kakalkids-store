export type Gender = "menina" | "menino" | "unissex";
export type AgeGroup = "bebe" | "infantil" | "teen";
export type SortOption = "novidades" | "menor-preco" | "maior-preco";

export const genderLabels: Record<Gender, string> = {
  menina: "Meninas",
  menino: "Meninos",
  unissex: "Unissex",
};

export const ageGroupLabels: Record<AgeGroup, string> = {
  bebe: "Bebê",
  infantil: "Infantil",
  teen: "Teen",
};

export const sortLabels: Record<SortOption, string> = {
  novidades: "Novidades",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
};

export type CatalogFilters = {
  genero: Gender[];
  idade: AgeGroup[];
  tamanho: string[];
  cor: string[];
  categoria: string[];
  colecao: string | null;
  promocao: boolean;
  busca: string | null;
  ordem: SortOption;
  pagina: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  gender: Gender;
  age_group: AgeGroup;
  min_price: number;
  compare_at_price: number | null;
  in_stock: boolean;
  sizes_available: string[];
  colors_available: string[];
  cover_image: string | null;
  created_at: string;
};

export type FilterOptions = {
  categories: { name: string; slug: string }[];
  colors: { name: string; hex: string }[];
  sizes: { label: string; age_group: AgeGroup }[];
};

export type ProductVariant = {
  id: string;
  sku: string | null;
  stock: number;
  price: number;
  color: { id: string; name: string; hex: string } | null;
  size: { id: string; label: string; sort_order: number };
};

export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  color_id: string | null;
};

export type SizeChart = {
  name: string;
  chart: { columns: string[]; rows: string[][] };
  notes: string | null;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  gender: Gender;
  age_group: AgeGroup;
  base_price: number;
  compare_at_price: number | null;
  category: { name: string; slug: string } | null;
  size_chart: SizeChart | null;
  variants: ProductVariant[];
  images: ProductImage[];
};
