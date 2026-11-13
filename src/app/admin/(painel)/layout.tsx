import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { AdminNav, AdminNavView } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel KakalKids" },
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="bg-marinho px-4 py-4 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:px-5 lg:py-7">
        <div className="mb-4 flex items-center gap-3 px-1 lg:mb-8">
          <Image src="/brand/logo-icone.png" alt="" width={40} height={40} className="size-10 rounded-full" />
          <div className="leading-tight text-creme">
            <p className="font-display text-lg font-semibold">KakalKids</p>
            <p className="text-sm text-creme/70">Painel da loja</p>
          </div>
        </div>
        <Suspense fallback={<AdminNavView pathname="" />}>
          <AdminNav />
        </Suspense>
      </aside>
      <div className="flex-1 px-4 py-6 sm:px-8 lg:py-10">
        <Suspense fallback={<AdminLoading />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </div>
    </div>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

function AdminLoading() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-4 motion-reduce:animate-none">
      <div className="h-10 w-48 rounded-full bg-creme-dark" />
      <div className="h-72 rounded-3xl bg-creme-dark" />
    </div>
  );
}
