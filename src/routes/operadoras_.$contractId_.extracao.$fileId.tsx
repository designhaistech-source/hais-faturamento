import { createFileRoute } from "@tanstack/react-router";

import { OperatorExtractionPage } from "@/features/operators";

export const Route = createFileRoute("/operadoras_/$contractId_/extracao/$fileId")({
  head: () => ({
    meta: [
      { title: "Detalhes da extração | HaisFaturamento" },
      {
        name: "description",
        content: "Regras identificadas na extração de um arquivo do contrato com a operadora.",
      },
      { property: "og:title", content: "Detalhes da extração | HaisFaturamento" },
      {
        property: "og:description",
        content: "Consulte as regras extraídas de um contrato ou aditivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExtractionRoute,
});

function ExtractionRoute() {
  const { contractId, fileId } = Route.useParams();
  return <OperatorExtractionPage operatorId={contractId} fileId={fileId} />;
}
