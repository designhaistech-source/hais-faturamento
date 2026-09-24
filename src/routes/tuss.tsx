import { createFileRoute } from "@tanstack/react-router";

import { TussPage } from "@/features/tuss";

export const Route = createFileRoute("/tuss")({
  head: () => ({
    meta: [
      { title: "TUSS | HaisFaturamento" },
      {
        name: "description",
        content:
          "Gerencie as versões da Terminologia Unificada da Saúde Suplementar (TUSS) utilizadas na identificação e classificação dos itens do faturamento.",
      },
      { property: "og:title", content: "TUSS | HaisFaturamento" },
      {
        property: "og:description",
        content: "Histórico de versões da TUSS utilizadas pelo HaisFaturamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TussPage,
});
