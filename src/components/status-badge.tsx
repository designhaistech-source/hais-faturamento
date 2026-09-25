import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Semântica única de status em todo o sistema:
 * success = conclusão positiva · danger = problema/divergência ·
 * warning = atenção/incompleto · neutral = estado neutro · info = em andamento.
 */
export type StatusTone = "success" | "danger" | "warning" | "neutral" | "info";

const TONE_VARIANT = {
  success: "success-soft",
  danger: "destructive-soft",
  warning: "warning-soft",
  neutral: "neutral-soft",
  info: "info-soft",
} as const;

interface StatusBadgeProps {
  tone: StatusTone;
  icon: LucideIcon;
  label: string;
  /** Anima o ícone (ex.: processamento), respeitando reduced-motion. */
  spinning?: boolean;
  className?: string;
}

/** Badge informativo (não clicável) com ícone + texto + cor. */
export function StatusBadge({ tone, icon: Icon, label, spinning, className }: StatusBadgeProps) {
  return (
    <Badge variant={TONE_VARIANT[tone]} size="md" className={cn("shrink-0", className)}>
      <Icon
        className={cn(spinning && "animate-spin motion-reduce:animate-none")}
        aria-hidden="true"
      />
      {label}
    </Badge>
  );
}
