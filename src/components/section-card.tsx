import * as React from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SectionCardProps {
  /** Ancora para navegação interna da página. */
  id?: string;
  /** Número da etapa exibido antes do título (ex.: "1. Dados do paciente"). */
  number?: number;
  title: React.ReactNode;
  /** Texto auxiliar curto exibido abaixo do título. */
  description?: React.ReactNode;
  /** Ícone opcional exibido em um badge à esquerda do título. */
  icon?: React.ReactNode;
  /** Marca a etapa como preenchida/concluída. */
  done?: boolean;
  /** Ações alinhadas à direita do cabeçalho. */
  actions?: React.ReactNode;
  /** Permite recolher/expandir o conteúdo da seção. */
  collapsible?: boolean;
  /** Inicia a seção recolhida (apenas com `collapsible`). */
  defaultCollapsed?: boolean;
  /** Controla externamente o estado aberto/fechado (apenas com `collapsible`). */
  open?: boolean;
  /** Notifica mudanças de abertura quando controlado ou não. */
  onOpenChange?: (open: boolean) => void;

  className?: string;
  /** Classe extra para o texto auxiliar (permite reduzir o destaque). */
  descriptionClassName?: string;
  /** Ref para o container do card (usado em impressão/scroll). */
  innerRef?: React.Ref<HTMLDivElement>;
  bodyClassName?: string;
  children?: React.ReactNode;
}

/**
 * Card de etapa/seção padronizado para os formulários longos
 * (Emitir guia, Solicitar OPME, Emitir prescrição).
 *
 * Centraliza a escala tipográfica do título, o espaçamento interno e o
 * indicador de conclusão para que todas as páginas fiquem idênticas.
 */
export function SectionCard({
  id,
  number,
  title,
  description,
  icon,
  done,
  actions,
  collapsible,
  defaultCollapsed,
  open: openProp,
  onOpenChange,
  className,
  descriptionClassName,
  bodyClassName,
  innerRef,
  children,
}: SectionCardProps) {
  const [collapsed, setCollapsed] = React.useState(Boolean(collapsible && defaultCollapsed));
  const open = !collapsible || (openProp ?? !collapsed);
  const bodyId = React.useId();

  function toggle() {
    const next = !open;
    if (openProp === undefined) setCollapsed(!next);
    onOpenChange?.(next);
  }

  return (
    <section id={id} className={cn("scroll-mt-4", className)}>
      <div ref={innerRef} className="rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {icon && (
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="flex flex-wrap items-center gap-2 font-display text-base font-semibold tracking-tight text-foreground">
                <span className="min-w-0">{title}</span>
                {done && (
                  <CheckCircle2
                    aria-label="Seção preenchida"
                    className="h-4 w-4 shrink-0 text-success-strong"
                  />
                )}
              </h2>
              {description && (
                <p className={cn("mt-0.5 text-xs text-muted-foreground", descriptionClassName)}>
                  {description}
                </p>
              )}
            </div>
          </div>
          {(actions || collapsible) && (
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
              {actions}
              {collapsible && (
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={open}
                  aria-controls={bodyId}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
                  />
                  <span className="sr-only">{open ? "Recolher seção" : "Expandir seção"}</span>
                </button>
              )}
            </div>
          )}
        </div>
        {children && open && (
          <div id={bodyId} className={cn("space-y-4 px-5 pb-5", bodyClassName)}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
