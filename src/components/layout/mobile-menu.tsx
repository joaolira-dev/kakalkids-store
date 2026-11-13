"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import { InstagramIcon } from "@/components/brand/social-icons";
import { helpNav, mainNav, siteConfig, whatsappLink } from "@/config/site";

const noopSubscribe = () => () => {};

type Props = { open: boolean; onClose: () => void };

/**
 * Gaveta do menu no celular. Renderizada num portal direto no <body>:
 * dentro do header (que tem backdrop-filter) o `position: fixed` ficaria
 * preso à altura do header.
 */
export function MobileMenu({ open, onClose }: Props) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbar}px`;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Mantém o foco dentro da gaveta
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!isClient) return null;

  return createPortal(
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none invisible"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-marinho/50 transition-opacity duration-300 motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <nav
        ref={panelRef}
        id="menu-mobile"
        aria-label="Menu"
        role="dialog"
        aria-modal="true"
        className={`absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] flex-col overflow-y-auto bg-creme shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5" aria-label={`${siteConfig.name}, página inicial`}>
            <Image src="/brand/logo-icone.png" alt="" width={40} height={40} className="size-10 rounded-full" />
            <span className="font-display leading-none">
              <span className="block text-xl font-bold">KAKAL</span>
              <span className="block text-[0.65rem] font-semibold tracking-[0.12em] text-rosa">KIDS STORE</span>
            </span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            className="flex size-11 items-center justify-center rounded-full bg-white ring-2 ring-marinho/10"
            aria-label="Fechar menu"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <ul className="flex flex-col px-3 py-2">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className="block rounded-2xl px-4 py-3 font-display text-2xl font-semibold hover:bg-sol"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mx-5 my-2 border-t-2 border-marinho/10" />

        <ul className="flex flex-col px-3">
          {helpNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={onClose} className="block rounded-2xl px-4 py-2.5 font-semibold text-marinho-soft hover:bg-creme-dark hover:text-marinho">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-2 p-5">
          <a
            href={whatsappLink("Oi! Vim pelo site da KakalKids :)")}
            className="flex items-center justify-center gap-2 rounded-full bg-marinho py-3 font-display font-semibold text-creme"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            Falar no WhatsApp
          </a>
          <a
            href={siteConfig.instagram.url}
            className="flex items-center justify-center gap-2 rounded-full bg-white py-3 font-display font-semibold ring-2 ring-marinho/10"
          >
            <InstagramIcon />
            {siteConfig.instagram.handle}
          </a>
        </div>
      </nav>
    </div>,
    document.body,
  );
}
