import { createFileRoute } from "@tanstack/react-router";

import { BillingAnalysisPage } from "@/features/billing-analysis";

export const Route = createFileRoute("/analise-faturamento")({
  head: () => ({
    meta: [
      { title: "Análise de faturamento | HaisFaturamento" },
      {
        name: "description",
        content:
          "Analise arquivos XML TISS no HaisFaturamento e identifique divergências nos valores faturados.",
      },
      { property: "og:title", content: "Análise de faturamento | HaisFaturamento" },
      {
        property: "og:description",
        content: "Análise de arquivos XML TISS e identificação de divergências no faturamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BillingAnalysisPage,
});
