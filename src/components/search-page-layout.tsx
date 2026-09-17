import type { FormEvent, ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar, type ItemKey } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchPageLayoutProps {
  /** Chave do item ativo no menu lateral. */
  activeKey: ItemKey;
  title: string;
  description: string;
  /** Campos do formulário de busca (input, filtros). */
  searchFields: ReactNode;
  onSubmit: (event: FormEvent) => void;
  /** Rótulo do botão de submit da busca. */
  submitLabel?: string;
  /** Busca em andamento — desabilita o submit e mostra o rótulo de espera. */
  submitting?: boolean;

  /** Conteúdo da seção de resultados. */
  children: ReactNode;
  /** Blocos adicionais abaixo dos resultados (ex.: favoritos e histórico). */
  extra?: ReactNode;
  className?: string;
}

/**
 * Layout compartilhado das páginas de busca (procedimento, CID-10).
 * Centraliza estrutura, espaçamentos e classes para manter o padrão visual.
 */
export function SearchPageLayout({
  activeKey,
  title,
  description,
  searchFields,
  onSubmit,
  submitLabel = "Buscar",
  submitting = false,
  children,
  extra,
  className,
}: SearchPageLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey={activeKey} />

      <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <div
          className={cn(
            "w-full flex-1 space-y-6 px-4 py-6 pb-16 sm:px-6 sm:py-8 lg:px-10",
            className,
          )}
        >
          <AppBreadcrumb />
          <PageHeader title={title} description={description} />

          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center"
          >
            {searchFields}
            <Button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="w-full justify-center lg:w-auto lg:px-8"
            >
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? "Buscando…" : submitLabel}
            </Button>
          </form>

          <section
            aria-label="Resultados da busca"
            className="rounded-xl border border-border bg-card"
          >
            {children}
          </section>

          {extra}
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
