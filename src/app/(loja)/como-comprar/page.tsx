import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Section } from "@/components/layout/content-page";
import { whatsappLink } from "@/config/site";

export const metadata: Metadata = {
  title: "Como comprar",
  description: "Escolha as peças no site e finalize seu pedido pelo WhatsApp da KakalKids.",
};

const steps = [
  {
    title: "Escolha as peças",
    text: "Navegue pelo catálogo, use os filtros de idade, tamanho e cor e confira a tabela de medidas de cada peça.",
  },
  {
    title: "Monte sua sacola",
    text: "Escolha a cor e o tamanho e adicione à sacola. Se tiver um cupom, aplique na própria sacola.",
  },
  {
    title: "Escolha a entrega",
    text: "Retirar em João Pessoa, entrega local ou envio pelos Correios para todo o Brasil.",
  },
  {
    title: "Finalize no WhatsApp",
    text: "Seu pedido é registrado e o WhatsApp abre com a mensagem pronta. É só enviar: a gente confirma a disponibilidade, o frete e o pagamento por lá.",
  },
];

export default function HowToBuyPage() {
  return (
    <ContentPage title="Como comprar" intro="Comprar na KakalKids é simples: você escolhe pelo site e finaliza com a gente no WhatsApp.">
      <ol className="flex flex-col gap-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-[2rem] bg-white p-6">
            <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sol font-display text-2xl font-bold">
              {i + 1}
            </span>
            <div>
              <h2 className="text-xl">{s.title}</h2>
              <p className="mt-1 text-marinho-soft">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <Section title="Formas de pagamento">
        <p>Pix e cartão de crédito, combinados no WhatsApp na hora de confirmar o pedido.</p>
      </Section>
      <div className="flex flex-wrap gap-3">
        <Link href="/catalogo" className="rounded-full bg-rosa px-7 py-3.5 font-display text-lg font-semibold text-white">
          Ver o catálogo
        </Link>
        <a href={whatsappLink("Oi! Tenho uma dúvida sobre como comprar.")} className="rounded-full bg-white px-7 py-3.5 font-display text-lg font-semibold ring-2 ring-marinho/15">
          Tirar dúvidas no WhatsApp
        </a>
      </div>
    </ContentPage>
  );
}
