"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCoupon, saveCoupon, setCouponActive, type CouponInput } from "@/lib/admin/coupon-actions";
import type { AdminCoupon, CouponState } from "@/lib/admin/coupons";
import { formatPrice } from "@/lib/format";

type Row = AdminCoupon & { state: CouponState };

const stateStyle: Record<CouponState, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-turquesa" },
  pausado: { label: "Pausado", className: "bg-marinho/10" },
  agendado: { label: "Agendado", className: "bg-sol" },
  expirado: { label: "Expirado", className: "bg-coral/15" },
  esgotado: { label: "Esgotado", className: "bg-coral/15" },
};

const empty: CouponInput = {
  code: "",
  type: "percent",
  value: "",
  min_order_value: "",
  max_uses: "",
  starts_on: "",
  ends_on: "",
  active: true,
};

const toDay = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) : "";
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
const money = (n: number) => (n ? n.toFixed(2).replace(".", ",") : "");

function describe(c: Pick<AdminCoupon, "type" | "value">) {
  return c.type === "percent" ? `${String(c.value).replace(".", ",")}% de desconto` : `${formatPrice(c.value)} de desconto`;
}

export function CouponManager({ coupons }: { coupons: Row[] }) {
  const [editing, setEditing] = useState<CouponInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function edit(c: Row) {
    setError(null);
    setEditing({
      id: c.id,
      code: c.code,
      type: c.type,
      value: String(c.value).replace(".", ","),
      min_order_value: money(c.min_order_value),
      max_uses: c.max_uses ? String(c.max_uses) : "",
      starts_on: toDay(c.starts_at),
      ends_on: toDay(c.expires_at),
      active: c.active,
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      const r = await saveCoupon(editing);
      if (r.ok) setEditing(null);
      else setError(r.error);
    });
  }

  const set = <K extends keyof CouponInput>(k: K, v: CouponInput[K]) => setEditing((f) => (f ? { ...f, [k]: v } : f));
  const input = "h-12 w-full rounded-2xl border-2 border-marinho/15 bg-white px-4 focus:border-marinho focus:outline-none";

  return (
    <div className="flex flex-col gap-6">
      {editing ? (
        <form onSubmit={submit} className="grid gap-5 rounded-3xl bg-white p-5 sm:p-7" noValidate>
          <h2 className="text-2xl">{editing.id ? `Editar ${editing.code}` : "Novo cupom"}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="codigo" className="mb-1.5 block font-semibold">Código</label>
              <input
                id="codigo"
                value={editing.code}
                onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="Ex.: BEMVINDA10"
                className={`${input} font-bold tracking-wide uppercase`}
                autoFocus
              />
            </div>
            <fieldset>
              <legend className="mb-1.5 font-semibold">Tipo</legend>
              <div className="flex gap-2">
                {(["percent", "fixed"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={editing.type === t}
                    onClick={() => set("type", t)}
                    className={`h-12 flex-1 rounded-2xl border-2 font-semibold ${editing.type === t ? "border-marinho bg-marinho text-creme" : "border-marinho/15"}`}
                  >
                    {t === "percent" ? "Porcentagem (%)" : "Valor fixo (R$)"}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="valor" className="mb-1.5 block font-semibold">
                Desconto {editing.type === "percent" ? "(%)" : "(R$)"}
              </label>
              <input id="valor" inputMode="decimal" value={editing.value} onChange={(e) => set("value", e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="minimo" className="mb-1.5 block font-semibold">Pedido mínimo (R$)</label>
              <input id="minimo" inputMode="decimal" value={editing.min_order_value} onChange={(e) => set("min_order_value", e.target.value)} placeholder="Sem mínimo" className={input} />
            </div>
            <div>
              <label htmlFor="usos" className="mb-1.5 block font-semibold">Limite de usos</label>
              <input id="usos" inputMode="numeric" value={editing.max_uses} onChange={(e) => set("max_uses", e.target.value.replace(/\D/g, ""))} placeholder="Ilimitado" className={input} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="inicio" className="mb-1.5 block font-semibold">Válido a partir de</label>
              <input id="inicio" type="date" value={editing.starts_on} onChange={(e) => set("starts_on", e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="fim" className="mb-1.5 block font-semibold">Válido até</label>
              <input id="fim" type="date" value={editing.ends_on} onChange={(e) => set("ends_on", e.target.value)} className={input} />
            </div>
          </div>
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" checked={editing.active} onChange={(e) => set("active", e.target.checked)} className="size-5 accent-marinho" />
            Cupom ativo
          </label>
          {error && <p role="alert" className="rounded-2xl bg-coral/15 p-3 font-semibold">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={pending} className="flex h-12 items-center gap-2 rounded-full bg-marinho px-7 font-display text-lg font-semibold text-creme hover:bg-cobalto disabled:opacity-60">
              {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              Salvar cupom
            </button>
            <button type="button" onClick={() => setEditing(null)} className="h-12 rounded-full px-5 font-bold underline underline-offset-4">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setEditing(empty);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-rosa px-5 py-3 font-display text-lg font-semibold text-white hover:-translate-y-0.5"
          >
            <Plus className="size-5" aria-hidden="true" />
            Novo cupom
          </button>
          {error && <p role="alert" className="mt-4 rounded-2xl bg-coral/15 p-3 font-semibold">{error}</p>}
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">Nenhum cupom ainda</p>
          <p className="mt-1 text-marinho-soft">Crie cupons para campanhas no Instagram, primeira compra ou datas especiais.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {coupons.map((c) => {
            const st = stateStyle[c.state];
            return (
              <li key={c.id} className="flex flex-col rounded-3xl bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-bold tracking-wide">{c.code}</p>
                    <p className="font-semibold">{describe(c)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${st.className}`}>{st.label}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-marinho-soft">
                  {c.min_order_value > 0 && <li>Pedido mínimo de {formatPrice(c.min_order_value)}</li>}
                  <li>
                    {c.used_count} {c.used_count === 1 ? "uso confirmado" : "usos confirmados"}
                    {c.max_uses ? ` de ${c.max_uses}` : ""}
                    {c.pending_orders > 0 && ` · ${c.pending_orders} em pedidos aguardando`}
                  </li>
                  {c.discount_total > 0 && <li>{formatPrice(c.discount_total)} concedidos em descontos</li>}
                  {(c.starts_at || c.expires_at) && (
                    <li>
                      {c.starts_at && `De ${fmtDay(c.starts_at)} `}
                      {c.expires_at && `até ${fmtDay(c.expires_at)}`}
                    </li>
                  )}
                </ul>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t-2 border-marinho/5 pt-4">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(async () => {
                      const r = await setCouponActive(c.id, !c.active);
                      if (!r.ok) setError(r.error);
                    })}
                    className="rounded-full bg-creme-dark px-4 py-2 text-sm font-bold hover:bg-sol"
                  >
                    {c.active ? "Pausar" : "Reativar"}
                  </button>
                  <button type="button" onClick={() => edit(c)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold hover:bg-creme-dark">
                    <Pencil className="size-4" aria-hidden="true" />
                    Editar
                  </button>
                  {confirmDelete === c.id ? (
                    <span className="ml-auto flex items-center gap-2 text-sm">
                      Excluir?
                      <button
                        type="button"
                        onClick={() => startTransition(async () => {
                          const r = await deleteCoupon(c.id);
                          if (!r.ok) setError(r.error);
                          setConfirmDelete(null);
                        })}
                        className="rounded-full bg-coral px-3 py-1.5 font-bold text-white"
                      >
                        Sim
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="font-bold underline">Não</button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(c.id)}
                      aria-label={`Excluir cupom ${c.code}`}
                      className="ml-auto rounded-full p-2 text-marinho-soft hover:bg-coral/10 hover:text-marinho"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
