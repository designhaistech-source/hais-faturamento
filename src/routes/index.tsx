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
    action: "Acessar",
  },
  {
    icon: CircleDollarSign,
    title: "Base de precificação",
    description:
      "Cadastre e consulte as versões da base de valores utilizada na análise do faturamento.",
    to: "/base-precificacao",
    action: "Acessar",
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

          <div className="grid gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-3">
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

/** Card de acesso a uma funcionalidade; reutilizado por cada item de FEATURES. */
function FeatureCard({ icon: Icon, title, description, to, action }: (typeof FEATURES)[number]) {
  return (
    <SurfaceCard
      padding="sm"
      className="flex flex-col items-start gap-0 transition-colors hover:border-primary/40 hover:shadow-sm"
    >
      <span className="inline-flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <Link to={to}>{action}</Link>
      </Button>
    </SurfaceCard>
  );
}
