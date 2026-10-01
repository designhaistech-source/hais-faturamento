import { createFileRoute } from "@tanstack/react-router";

import { OperatorFileDataPage } from "@/features/operators";

export const Route = createFileRoute("/contratos_/$contractId_/arquivos/$fileId")({
  head: () => ({
    meta: [
      { title: "Dados extraídos | HaisFaturamento" },
      {
        name: "description",
        content: "Regras identificadas em um arquivo do contrato com a operadora.",
      },
      { property: "og:title", content: "Dados extraídos | HaisFaturamento" },
      {
        property: "og:description",
        content: "Consulte as regras extraídas de cada arquivo contratual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FileDataRoute,
});

function FileDataRoute() {
  const { contractId, fileId } = Route.useParams();
  return <OperatorFileDataPage operatorId={contractId} fileId={fileId} />;
}
