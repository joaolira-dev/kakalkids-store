"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, ExternalLink, LogOut, Package, Boxes, TicketPercent } from "lucide-react";
import { signOut } from "@/lib/admin/auth-actions";

const items = [
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, ready: true },
  { href: "/admin/produtos", label: "Produtos", icon: Package, ready: false },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes, ready: false },
  { href: "/admin/cupons", label: "Cupons", icon: TicketPercent, ready: false },
];

export function AdminNav() {
  return <AdminNavView pathname={usePathname()} />;
}

/** Versão sem hook, usada também como fallback estático (sem item ativo). */
export function AdminNavView({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Painel" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map(({ href, label, icon: Icon, ready }) => {
        const active = pathname !== "" && pathname.startsWith(href);
        if (!ready) {
          return (
            <span
              key={href}
              className="flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-creme/40"
              title="Em construção"
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
              <span className="ml-auto hidden rounded-full bg-creme/10 px-2 text-xs lg:inline">em breve</span>
            </span>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-colors ${active ? "bg-sol text-marinho" : "text-creme hover:bg-creme/10"}`}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
      <div className="hidden lg:mt-6 lg:block lg:border-t lg:border-creme/15 lg:pt-6" />
      <Link
        href="/"
        target="_blank"
        className="flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-creme/80 hover:bg-creme/10"
      >
        <ExternalLink className="size-5" aria-hidden="true" />
        Ver loja
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full shrink-0 items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-creme/80 hover:bg-creme/10"
        >
          <LogOut className="size-5" aria-hidden="true" />
          Sair
        </button>
      </form>
    </nav>
  );
}
