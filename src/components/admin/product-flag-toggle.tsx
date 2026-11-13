"use client";

import { useOptimistic, useTransition } from "react";
import { setProductFlag } from "@/lib/admin/product-actions";

type Props = { productId: string; flag: "active" | "featured"; value: boolean; label: string };

/** Interruptor que salva na hora (ativo / destaque). */
export function ProductFlagToggle({ productId, flag, value, label }: Props) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await setProductFlag(productId, flag, !optimistic);
        })
      }
      className={`relative z-10 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-70 ${
        optimistic ? (flag === "featured" ? "bg-sol" : "bg-turquesa") : "bg-marinho/15"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
          optimistic ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
