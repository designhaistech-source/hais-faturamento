import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

/** Card de acesso a uma funcionalidade; reutilizado por cada item de FEATURES. */
function FeatureCard({ icon: Icon, title, description, to, action }: (typeof FEATURES)[number]) {
  return (
    <Link
      to={to}
      aria-label={action}
      className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SurfaceCard
        padding="sm"
        className="flex h-full flex-col gap-3 transition-colors hover:border-primary/40 hover:shadow-sm"
        icon={<Icon className="size-4.5" aria-hidden="true" />}
        title={title}
        description={description}
        headerClassName="mb-0"
      >
        {/* Visual de botão: o card inteiro é o link de acesso. */}
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "self-start group-hover:bg-accent group-hover:text-accent-foreground",
          )}
        >
          Acessar
        </span>
      </SurfaceCard>
    </Link>
  );
}
