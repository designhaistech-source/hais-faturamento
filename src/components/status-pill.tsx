import { CheckCircle2, CircleDashed } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export interface StatusPillProps {
  done: boolean;
  label: string;
}

/**
 * Pill de progresso usada nas barras de ação (prescrição, OPME).
 * Usa o componente Badge do design system com variantes semânticas.
 */
export function StatusPill({ done, label }: StatusPillProps) {
  return (
    <Badge variant={done ? "success-soft" : "secondary"} size="md" data-testid="status-pill">
      {done ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
      <span data-testid="status-pill-label" className="whitespace-nowrap">
        {label}
      </span>
    </Badge>
  );
}
