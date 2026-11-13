import Image from "next/image";
import Link from "next/link";
import { WaveBands } from "@/components/brand/wave-bands";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <Image src="/brand/logo-icone.png" alt="" width={88} height={88} className="size-22 rounded-full" />
        <h1 className="mt-6 text-4xl sm:text-5xl">Ops, essa página não existe</h1>
        <p className="mt-3 text-lg text-marinho-soft">O link pode estar errado ou o produto saiu do catálogo.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/catalogo" className="rounded-full bg-rosa px-7 py-3.5 font-display text-lg font-semibold text-white">
            Ver o catálogo
          </Link>
          <Link href="/" className="rounded-full bg-white px-7 py-3.5 font-display text-lg font-semibold ring-2 ring-marinho/15">
            Página inicial
          </Link>
        </div>
      </div>
      <WaveBands className="h-16 sm:h-24" />
    </main>
  );
}
