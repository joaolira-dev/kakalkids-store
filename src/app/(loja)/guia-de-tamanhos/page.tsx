import type { Metadata } from "next";
import { ContentPage, Section } from "@/components/layout/content-page";
import { SizeChartTable } from "@/components/product/size-chart";
import { whatsappLink } from "@/config/site";
import { getSizeCharts } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "Guia de tamanhos",
  description: "Tabelas de medidas da KakalKids para bebê, infantil e teen.",
};

export default async function SizeGuidePage() {
  const charts = await getSizeCharts();
  return (
    <ContentPage title="Guia de tamanhos" intro="Meça a criança com uma fita métrica, sem apertar, e compare com as tabelas.">
      <Section title="Como medir">
        <p><strong>Altura:</strong> descalça, encostada na parede, do chão ao topo da cabeça.</p>
        <p><strong>Busto:</strong> na parte mais larga do peito, por baixo dos braços.</p>
        <p><strong>Cintura:</strong> na altura do umbigo.</p>
        <p>Na dúvida entre dois tamanhos, escolha o maior.</p>
      </Section>
      {charts.map((chart) => (
        <div key={chart.name} className="rounded-[2rem] bg-white p-6 sm:p-8 [&_h2]:text-2xl [&_section]:scroll-mt-0">
          <SizeChartTable chart={{ ...chart, name: chart.name }} titleOverride={chart.name} />
        </div>
      ))}
      <p className="text-center">
        Ficou em dúvida?{" "}
        <a href={whatsappLink("Oi! Preciso de ajuda para escolher o tamanho.")} className="font-bold underline underline-offset-4">
          A gente ajuda pelo WhatsApp
        </a>
      </p>
    </ContentPage>
  );
}
