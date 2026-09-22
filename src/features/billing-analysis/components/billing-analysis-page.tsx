import { FileSearch, Plus } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "@/components/empty-state-card";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Análise de faturamento: página inicial da funcionalidade.
 * O fluxo de envio do XML TISS será conectado aos botões "Nova análise"
 * em uma etapa posterior.
 */
export function BillingAnalysisPage() {
  /** Placeholder do fluxo de envio do XML TISS (implementação futura). */
  const handleNewAnalysis = () => {};

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="analise-faturamento" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb />
            <PageHeader
              title="Análise de faturamento"
              description="Analise arquivos XML TISS e identifique divergências nos valores faturados."
              actions={
                <Button type="button" className="w-full sm:w-auto" onClick={handleNewAnalysis}>
                  <Plus className="size-4" aria-hidden="true" />
                  Nova análise
                </Button>
              }
            />

            <section className="space-y-4">
              <EmptyStateCard
                icon={<FileSearch className="size-10" aria-hidden="true" />}
                title="Nenhuma análise realizada"
                description="Envie um arquivo XML TISS para realizar a primeira análise de faturamento."
                action={
                  <Button type="button" onClick={handleNewAnalysis}>
                    <Plus className="size-4" aria-hidden="true" />
                    Nova análise
                  </Button>
                }
              />
            </section>
          </main>

          <SiteFooter />
        </div>
      </div>
    </TooltipProvider>
  );
}
