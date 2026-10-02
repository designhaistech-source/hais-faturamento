import { createFileRoute, redirect } from "@tanstack/react-router";

import { FirstAccessPage, hasPendingFirstAccess } from "@/features/auth";

export const Route = createFileRoute("/primeiro-acesso")({
  // O fluxo pendente vive no navegador; decidir no cliente, antes de renderizar,
  // evita mostrar um formulário que depois seria trocado pelo login.
  ssr: false,
  beforeLoad: () => {
    if (!hasPendingFirstAccess()) throw redirect({ to: "/login", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Primeiro acesso | HaisFaturamento" },
      { name: "description", content: "Defina sua senha para começar a usar o HaisFaturamento." },
      { property: "og:title", content: "Primeiro acesso | HaisFaturamento" },
      { property: "og:description", content: "Definição de senha no primeiro acesso ao HaisFaturamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FirstAccessPage,
});
