import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Sacola",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6">
      <h1 className="mb-8 text-4xl sm:text-5xl">Sua sacola</h1>
      <CartView />
    </div>
  );
}
