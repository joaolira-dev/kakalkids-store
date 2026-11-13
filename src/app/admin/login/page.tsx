import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Entrar no painel",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/brand/logo-icone.png" alt="" width={72} height={72} className="size-18 rounded-full" priority />
          <h1 className="mt-4 text-3xl">Painel KakalKids</h1>
          <p className="mt-1 text-marinho-soft">Entre para gerenciar pedidos, produtos e estoque.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
