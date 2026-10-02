import { createFileRoute } from "@tanstack/react-router";

import { OperatorsPage } from "@/features/operators";

export const Route = createFileRoute("/contratos-teste")({
  head: () => ({
    meta: [
      { title: "Contratos com operadoras teste | HaisFaturamento" },
      {
        name: "description",
        content: "Versão de teste da página de contratos com operadoras do HaisFaturamento.",
      },
      { property: "og:title", content: "Contratos com operadoras teste | HaisFaturamento" },
      {
        property: "og:description",
        content: "Versão de teste dos contratos do hospital com cada operadora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestOperatorsRoute,
});

function TestOperatorsRoute() {
  return <OperatorsPage variant="test" />;
}
