import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Padding = "none" | "sm" | "md" | "lg";
type Tone = "default" | "muted" | "dashed";

interface SurfaceCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  padding?: Padding;
  tone?: Tone;
  headerClassName?: string;
  bodyClassName?: string;
  children?: ReactNode;
}

const paddingMap: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const toneMap: Record<Tone, string> = {
  default: "border-border bg-card",
  muted: "border-border bg-muted/30",
  dashed: "border-dashed border-border bg-card",
};

/**
 * Card padrão para blocos de conteúdo internos das páginas.
 * Bordas, raio e sombra alinhados ao PageHeader.
 */
export function SurfaceCard({
  title,
  description,
  icon,
  actions,
  padding = "lg",
  tone = "default",
  headerClassName,
  bodyClassName,
  className,
  children,
  ...rest
}: SurfaceCardProps) {
  const hasHeader = Boolean(title || description || actions || icon);
  return (
    <section
      className={cn(
        "rounded-2xl border shadow-xs transition-shadow",
        toneMap[tone],
        paddingMap[padding],
        className,
      )}
      {...rest}
    >
      {hasHeader && (
        <header
          className={cn(
            "flex flex-wrap items-start justify-between gap-3",
            children ? "mb-4" : "",
            headerClassName,
          )}
        >
          <div className="min-w-0 flex items-start gap-3">
            {icon && (
              <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
              )}
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      {children && <div className={cn(bodyClassName)}>{children}</div>}
    </section>
  );
}
