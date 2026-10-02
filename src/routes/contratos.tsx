import { createFileRoute } from "@tanstack/react-router";

import { OperatorsPage } from "@/features/operators";

function OperatorsRoute() {
  return <OperatorsPage variant="test" />;
}

interface ContractsSearch {
  dadosExtraidos?: string;
}

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Operadoras e seus contratos | HaisFaturamento" },
      {
        name: "description",
        content:
          "Consulte as operadoras de saúde e a situação dos contratos do hospital com cada uma no HaisFaturamento.",
      },
      { property: "og:title", content: "Operadoras e seus contratos | HaisFaturamento" },
      {
        property: "og:description",
        content: "Operadoras de saúde e contratos do hospital no HaisFaturamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): ContractsSearch =>
    typeof search.dadosExtraidos === "string" ? { dadosExtraidos: search.dadosExtraidos } : {},
  component: OperatorsRoute,
});
