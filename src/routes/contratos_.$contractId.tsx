import { createFileRoute } from "@tanstack/react-router";

import { ContractDetailsPage } from "@/features/contracts";

export const Route = createFileRoute("/contratos_/$contractId")({
  head: () => ({
    meta: [
      { title: "Detalhes do contrato | HaisFaturamento" },
      {
        name: "description",
        content: "Dados do contrato e aditivos contratuais vinculados no HaisFaturamento.",
      },
      { property: "og:title", content: "Detalhes do contrato | HaisFaturamento" },
      {
        property: "og:description",
        content: "Consulte o contrato e gerencie seus aditivos contratuais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContractDetailsRoute,
});

function ContractDetailsRoute() {
  const { contractId } = Route.useParams();
  return <ContractDetailsPage contractId={contractId} />;
}
