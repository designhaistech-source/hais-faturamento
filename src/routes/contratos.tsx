import { createFileRoute } from "@tanstack/react-router";

import { OperatorsPage } from "@/features/operators";

interface ContractsSearch {
  dadosExtraidos?: string;
}

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Operadoras e contratos | HaisFaturamento" },
      {
        name: "description",
        content:
          "Cadastre e consulte os contratos das clínicas e hospitais atendidos no HaisFaturamento, com prestador, CNPJ, validade e arquivo original.",
      },
      { property: "og:title", content: "Operadoras e contratos | HaisFaturamento" },
      {
        property: "og:description",
        content: "Listagem e cadastro de contratos de clínicas e hospitais no HaisFaturamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): ContractsSearch =>
    typeof search.dadosExtraidos === "string" ? { dadosExtraidos: search.dadosExtraidos } : {},
  component: OperatorsPage,
});
