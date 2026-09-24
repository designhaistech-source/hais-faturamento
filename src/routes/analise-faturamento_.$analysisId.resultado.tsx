import { createFileRoute } from "@tanstack/react-router";

import { AnalysisResultPage } from "@/features/billing-analysis";

export const Route = createFileRoute("/analise-faturamento_/$analysisId/resultado")({
  head: () => ({
    meta: [
      { title: "Resultado da análise | HaisFaturamento" },
      {
        name: "description",
        content: "Resumo, conformidades, divergências e itens não analisados de uma análise XML TISS.",
      },
      { property: "og:title", content: "Resultado da análise | HaisFaturamento" },
      {
        property: "og:description",
        content: "Resultado de uma análise de faturamento XML TISS com memória de cálculo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalysisResultRoute,
});

function AnalysisResultRoute() {
  const { analysisId } = Route.useParams();
  return <AnalysisResultPage analysisId={analysisId} />;
}
