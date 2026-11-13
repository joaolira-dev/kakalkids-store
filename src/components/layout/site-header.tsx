"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { mainNav, siteConfig } from "@/config/site";
import { useCartCount } from "@/lib/cart/store";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const count = useCartCount();

  // Trava o scroll da página com o menu mobile aberto e fecha com Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-creme/95 backdrop-blur supports-[backdrop-filter]:bg-creme/80">
      <p className="bg-marinho px-4 py-2 text-center text-sm font-semibold text-creme">
        Escolha pelo site e finalize seu pedido no WhatsApp
      </p>

      <div className="mx-auto flex h-18 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          className="-ml-2 rounded-full p-2 lg:hidden"
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-6" />
        </button>

        <Link href="/" className="flex items-center gap-2.5" aria-label={`${siteConfig.name}, página inicial`}>
          <Image
            src="/brand/logo-icone.png"
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-full"
            priority
          />
          <span className="font-display leading-none">
            <span className="block text-2xl font-bold text-marinho">KAKAL</span>
            <span className="block text-[0.7rem] font-semibold tracking-[0.12em] text-rosa">KIDS STORE</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-3.5 py-2 font-display text-[1.05rem] font-medium transition-colors hover:bg-sol"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link href="/busca" className="rounded-full p-2.5 transition-colors hover:bg-turquesa" aria-label="Buscar produtos">
            <Search className="size-5.5" />
          </Link>
          <Link
            href="/sacola"
            className="flex items-center gap-2 rounded-full bg-marinho py-2.5 pr-4 pl-3.5 font-display font-medium text-creme transition-colors hover:bg-cobalto"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">Sacola</span>
            <span className="sr-only sm:hidden">Sacola</span>
            {count > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-sol px-1.5 text-sm font-bold text-marinho">
                {count}
                <span className="sr-only"> {count === 1 ? "item" : "itens"}</span>
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        id="menu-mobile"
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-marinho/40 transition-opacity motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <nav
          aria-label="Menu"
          className={`absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-creme p-6 shadow-xl transition-transform motion-reduce:transition-none ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="font-display text-xl font-semibold">Menu</span>
            <button
              type="button"
              className="-mr-2 rounded-full p-2"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
            >
              <X className="size-6" />
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  tabIndex={open ? 0 : -1}
                  className="block rounded-2xl px-4 py-3 font-display text-xl font-medium hover:bg-sol"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
