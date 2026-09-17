import * as React from "react";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, { pad: string; icon: string; title: string; desc: string }> = {
  sm: { pad: "py-6 px-4", icon: "h-8 w-8", title: "text-sm", desc: "text-xs" },
  md: { pad: "py-10 px-6", icon: "h-10 w-10", title: "text-base", desc: "text-sm" },
  lg: { pad: "py-16 px-8", icon: "h-12 w-12", title: "text-lg", desc: "text-sm" },
};

interface BaseProps {
  size?: Size;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Estado vazio padronizado — use quando uma listagem/tabela/painel não tem dados.
 */
export function EmptyState({
  size = "md",
  className,
  title = "Nada por aqui ainda",
  description,
  icon,
  action,
}: BaseProps) {
  const s = sizeMap[size];
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center gap-2 text-muted-foreground",
        s.pad,
        className,
      )}
    >
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        {icon ?? <Inbox className={s.icon} />}
      </div>
      <p className={cn("font-medium text-foreground", s.title)}>{title}</p>
      {description && <p className={cn("max-w-md", s.desc)}>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * Estado de carregamento com spinner central. Use quando não faz sentido
 * mostrar skeleton (ex.: ações modais, dashboards leves).
 */
export function LoadingState({
  size = "md",
  className,
  title = "Carregando…",
  description,
}: Pick<BaseProps, "size" | "className" | "title" | "description">) {
  const s = sizeMap[size];
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center text-center gap-2 text-muted-foreground",
        s.pad,
        className,
      )}
    >
      <Loader2 className={cn("animate-spin text-primary", s.icon)} />
      <p className={cn("font-medium text-foreground", s.title)}>{title}</p>
      {description && <p className={cn("max-w-md", s.desc)}>{description}</p>}
    </div>
  );
}

interface ErrorStateProps extends BaseProps {
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Estado de erro padronizado — sempre inclui título, causa e (opcional) retry.
 */
export function ErrorState({
  size = "md",
  className,
  title = "Não foi possível carregar",
  description = "Tente novamente em alguns instantes.",
  icon,
  action,
  onRetry,
  retryLabel = "Tentar novamente",
}: ErrorStateProps) {
  const s = sizeMap[size];
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center gap-2",
        s.pad,
        className,
      )}
    >
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        {icon ?? <AlertCircle className={s.icon} />}
      </div>
      <p className={cn("font-medium text-foreground", s.title)}>{title}</p>
      {description && <p className={cn("max-w-md text-muted-foreground", s.desc)}>{description}</p>}
      {(action || onRetry) && (
        <div className="mt-2 flex items-center gap-2">
          {action}
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" /> {retryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Skeleton para listagens tabulares — mantém a mesma altura de linha
 * das tabelas reais para evitar CLS.
 */
export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("divide-y divide-border", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn(
                "h-4",
                c === 0 ? "w-[22%]" : c === columns - 1 ? "w-[12%] ml-auto" : "flex-1",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
