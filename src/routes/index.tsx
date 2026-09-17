import { createFileRoute, Link } from "@tanstack/react-router";
import { Palette, Shapes, LayoutGrid } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HaisFaturamento — base de interface HaisTech" },
      {
        name: "description",
        content:
          "Base do HaisFaturamento com a interface HaisTech já configurada: tokens, componentes, navegação e padrões de página prontos para as primeiras telas.",
      },
      { property: "og:title", content: "HaisFaturamento — base de interface HaisTech" },
      {
        property: "og:description",
        content:
          "Ponto de partida do HaisFaturamento com tokens, componentes e padrões de página da HaisTech.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

const STARTING_POINTS = [
  {
    icon: Palette,
    title: "Fundamentos",
    description:
      "Cores, tipografia, espaçamento, componentes e padrões de página disponíveis para reutilizar.",
    to: "/design-system",
    action: "Ver fundamentos",
  },
  {
    icon: Shapes,
    title: "Ícones",
    description:
      "Matriz de referência para conferir o alinhamento entre ícones e textos nos componentes.",
    to: "/design-system-icones",
    action: "Ver ícones",
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
            description="Base de interface pronta para começar. Nenhuma tela de negócio foi criada ainda: use os fundamentos abaixo como referência ao construir as primeiras telas."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {STARTING_POINTS.map((item) => (
              <SurfaceCard key={item.to} className="flex flex-col gap-3 p-5">
                <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <h2 className="font-display text-base font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Button variant="outline" className="mt-auto self-start" asChild>
                  <Link to={item.to}>{item.action}</Link>
                </Button>
              </SurfaceCard>
            ))}
          </div>

          <SurfaceCard className="flex flex-col gap-2 p-5">
            <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <LayoutGrid className="size-5" aria-hidden="true" />
            </span>
            <h2 className="font-display text-base font-semibold text-foreground">Próximo passo</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Descreva a primeira funcionalidade do faturamento e ela será construída sobre esta
              base, reutilizando os componentes já existentes.
            </p>
          </SurfaceCard>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
