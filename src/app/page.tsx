import Image from "next/image";
import Link from "next/link";
import { Brackets } from "@/components/brand/brackets";
import { InstagramIcon } from "@/components/brand/social-icons";
import { WaveBands } from "@/components/brand/wave-bands";
import { siteConfig } from "@/config/site";

const ageGroups = [
  { label: "Bebê", sizes: "Do RN ao GG", href: "/catalogo?idade=bebe", className: "bg-sol" },
  { label: "Infantil", sizes: "Tamanhos 1 ao 10", href: "/catalogo?idade=infantil", className: "bg-turquesa" },
  { label: "Teen", sizes: "Tamanhos 12 ao 18", href: "/catalogo?idade=teen", className: "bg-rosa" },
];

const steps = [
  {
    title: "Escolha as peças",
    text: "Navegue pelo catálogo, veja as medidas e escolha cor e tamanho.",
  },
  {
    title: "Revise a sacola",
    text: "Confira os itens, aplique seu cupom e informe seus dados de entrega.",
  },
  {
    title: "Finalize no WhatsApp",
    text: "Seu pedido chega pronto para a nossa equipe confirmar estoque, entrega e pagamento.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-10 pb-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <div className="hero-copy">
            <h1 className="text-[clamp(2.75rem,7vw,5rem)] leading-[0.98] font-bold">
              Vestindo criança como criança.
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg text-marinho-soft sm:text-xl">
              Roupas confortáveis e cheias de cor para meninas e meninos, do RN aos 18 anos.
              Escolha aqui e finalize seu pedido pelo WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalogo?genero=menina"
                className="rounded-full bg-rosa px-7 py-3.5 font-display text-lg font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Ver meninas
              </Link>
              <Link
                href="/catalogo?genero=menino"
                className="rounded-full bg-cobalto px-7 py-3.5 font-display text-lg font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Ver meninos
              </Link>
            </div>
          </div>

          <div className="hero-mascots relative mx-auto w-full max-w-lg">
            <Image
              src="/brand/mascotes.webp"
              alt="Mascotes da KakalKids: uma menina de vestido vermelho e um menino de macacão azul pulando de alegria"
              width={1007}
              height={619}
              priority
              sizes="(min-width: 1024px) 32rem, 90vw"
              className="h-auto w-full"
            />
          </div>
        </div>
        <WaveBands className="h-20 sm:h-32" />
      </section>

      {/* Compre por idade */}
      <section aria-labelledby="por-idade" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id="por-idade" className="text-3xl sm:text-4xl">
          Compre por idade
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-3">
          {ageGroups.map((group) => (
            <li key={group.label}>
              <Brackets className="p-3">
                <Link
                  href={group.href}
                  className={`group flex min-h-44 flex-col justify-end rounded-[1.75rem] p-6 transition-transform hover:-translate-y-1 ${group.className}`}
                >
                  <span className="font-display text-4xl font-bold">{group.label}</span>
                  <span className="mt-1 font-display text-xl font-medium">{group.sizes}</span>
                </Link>
              </Brackets>
            </li>
          ))}
        </ul>
      </section>

      {/* Meninas e meninos */}
      <section aria-label="Comprar por gênero" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/catalogo?genero=menina"
            className="group relative flex min-h-64 items-end overflow-hidden rounded-[2.5rem] bg-coral p-8 text-white"
          >
            <span className="font-display text-[clamp(3.5rem,9vw,6.5rem)] leading-none font-bold transition-transform group-hover:-translate-y-1">
              Meninas
            </span>
            <span aria-hidden="true" className="absolute top-8 right-8 size-20 rounded-full border-[10px] border-sol" />
          </Link>
          <Link
            href="/catalogo?genero=menino"
            className="group relative flex min-h-64 items-end overflow-hidden rounded-[2.5rem] bg-cobalto p-8 text-white"
          >
            <span className="font-display text-[clamp(3.5rem,9vw,6.5rem)] leading-none font-bold transition-transform group-hover:-translate-y-1">
              Meninos
            </span>
            <span aria-hidden="true" className="absolute top-8 right-8 h-20 w-32 rounded-t-full border-[10px] border-b-0 border-turquesa" />
          </Link>
        </div>
      </section>

      {/* Como comprar */}
      <section aria-labelledby="como-comprar" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <h2 id="como-comprar" className="text-3xl sm:text-4xl">
          Como comprar
        </h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sol font-display text-2xl font-bold"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-xl">{step.title}</h3>
                <p className="mt-1.5 text-marinho-soft">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Instagram */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-marinho">
          <Image
            src="/images/banners/noite-kakal-promocional.webp"
            alt=""
            fill
            sizes="(min-width: 1152px) 72rem, 100vw"
            className="object-cover object-right-bottom"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-marinho via-marinho/85 to-transparent sm:via-marinho/70" />
          <div className="relative max-w-xl px-8 py-14 text-creme sm:px-12 sm:py-20">
            <h2 className="text-3xl sm:text-4xl">Novidades toda semana no Instagram</h2>
            <p className="mt-3 text-lg text-creme/85">
              Looks novos, bastidores e promoções que aparecem primeiro por lá.
            </p>
            <a
              href={siteConfig.instagram.url}
              className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-sol px-6 py-3.5 font-display text-lg font-semibold text-marinho transition-transform hover:-translate-y-0.5"
            >
              <InstagramIcon />
              Seguir {siteConfig.instagram.handle}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
