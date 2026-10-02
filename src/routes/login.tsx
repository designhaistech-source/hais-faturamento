import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/features/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar | HaisFaturamento" },
      { name: "description", content: "Acesse sua conta do HaisFaturamento com CPF e senha." },
      { property: "og:title", content: "Entrar | HaisFaturamento" },
      { property: "og:description", content: "Acesse sua conta do HaisFaturamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});
