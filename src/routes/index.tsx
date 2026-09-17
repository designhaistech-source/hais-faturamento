import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HaisFaturamento — faturamento sem inconsistências" },
      {
        name: "description",
        content:
          "Antecipe inconsistências no faturamento antes do envio à operadora e acesse os contratos de clínicas e hospitais.",
      },
      { property: "og:title", content: "HaisFaturamento — faturamento sem inconsistências" },
      {
        property: "og:description",
        content:
          "Antecipe inconsistências no faturamento antes do envio à operadora e acesse os contratos utilizados no faturamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

/** Funcionalidades disponíveis no produto; novas entradas apenas somam a esta lista. */
const FEATURES = [
  {
    icon: FileText,
    title: "Contratos",
    description:
      "Cadastre e consulte os contratos de clínicas e hospitais utilizados no faturamento.",
    to: "/contratos",
    action: "Acessar contratos",
  },
] as const;

function HomePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="inicio" />
      <div className="flex min-h-screen flex-1 flex-col pt-14 md:pt-0">
        <main className="flex-1 space-y-6 p-6 pb-16">
          <PageHeader
            title="HaisFaturamento"
            description="Antecipe inconsistências no faturamento antes do envio à operadora."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((item) => (
              <FeatureCard key={item.to} {...item} />
            ))}
          </div>

        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
