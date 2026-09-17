import * as React from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InfoHintProps {
  /** Texto de ajuda exibido no tooltip (também usado como rótulo acessível). */
  children: React.ReactNode;
  /** Rótulo do botão para leitores de tela (ex.: "Ajuda sobre CRM secundário"). */
  label: string;
  className?: string;
}

/**
 * Ícone de informação com tooltip, usado para mover textos de ajuda
 * longos fora do fluxo visual do formulário.
 */
export function InfoHint({ children, label, className }: InfoHintProps) {
  const [open, setOpen] = React.useState(false);
  const tooltipId = React.useId();

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button /* ds-allow: gatilho de ícone com área de toque mínima */
            type="button"
            aria-label={label}
            aria-describedby={open ? tooltipId : undefined}
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent id={tooltipId} className="max-w-64 text-pretty leading-relaxed">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
