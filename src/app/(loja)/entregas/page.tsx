import type { Metadata } from "next";
import { ContentPage, Section } from "@/components/layout/content-page";
import { siteConfig, whatsappLink } from "@/config/site";

export const metadata: Metadata = {
  title: "Entregas",
  description: "Retirada em João Pessoa, entrega local ou envio pelos Correios para todo o Brasil.",
};

// TODO(cliente): confirmar endereço/horário de retirada, bairros atendidos e prazos.
export default function DeliveryPage() {
  return (
    <ContentPage title="Entregas" intro={`Estamos em ${siteConfig.city} e enviamos para todo o Brasil.`}>
      <Section title="Retirar">
        <p>Você retira o pedido com a gente em João Pessoa, sem custo. O horário é combinado pelo WhatsApp quando o pedido for confirmado.</p>
      </Section>
      <Section title="Entrega local">
        <p>Entregamos em João Pessoa e região. A taxa e o prazo dependem do bairro e são informados no WhatsApp antes da confirmação.</p>
      </Section>
      <Section title="Envio pelos Correios">
        <p>Enviamos para todo o Brasil. O frete e o prazo são calculados pelo CEP e informados no WhatsApp antes do pagamento.</p>
        <p>Depois do envio, você recebe o código de rastreio pelo WhatsApp.</p>
      </Section>
      <p className="text-center">
        Dúvidas sobre a entrega?{" "}
        <a href={whatsappLink("Oi! Tenho uma dúvida sobre entrega.")} className="font-bold underline underline-offset-4">
          Fale com a gente no WhatsApp
        </a>
      </p>
    </ContentPage>
  );
}
