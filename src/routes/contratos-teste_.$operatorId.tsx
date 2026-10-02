import { createFileRoute } from "@tanstack/react-router";

import { OperatorDetailsPage } from "@/features/operators";

export const Route = createFileRoute("/contratos-teste_/$operatorId")({
  head: () => ({
    meta: [
      { title: "Contrato com a operadora (teste) | HaisFaturamento" },
      {
        name: "description",
        content: "Versão de teste do contrato com a operadora, com arquivos e regras identificadas.",
      },
      { property: "og:title", content: "Contrato com a operadora (teste) | HaisFaturamento" },
      {
        property: "og:description",
        content: "Arquivos do contrato e regras identificadas em cada um deles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestOperatorDetailsRoute,
});

function TestOperatorDetailsRoute() {
  const { operatorId } = Route.useParams();
  return <OperatorDetailsPage operatorId={operatorId} variant="test" />;
}
