import { createFileRoute } from "@tanstack/react-router";
import { DesignSystemPage } from "@/features/design-system";

export const Route = createFileRoute("/design-system")({
  head: () => ({
    meta: [
      { title: "Design System | HaisFaturamento" },
      {
        name: "description",
        content:
          "Guia visual do HaisFaturamento: tokens de cor, tipografia, componentes e padrões de interface usados em todo o sistema.",
      },
      { property: "og:title", content: "Design System | HaisFaturamento" },
      {
        property: "og:description",
        content:
          "Fundamentos visuais, componentes e padrões de interface do sistema HaisFaturamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DesignSystemPage,
});
