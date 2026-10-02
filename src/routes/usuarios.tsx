import { createFileRoute } from "@tanstack/react-router";

import { UsersPage } from "@/features/users";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários | HaisFaturamento" },
      { name: "description", content: "Gerencie os usuários do HaisFaturamento e seus respectivos hospitais." },
      { property: "og:title", content: "Usuários | HaisFaturamento" },
      { property: "og:description", content: "Cadastro e consulta de usuários vinculados a hospitais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsersPage,
});
