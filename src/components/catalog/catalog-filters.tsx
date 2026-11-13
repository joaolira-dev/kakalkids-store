import Link from "next/link";
import { Check } from "lucide-react";
import { catalogHref, toggleHref } from "@/lib/catalog/filters";
import {
  ageGroupLabels,
  genderLabels,
  type AgeGroup,
  type CatalogFilters,
  type FilterOptions,
} from "@/lib/catalog/types";

type Props = { filters: CatalogFilters; options: FilterOptions };

const chip =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 px-3.5 text-[0.95rem] font-semibold transition-colors";
const chipOff = "border-marinho/15 bg-white hover:border-marinho";
const chipOn = "border-marinho bg-marinho text-creme";

export function CatalogFiltersPanel({ filters, options }: Props) {
  const sizesByAge = (["bebe", "infantil", "teen"] as AgeGroup[])
    .map((age) => ({ age, sizes: options.sizes.filter((s) => s.age_group === age) }))
    .filter((g) => g.sizes.length);

  return (
    <div className="flex flex-col gap-7">
      <FilterGroup title="Para quem">
        {(["menina", "menino"] as const).map((g) => (
          <ToggleChip key={g} href={toggleHref(filters, "genero", g)} active={filters.genero.includes(g)}>
            {genderLabels[g]}
          </ToggleChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Idade">
        {(Object.keys(ageGroupLabels) as AgeGroup[]).map((age) => (
          <ToggleChip key={age} href={toggleHref(filters, "idade", age)} active={filters.idade.includes(age)}>
            {ageGroupLabels[age]}
          </ToggleChip>
        ))}
      </FilterGroup>

      {options.categories.length > 0 && (
        <FilterGroup title="Categoria">
          {options.categories.map((c) => (
            <ToggleChip
              key={c.slug}
              href={toggleHref(filters, "categoria", c.slug)}
              active={filters.categoria.includes(c.slug)}
            >
              {c.name}
            </ToggleChip>
          ))}
        </FilterGroup>
      )}

      <fieldset>
        <legend className="font-display text-lg font-semibold">Tamanho</legend>
        <div className="mt-3 flex flex-col gap-3">
          {sizesByAge.map(({ age, sizes }) => (
            <div key={age}>
              <p className="mb-1.5 text-sm text-marinho-soft">{ageGroupLabels[age]}</p>
              <ul className="flex flex-wrap gap-1.5">
                {sizes.map((s) => {
                  const active = filters.tamanho.includes(s.label);
                  return (
                    <li key={s.label}>
                      <Link
                        href={toggleHref(filters, "tamanho", s.label)}
                        aria-current={active ? "true" : undefined}
                        scroll={false}
                        className={`flex h-10 min-w-10 items-center justify-center rounded-xl border-2 px-2 text-sm font-bold transition-colors ${active ? chipOn : chipOff}`}
                      >
                        <span className="sr-only">Tamanho </span>
                        {s.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </fieldset>

      {options.colors.length > 0 && (
        <FilterGroup title="Cor">
          {options.colors.map((c) => {
            const active = filters.cor.includes(c.name);
            return (
              <Link
                key={c.name}
                href={toggleHref(filters, "cor", c.name)}
                aria-current={active ? "true" : undefined}
                scroll={false}
                className={`${chip} pl-1.5 ${active ? chipOn : chipOff}`}
              >
                <span
                  aria-hidden="true"
                  className="size-6 rounded-full ring-1 ring-marinho/20"
                  style={{ backgroundColor: c.hex }}
                />
                {c.name}
              </Link>
            );
          })}
        </FilterGroup>
      )}

      <FilterGroup title="Ofertas">
        <ToggleChip
          href={catalogHref({ ...filters, promocao: !filters.promocao, pagina: 1 })}
          active={filters.promocao}
        >
          Em promoção
        </ToggleChip>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="font-display text-lg font-semibold">{title}</legend>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function ToggleChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      scroll={false}
      className={`${chip} ${active ? chipOn : chipOff}`}
    >
      {active && <Check className="size-4" aria-hidden="true" />}
      {children}
    </Link>
  );
}
