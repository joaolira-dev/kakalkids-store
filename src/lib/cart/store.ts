"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  variantId: string;
  productSlug: string;
  name: string;
  color: string | null;
  size: string;
  price: number;
  image: string | null;
  quantity: number;
  /** Estoque visto no momento em que o item entrou na sacola (limite da quantidade). */
  maxQuantity: number;
};

const STORAGE_KEY = "kakalkids:sacola:v1";
const MAX_PER_ITEM = 20;

let items: CartItem[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const EMPTY: CartItem[] = [];

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    items = Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    items = [];
  }
  // Sincroniza entre abas
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    hydrated = false;
    load();
    emit();
  });
}

function emit() {
  listeners.forEach((l) => l());
}

function save(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Armazenamento indisponível (ex.: navegação privada): a sacola vive só na memória
  }
  emit();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return items;
    },
    () => EMPTY,
  );
}

export function useCartCount() {
  const cart = useCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function clamp(quantity: number, max: number) {
  return Math.max(1, Math.min(quantity, max, MAX_PER_ITEM));
}

export const cart = {
  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    load();
    const existing = items.find((i) => i.variantId === item.variantId);
    if (existing) {
      save(
        items.map((i) =>
          i.variantId === item.variantId
            ? { ...i, ...item, quantity: clamp(i.quantity + quantity, item.maxQuantity) }
            : i,
        ),
      );
    } else {
      save([...items, { ...item, quantity: clamp(quantity, item.maxQuantity) }]);
    }
  },
  setQuantity(variantId: string, quantity: number) {
    save(items.map((i) => (i.variantId === variantId ? { ...i, quantity: clamp(quantity, i.maxQuantity) } : i)));
  },
  remove(variantId: string) {
    save(items.filter((i) => i.variantId !== variantId));
  },
  clear() {
    save([]);
  },
};
