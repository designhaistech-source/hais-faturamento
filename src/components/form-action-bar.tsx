import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export interface FormActionStep {
  label: string;
  done: boolean;
}

interface FormActionBarProps {
  /** Etapas do formulário, exibidas como pills de progresso. */
  steps?: FormActionStep[];
  /** Rótulo acima das pills (ex.: "Etapas preenchidas"). */
  stepsLabel?: string;
  /** Bloco de alerta exibido acima das ações (ex.: resumo de erros de validação). */
  banner?: ReactNode;
  /** Nota discreta abaixo das pills (ex.: aviso de campos obrigatórios). */
  note?: ReactNode;
  /** Botões de ação (secundários com `variant="outline"`, primário por último). */
  children?: ReactNode;
  className?: string;
}

/**
 * Padrão das telas de preenchimento (Emitir guia, Emitir prescrição, Solicitar OPME,
 * Documentos): um bloco com o progresso das etapas e, separado dele, o bloco de ações.
 * Todos os botões devem usar `Button` com `size="sm"`.
 */
export function FormActionBar({
  steps,
  stepsLabel,
  banner,
  note,
  children,
  className,
}: FormActionBarProps) {
  const hasSteps = Boolean(steps && steps.length > 0);

  return (
    <div className={cn("space-y-3", className)}>
      {hasSteps && (
        <div
          data-testid="form-steps"
          className="rounded-xl border border-border bg-card/95 px-4 py-3 shadow-xs"
        >
          {stepsLabel && <p className="mb-2 text-xs font-semibold text-foreground">{stepsLabel}</p>}
          <div data-testid="form-steps-list" className="flex flex-wrap items-center gap-2">
            {steps!.map((step) => (
              <StatusPill key={step.label} done={step.done} label={step.label} />
            ))}
          </div>
        </div>
      )}

      {children && (
        <div className="rounded-xl border border-border bg-card/95 px-4 py-3 shadow-xs backdrop-blur">
          {banner && <div className="mb-3">{banner}</div>}
          <div className="grid min-w-0 grid-cols-1 gap-2 xs:grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end [&>*]:w-full [&>*]:min-w-0 [&>*]:justify-center sm:[&>*]:w-auto">
            {children}
          </div>
          {note && (
            <p className="mt-3 flex items-start gap-1.5 border-t border-border/60 pt-2 text-xs leading-relaxed text-muted-foreground/80 sm:text-muted-foreground/70">
              <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{note}</span>
            </p>
          )}
        </div>
      )}

      {!children && note && (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground/80 sm:text-muted-foreground/70">
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{note}</span>
        </p>
      )}
    </div>
  );
}
