"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { saveProduct, type ProductInput } from "@/lib/admin/product-actions";
import type { EditableProduct, ProductFormOptions } from "@/lib/admin/products";
import { ageGroupLabels, genderLabels, type AgeGroup, type Gender } from "@/lib/catalog/types";

export const field =
  "h-12 w-full rounded-2xl border-2 border-marinho/15 bg-white px-4 focus:border-marinho focus:outline-none";
const label = "mb-1.5 block font-semibold";

function toInput(value: number | null) {
  return value === null ? "" : value.toFixed(2).replace(".", ",");
}

export function ProductForm({ options, product }: { options: ProductFormOptions; product: EditableProduct | null }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>({
    id: product?.id,
    name: product?.name ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? null,
    gender: product?.gender ?? "menina",
    age_group: product?.age_group ?? "infantil",
    base_price: toInput(product?.base_price ?? null),
    compare_at_price: toInput(product?.compare_at_price ?? null),
    size_chart_id: product?.size_chart_id ?? null,
    active: product?.active ?? true,
    featured: product?.featured ?? false,
    collection_ids: product?.collection_ids ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveProduct(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!product) {
        router.push(`/admin/produtos/${result.id}?novo=1`);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-3xl bg-white p-5 sm:p-7" noValidate>
      <div>
        <label htmlFor="nome" className={label}>
          Nome do produto
        </label>
        <input
          id="nome"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ex.: Vestido Babados Branco"
          className={field}
          required
        />
      </div>

      <div>
        <label htmlFor="descricao" className={label}>
          Descrição
        </label>
        <textarea
          id="descricao"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          placeholder="Tecido, detalhes, cuidados com a peça…"
          className={`${field} h-auto py-3`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="preco" className={label}>
            Preço de venda (R$)
          </label>
          <input
            id="preco"
            inputMode="decimal"
            value={String(form.base_price)}
            onChange={(e) => set("base_price", e.target.value)}
            placeholder="129,90"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="preco-de" className={label}>
            Preço “de” (opcional)
          </label>
          <input
            id="preco-de"
            inputMode="decimal"
            value={String(form.compare_at_price ?? "")}
            onChange={(e) => set("compare_at_price", e.target.value)}
            placeholder="Aparece riscado, para promoções"
            className={field}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset>
          <legend className={label}>Para quem</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(genderLabels) as Gender[]).map((g) => (
              <Choice key={g} active={form.gender === g} onClick={() => set("gender", g)}>
                {genderLabels[g]}
              </Choice>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className={label}>Idade</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ageGroupLabels) as AgeGroup[]).map((a) => (
              <Choice key={a} active={form.age_group === a} onClick={() => set("age_group", a)}>
                {ageGroupLabels[a]}
              </Choice>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="categoria" className={label}>
            Categoria
          </label>
          <select
            id="categoria"
            value={form.category_id ?? ""}
            onChange={(e) => set("category_id", e.target.value || null)}
            className={field}
          >
            <option value="">Sem categoria</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="medidas" className={label}>
            Tabela de medidas
          </label>
          <select
            id="medidas"
            value={form.size_chart_id ?? ""}
            onChange={(e) => set("size_chart_id", e.target.value || null)}
            className={field}
          >
            <option value="">Nenhuma</option>
            {options.sizeCharts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {options.collections.length > 0 && (
        <fieldset>
          <legend className={label}>Coleções</legend>
          <div className="flex flex-wrap gap-2">
            {options.collections.map((c) => {
              const active = form.collection_ids.includes(c.id);
              return (
                <Choice
                  key={c.id}
                  active={active}
                  onClick={() =>
                    set("collection_ids", active ? form.collection_ids.filter((id) => id !== c.id) : [...form.collection_ids, c.id])
                  }
                >
                  {c.name}
                </Choice>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap gap-6 border-t-2 border-marinho/10 pt-5">
        <Toggle checked={form.active} onChange={(v) => set("active", v)} label="Visível na loja" />
        <Toggle checked={form.featured} onChange={(v) => set("featured", v)} label="Destaque (aparece primeiro)" />
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-coral/15 p-3 font-semibold">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 items-center gap-2 rounded-full bg-marinho px-7 font-display text-lg font-semibold text-creme hover:bg-cobalto disabled:opacity-60"
        >
          {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          {product ? "Salvar informações" : "Criar produto e continuar"}
        </button>
        {saved && (
          <p role="status" className="flex items-center gap-1.5 font-semibold text-cobalto">
            <Check className="size-5" aria-hidden="true" />
            Salvo
          </p>
        )}
        {!product && <p className="text-sm text-marinho-soft">Depois você adiciona fotos, cores, tamanhos e estoque.</p>}
      </div>
    </form>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border-2 px-4 py-2 font-semibold transition-colors ${active ? "border-marinho bg-marinho text-creme" : "border-marinho/15 hover:border-marinho"}`}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label: text }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 font-semibold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`inline-flex h-7 w-12 items-center rounded-full transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalto ${checked ? "bg-turquesa" : "bg-marinho/15"}`}
      >
        <span className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </span>
      {text}
    </label>
  );
}
