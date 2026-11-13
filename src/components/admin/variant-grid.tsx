"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { createColor, saveVariants } from "@/lib/admin/product-actions";
import type { EditableProduct, ProductFormOptions } from "@/lib/admin/products";
import { ageGroupLabels, type AgeGroup } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";

type Props = {
  productId: string;
  basePrice: number;
  variants: EditableProduct["variants"];
  colors: ProductFormOptions["colors"];
  sizes: ProductFormOptions["sizes"];
};

type Cell = { stock: string; price: string; sku: string };
const NO_COLOR = "sem-cor";
const keyOf = (colorId: string, sizeId: string) => `${colorId}|${sizeId}`;

export function VariantGrid({ productId, basePrice, variants, colors: initialColors, sizes }: Props) {
  const active = variants.filter((v) => v.active);
  const [colors, setColors] = useState(initialColors);
  const [colorIds, setColorIds] = useState<string[]>(() => {
    const ids = [...new Set(active.map((v) => v.color_id ?? NO_COLOR))];
    return ids;
  });
  const [sizeIds, setSizeIds] = useState<string[]>(() => [...new Set(active.map((v) => v.size_id))]);
  const [cells, setCells] = useState<Record<string, Cell>>(() =>
    Object.fromEntries(
      active.map((v) => [
        keyOf(v.color_id ?? NO_COLOR, v.size_id),
        { stock: String(v.stock), price: v.price_override === null ? "" : v.price_override.toFixed(2).replace(".", ","), sku: v.sku ?? "" },
      ]),
    ),
  );
  const [bulkStock, setBulkStock] = useState("");
  const [newColor, setNewColor] = useState<{ name: string; hex: string } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const orderedSizes = useMemo(() => sizes.filter((s) => sizeIds.includes(s.id)), [sizes, sizeIds]);
  const rowsColors = colorIds.length ? colorIds : [];
  const cell = (k: string): Cell => cells[k] ?? { stock: "0", price: "", sku: "" };
  const setCell = (k: string, patch: Partial<Cell>) => {
    setCells((c) => ({ ...c, [k]: { ...cell(k), ...patch } }));
    setMessage(null);
  };

  const totalStock = rowsColors.reduce(
    (sum, c) => sum + orderedSizes.reduce((s, size) => s + (Number(cell(keyOf(c, size.id)).stock) || 0), 0),
    0,
  );

  function toggle(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    setMessage(null);
  }

  function applyBulk() {
    const value = String(Math.max(0, Math.trunc(Number(bulkStock) || 0)));
    const next = { ...cells };
    for (const c of rowsColors) for (const s of orderedSizes) next[keyOf(c, s.id)] = { ...cell(keyOf(c, s.id)), stock: value };
    setCells(next);
    setBulkStock("");
  }

  function addColor() {
    if (!newColor) return;
    startTransition(async () => {
      const r = await createColor(newColor.name, newColor.hex);
      if (!r.ok) {
        setMessage({ ok: false, text: r.error });
        return;
      }
      setColors((cs) => [...cs, r.color].sort((a, b) => a.name.localeCompare(b.name)));
      setColorIds((ids) => [...ids, r.color.id]);
      setNewColor(null);
    });
  }

  function save() {
    if (!rowsColors.length || !orderedSizes.length) {
      setMessage({ ok: false, text: "Escolha ao menos uma cor (ou “Sem cor”) e um tamanho." });
      return;
    }
    const payload = rowsColors.flatMap((c) =>
      orderedSizes.map((s) => {
        const v = cell(keyOf(c, s.id));
        return {
          color_id: c === NO_COLOR ? null : c,
          size_id: s.id,
          stock: Number(v.stock) || 0,
          price_override: v.price.trim() || null,
          sku: v.sku.trim() || null,
        };
      }),
    );
    startTransition(async () => {
      const r = await saveVariants(productId, payload);
      setMessage(r.ok ? { ok: true, text: r.changed ? "Variações e estoque salvos" : "Nada mudou" } : { ok: false, text: r.error });
    });
  }

  const colorById = Object.fromEntries(colors.map((c) => [c.id, c]));
  const sizesByAge = (["bebe", "infantil", "teen"] as AgeGroup[]).map((age) => ({
    age,
    items: sizes.filter((s) => s.age_group === age),
  }));

  return (
    <section aria-labelledby="variacoes" className="rounded-3xl bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="variacoes" className="text-2xl">
          Cores, tamanhos e estoque
        </h2>
        <p className="font-semibold">
          Total em estoque: <span className="font-display text-xl">{totalStock}</span>
        </p>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 font-semibold">Cores</legend>
        <div className="flex flex-wrap gap-2">
          <Chip active={colorIds.includes(NO_COLOR)} onClick={() => toggle(colorIds, NO_COLOR, setColorIds)}>
            Sem cor
          </Chip>
          {colors.map((c) => (
            <Chip key={c.id} active={colorIds.includes(c.id)} onClick={() => toggle(colorIds, c.id, setColorIds)}>
              <span aria-hidden="true" className="size-5 rounded-full ring-1 ring-marinho/20" style={{ backgroundColor: c.hex }} />
              {c.name}
            </Chip>
          ))}
          {newColor ? (
            <div className="flex items-center gap-2 rounded-full border-2 border-marinho/15 py-1 pr-1 pl-2">
              <input
                type="color"
                aria-label="Tom da nova cor"
                value={newColor.hex}
                onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                className="size-7 cursor-pointer rounded-full border-0 bg-transparent"
              />
              <input
                aria-label="Nome da nova cor"
                value={newColor.name}
                onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                placeholder="Nome da cor"
                className="w-32 bg-transparent font-semibold focus:outline-none"
                autoFocus
              />
              <button type="button" onClick={addColor} disabled={pending} className="rounded-full bg-marinho px-3 py-1.5 text-sm font-bold text-creme">
                Criar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setNewColor({ name: "", hex: "#F7A1C4" })}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-marinho/25 px-4 py-2 font-semibold hover:border-marinho"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova cor
            </button>
          )}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="mb-2 font-semibold">Tamanhos</legend>
        <div className="flex flex-col gap-3">
          {sizesByAge.map(
            ({ age, items }) =>
              items.length > 0 && (
                <div key={age} className="flex flex-wrap items-center gap-2">
                  <span className="w-16 text-sm text-marinho-soft">{ageGroupLabels[age]}</span>
                  {items.map((s) => (
                    <Chip key={s.id} active={sizeIds.includes(s.id)} onClick={() => toggle(sizeIds, s.id, setSizeIds)} compact>
                      {s.label}
                    </Chip>
                  ))}
                </div>
              ),
          )}
        </div>
      </fieldset>

      {rowsColors.length > 0 && orderedSizes.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-end gap-2 rounded-2xl bg-creme p-3">
            <label htmlFor="estoque-todos" className="w-full text-sm font-semibold sm:w-auto sm:self-center">
              Mesmo estoque para todos:
            </label>
            <input
              id="estoque-todos"
              inputMode="numeric"
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value.replace(/\D/g, ""))}
              className="h-10 w-24 rounded-xl border-2 border-marinho/15 bg-white px-3"
              placeholder="Qtd."
            />
            <button type="button" onClick={applyBulk} disabled={!bulkStock} className="h-10 rounded-xl bg-marinho px-4 font-bold text-creme disabled:opacity-40">
              Aplicar
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-5">
            {rowsColors.map((c) => {
              const color = c === NO_COLOR ? null : colorById[c];
              return (
                <div key={c} className="overflow-x-auto rounded-2xl ring-2 ring-marinho/10">
                  <table className="w-full min-w-[34rem] text-left">
                    <caption className="bg-creme px-4 py-2.5 text-left font-display text-lg font-semibold">
                      <span className="inline-flex items-center gap-2">
                        {color && <span aria-hidden="true" className="size-4 rounded-full ring-1 ring-marinho/20" style={{ backgroundColor: color.hex }} />}
                        {color?.name ?? "Sem cor"}
                      </span>
                    </caption>
                    <thead className="text-sm text-marinho-soft">
                      <tr>
                        <th scope="col" className="px-4 py-2 font-semibold">Tamanho</th>
                        <th scope="col" className="px-4 py-2 font-semibold">Estoque</th>
                        <th scope="col" className="px-4 py-2 font-semibold">Preço especial</th>
                        <th scope="col" className="px-4 py-2 font-semibold">SKU (opcional)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedSizes.map((s) => {
                        const k = keyOf(c, s.id);
                        const v = cell(k);
                        const label = `${color?.name ?? "Sem cor"}, tamanho ${s.label}`;
                        return (
                          <tr key={k} className="border-t border-marinho/5">
                            <th scope="row" className="px-4 py-2 font-display text-lg font-semibold">{s.label}</th>
                            <td className="px-4 py-2">
                              <input
                                aria-label={`Estoque ${label}`}
                                inputMode="numeric"
                                value={v.stock}
                                onChange={(e) => setCell(k, { stock: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                                className={`h-10 w-20 rounded-xl border-2 bg-white px-3 font-semibold ${v.stock === "0" || v.stock === "" ? "border-coral/40" : "border-marinho/15"}`}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                aria-label={`Preço especial ${label}`}
                                inputMode="decimal"
                                value={v.price}
                                onChange={(e) => setCell(k, { price: e.target.value })}
                                placeholder={formatPrice(basePrice)}
                                className="h-10 w-28 rounded-xl border-2 border-marinho/15 bg-white px-3"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                aria-label={`SKU ${label}`}
                                value={v.sku}
                                onChange={(e) => setCell(k, { sku: e.target.value })}
                                className="h-10 w-36 rounded-xl border-2 border-marinho/15 bg-white px-3 uppercase"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex h-12 items-center gap-2 rounded-full bg-marinho px-7 font-display text-lg font-semibold text-creme hover:bg-cobalto disabled:opacity-60"
        >
          {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          Salvar variações e estoque
        </button>
        {message && (
          <p role="status" className={`flex items-center gap-1.5 font-semibold ${message.ok ? "text-cobalto" : "text-coral"}`}>
            {message.ok && <Check className="size-5" aria-hidden="true" />}
            {message.text}
          </p>
        )}
      </div>
      <p className="mt-3 text-sm text-marinho-soft">
        Preço especial em branco usa o preço do produto. Tirar uma cor ou tamanho da grade esconde essa variação da loja, sem
        apagar o histórico de pedidos.
      </p>
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full border-2 font-semibold transition-colors ${compact ? "h-10 min-w-10 justify-center px-3" : "px-4 py-2"} ${
        active ? "border-marinho bg-marinho text-creme" : "border-marinho/15 hover:border-marinho"
      }`}
    >
      {children}
    </button>
  );
}
