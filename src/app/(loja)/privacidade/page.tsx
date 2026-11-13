import type { Metadata } from "next";
import { ContentPage, Section } from "@/components/layout/content-page";
import { siteConfig, whatsappLink } from "@/config/site";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como a KakalKids trata os seus dados.",
};

// TODO(cliente): revisar com quem cuida da parte jurídica da loja.
export default function PrivacyPage() {
  return (
    <ContentPage title="Política de privacidade" intro="Usamos o mínimo de dados necessário para atender o seu pedido, conforme a LGPD.">
      <Section title="Quais dados coletamos">
        <p>Ao finalizar um pedido: <strong>nome</strong>, <strong>WhatsApp</strong>, a forma de entrega escolhida, as observações e os itens do pedido.</p>
        <p>Não pedimos dados de cartão no site. O pagamento é combinado diretamente pelo WhatsApp.</p>
      </Section>
      <Section title="Para que usamos">
        <p>Somente para confirmar, separar e entregar o seu pedido e falar com você sobre ele.</p>
      </Section>
      <Section title="Sacola e armazenamento no navegador">
        <p>Os itens da sacola ficam salvos no seu próprio navegador, para você não perder a seleção ao fechar a página. Não usamos cookies de rastreamento ou publicidade.</p>
      </Section>
      <Section title="Seus direitos">
        <p>Você pode pedir a qualquer momento para ver, corrigir ou apagar os seus dados.</p>
        <p>
          <a href={whatsappLink("Oi! Quero falar sobre os meus dados (LGPD).")} className="font-bold text-marinho underline underline-offset-4">
            Fale com a {siteConfig.name} pelo WhatsApp
          </a>
        </p>
      </Section>
    </ContentPage>
  );
}
