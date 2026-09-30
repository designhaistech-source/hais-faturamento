import { createFileRoute } from "@tanstack/react-router";

import { ImportDetailsPage } from "@/features/pricing-base";

export const Route = createFileRoute("/base-precificacao_/$versionId")({
  head: () => ({
    meta: [
      { title: "Detalhes da importação | HaisFaturamento" },
      {
        name: "description",
        content:
          "Arquivos, códigos vigentes e erros de uma importação da base de precificação no HaisFaturamento.",
      },
      { property: "og:title", content: "Detalhes da importação | HaisFaturamento" },
      {
        property: "og:description",
        content: "Detalhamento completo e de auditoria de uma importação da base de precificação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportDetailsRoute,
});

function ImportDetailsRoute() {
  const { versionId } = Route.useParams();
  return <ImportDetailsPage versionId={versionId} />;
}
