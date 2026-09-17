"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

/** Animação e empilhamento comuns às duas variantes. */
const TOOLTIP_MOTION =
  "z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)";

/**
 * Variante `panel`: superfície de popover usada quando o tooltip carrega
 * conteúdo estruturado (rótulo, código, valor). Exportada para reuso em
 * tooltips de gráficos (Recharts), que não passam pelo Radix.
 */
export const tooltipPanelClass =
  "rounded-lg border border-border bg-popover px-3 py-2 text-xs text-foreground shadow-md";

const TOOLTIP_VARIANTS = {
  default: "rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground",
  panel: tooltipPanelClass,
} as const;

interface TooltipContentProps extends React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Content
> {
  /** `default` para texto curto; `panel` para conteúdo estruturado. */
  variant?: keyof typeof TOOLTIP_VARIANTS;
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, variant = "default", ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(TOOLTIP_MOTION, TOOLTIP_VARIANTS[variant], className)}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
