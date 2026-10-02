import { createFileRoute } from "@tanstack/react-router";

import { RecoverPasswordPage } from "@/features/auth";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha | HaisFaturamento" },
      { name: "description", content: "Receba por e-mail as instruções para recuperar sua senha do HaisFaturamento." },
      { property: "og:title", content: "Recuperar senha | HaisFaturamento" },
      { property: "og:description", content: "Recuperação de senha do HaisFaturamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecoverPasswordPage,
});
