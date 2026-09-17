import { createFileRoute } from "@tanstack/react-router";
import { IconAlignmentMatrix } from "@/features/design-system";

export const Route = createFileRoute("/design-system-icones")({
  head: () => ({
    meta: [
      { title: "Alinhamento de ícones | HaisFaturamento" },
      {
        name: "description",
        content:
          "Matriz de referência do HaisFaturamento com Button, Badge e Chip em todos os tamanhos para validar a centralização de ícones com o texto.",
      },
      { property: "og:title", content: "Alinhamento de ícones | HaisFaturamento" },
      {
        property: "og:description",
        content:
          "Fixture de regressão visual dos componentes com ícone do design system HaisFaturamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IconAlignmentMatrix,
});
