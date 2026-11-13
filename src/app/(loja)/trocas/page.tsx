import type { Metadata } from "next";
import { ContentPage, Section } from "@/components/layout/content-page";
import { whatsappLink } from "@/config/site";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description: "Como trocar tamanho ou devolver uma peça comprada na KakalKids.",
};

// TODO(cliente): validar prazos e regras de troca antes do lançamento.
export default function ExchangesPage() {
  return (
    <ContentPage title="Trocas e devoluções" intro="Criança cresce rápido e às vezes o tamanho não serve. A gente resolve.">
      <Section title="Troca de tamanho ou cor">
        <p>Você pode trocar a peça em até <strong>30 dias</strong> após o recebimento, por outro tamanho ou cor, conforme disponibilidade.</p>
        <p>A peça precisa estar sem uso, sem lavagem e com a etiqueta.</p>
      </Section>
      <Section title="Arrependimento (7 dias)">
        <p>
          Pelo Código de Defesa do Consumidor, compras feitas fora da loja física podem ser devolvidas em até <strong>7 dias</strong> após o
          recebimento, com reembolso do valor pago.
        </p>
      </Section>
      <Section title="Como solicitar">
        <p>Chame a gente no WhatsApp com o número do pedido. A gente combina a forma de devolução e a troca.</p>
        <p>
          <a href={whatsappLink("Oi! Quero solicitar uma troca. Meu pedido é o #")} className="font-bold text-marinho underline underline-offset-4">
            Solicitar troca pelo WhatsApp
          </a>
        </p>
      </Section>
    </ContentPage>
  );
}
