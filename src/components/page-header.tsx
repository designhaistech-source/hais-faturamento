import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho padrão das páginas do sistema.
 * Título (font-display, semibold, tracking-tight) + descrição (muted) + ações à direita.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={["flex flex-wrap items-start justify-between gap-4", className ?? ""].join(" ")}
    >
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-4xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">{actions}</div>
      )}
    </header>
  );
}
