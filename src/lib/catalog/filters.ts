import type { AgeGroup, CatalogFilters, Gender, SortOption } from "./types";

type RawParams = Record<string, string | string[] | undefined>;

const GENDERS: Gender[] = ["menina", "menino", "unissex"];
const AGE_GROUPS: AgeGroup[] = ["bebe", "infantil", "teen"];
const SORTS: SortOption[] = ["novidades", "menor-preco", "maior-preco"];

export const PAGE_SIZE = 24;

function list(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return [...new Set(raw.split(",").map((v) => v.trim()).filter(Boolean))].slice(0, 30);
}

function oneOf<T extends string>(values: string[], allowed: T[]): T[] {
  return values.filter((v): v is T => (allowed as string[]).includes(v));
}

export function parseFilters(params: RawParams): CatalogFilters {
  const first = (key: string) => list(params[key])[0] ?? null;
  const ordem = first("ordem");
  const pagina = Number.parseInt(first("pagina") ?? "1", 10);

  return {
    genero: oneOf(list(params.genero), GENDERS),
    idade: oneOf(list(params.idade), AGE_GROUPS),
    tamanho: list(params.tamanho),
    cor: list(params.cor),
    categoria: list(params.categoria),
    colecao: first("colecao"),
    promocao: first("promocao") === "1",
    busca: first("busca")?.slice(0, 80) ?? null,
    ordem: ordem && (SORTS as string[]).includes(ordem) ? (ordem as SortOption) : "novidades",
    pagina: Number.isFinite(pagina) && pagina > 0 ? pagina : 1,
  };
}

type ListKey = "genero" | "idade" | "tamanho" | "cor" | "categoria";

/** Gera a URL do catálogo com os filtros informados (omitindo os vazios). */
export function catalogHref(filters: CatalogFilters) {
  const params = new URLSearchParams();
  const lists: ListKey[] = ["genero", "idade", "categoria", "tamanho", "cor"];
  for (const key of lists) {
    if (filters[key].length) params.set(key, filters[key].join(","));
  }
  if (filters.colecao) params.set("colecao", filters.colecao);
  if (filters.promocao) params.set("promocao", "1");
  if (filters.busca) params.set("busca", filters.busca);
  if (filters.ordem !== "novidades") params.set("ordem", filters.ordem);
  if (filters.pagina > 1) params.set("pagina", String(filters.pagina));
  const qs = params.toString();
  return qs ? `/catalogo?${qs}` : "/catalogo";
}

/** URL com um valor de filtro ligado/desligado (volta para a página 1). */
export function toggleHref(filters: CatalogFilters, key: ListKey, value: string) {
  const current = filters[key] as string[];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  return catalogHref({ ...filters, [key]: next, pagina: 1 });
}

export function countActiveFilters(filters: CatalogFilters) {
  return (
    filters.genero.length +
    filters.idade.length +
    filters.tamanho.length +
    filters.cor.length +
    filters.categoria.length +
    (filters.promocao ? 1 : 0)
  );
}

export const emptyFilters: CatalogFilters = parseFilters({});
