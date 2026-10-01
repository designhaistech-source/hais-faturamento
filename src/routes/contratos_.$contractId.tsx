import { createFileRoute } from "@tanstack/react-router";

import { OperatorDetailsPage } from "@/features/operators";

export const Route = createFileRoute("/contratos_/$contractId")({
  head: () => ({
    meta: [
      { title: "Operadora e contrato | HaisFaturamento" },
      {
        name: "description",
        content: "Dados do contrato e aditivos contratuais vinculados no HaisFaturamento.",
      },
      { property: "og:title", content: "Operadora e contrato | HaisFaturamento" },
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
  return <OperatorDetailsPage operatorId={contractId} />;
}
