import { createFileRoute } from "@tanstack/react-router";

import { AnalysisDetailsPage } from "@/features/billing-analysis";

export const Route = createFileRoute("/analise-faturamento_/$analysisId")({
  head: () => ({
    meta: [
      { title: "Detalhes da análise | HaisFaturamento" },
      {
        name: "description",
        content: "Resultado item a item de uma análise de faturamento XML TISS.",
      },
      { property: "og:title", content: "Detalhes da análise | HaisFaturamento" },
      {
        property: "og:description",
        content: "Valores faturados, esperados e memória de cálculo de cada item analisado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalysisDetailsRoute,
});

function AnalysisDetailsRoute() {
  const { analysisId } = Route.useParams();
  return <AnalysisDetailsPage analysisId={analysisId} />;
}
