import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium leading-none whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 icon-optical",
  {
    variants: {
      variant: {
        default:
          "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
        selected: "border-primary bg-primary text-primary-foreground",
        soft: "border-primary/40 bg-primary/10 text-primary",
        warning: "border-warning/60 bg-warning/15 text-warning-strong",
        outline: "border-border bg-card text-foreground",
      },
      size: {
        sm: "min-h-7 px-2.5 py-1.5 text-xs/none [&_svg]:size-3",
        md: "min-h-8 px-3 py-2 text-xs/none [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ChipProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof chipVariants> {
  /** Renderiza como <span> quando não é interativo. */
  asSpan?: boolean;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, variant, size, asSpan = false, type = "button", ...props }, ref) => {
    if (asSpan) {
      const { onClick: _onClick, disabled: _disabled, ...rest } = props;
      return (
        <span
          className={cn(chipVariants({ variant, size }), className)}
          {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
        />
      );
    }
    return (
      <button
        ref={ref}
        type={type}
        className={cn(chipVariants({ variant, size }), "cursor-pointer", className)}
        {...props}
      />
    );
  },
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
