import { createFileRoute } from "@tanstack/react-router";

import { ContractsPage } from "@/features/contracts";

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos | HaisFaturamento" },
      {
        name: "description",
        content:
          "Cadastre e consulte os contratos das clínicas e hospitais atendidos no HaisFaturamento, com prestador, CNPJ, validade e arquivo original.",
      },
      { property: "og:title", content: "Contratos | HaisFaturamento" },
      {
        property: "og:description",
        content: "Listagem e cadastro de contratos de clínicas e hospitais no HaisFaturamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContractsPage,
});
