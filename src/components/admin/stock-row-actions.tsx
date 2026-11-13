"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { changeStock } from "@/lib/admin/stock-actions";

export function StockRowActions({ variantId, stock, label }: { variantId: string; stock: number; label: string }) {
  const [mode, setMode] = useState<"entrada" | "definir">("entrada");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value === "") return;
    startTransition(async () => {
      const r = await changeStock(variantId, mode, Number(value));
      if (r.ok) {
        setStatus({ ok: true, text: `Agora: ${r.stock}` });
        setValue("");
      } else {
        setStatus({ ok: false, text: r.error });
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <select
        aria-label={`Tipo de alteração para ${label}`}
        value={mode}
        onChange={(e) => setMode(e.target.value as "entrada" | "definir")}
        className="h-10 min-w-34 rounded-xl border-2 border-marinho/15 bg-white px-2 text-sm font-semibold"
      >
        <option value="entrada">Chegaram +</option>
        <option value="definir">Contei =</option>
      </select>
      <input
        aria-label={mode === "entrada" ? `Peças que chegaram de ${label}` : `Quantidade contada de ${label}`}
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder={mode === "entrada" ? "Qtd." : String(stock)}
        className="h-10 w-20 rounded-xl border-2 border-marinho/15 bg-white px-3"
      />
      <button
        type="submit"
        disabled={pending || value === ""}
        className="flex h-10 items-center gap-1.5 rounded-xl bg-marinho px-3.5 text-sm font-bold text-creme disabled:opacity-40"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-label="Salvando" /> : "Salvar"}
      </button>
      {status && (
        <span role="status" className={`flex items-center gap-1 text-sm font-semibold ${status.ok ? "text-cobalto" : "text-coral"}`}>
          {status.ok && <Check className="size-4" aria-hidden="true" />}
          {status.text}
        </span>
      )}
    </form>
  );
}
