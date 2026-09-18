import { createFileRoute } from "@tanstack/react-router";

import { PricingBasePage } from "@/features/pricing-base";

export const Route = createFileRoute("/base-precificacao")({
  head: () => ({
    meta: [
      { title: "Base de precificação | HaisFaturamento" },
      {
        name: "description",
        content:
          "Gerencie as versões da base de valores utilizada na análise do faturamento no HaisFaturamento, com histórico completo e download do CSV original.",
      },
      { property: "og:title", content: "Base de precificação | HaisFaturamento" },
      {
        property: "og:description",
        content:
          "Histórico de versões da base de precificação utilizada nas análises de faturamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PricingBasePage,
});
