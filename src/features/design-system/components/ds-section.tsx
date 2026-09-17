import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/surface-card";

interface DsSectionProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

/** Bloco de documentação do design system. */
export function DsSection({ id, title, description, children }: DsSectionProps) {
  return (
    <SurfaceCard id={id} title={title} description={description} padding="lg">
      <div className="space-y-6">{children}</div>
    </SurfaceCard>
  );
}

/** Subtítulo dentro de uma seção de documentação. */
export function DsSubhead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <h3 className="font-display text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Área de demonstração de um componente. */
export function DsSpecimen({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-subtle p-4">
      {children}
    </div>
  );
}

/** Regras de uso: o que fazer e o que evitar. */
export function DsGuidance({ dos, donts }: { dos: string[]; donts: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-success/30 bg-success-muted/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-success">Faça</p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {dos.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Evite</p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {donts.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
