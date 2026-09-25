import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border px-2.5 text-xs font-semibold leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap [&_svg]:shrink-0 [&_svg]:-translate-y-[0.115em]",

  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/90",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/90",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/90",
        purple: "border-transparent bg-purple text-purple-foreground hover:bg-purple/90",
        "primary-soft": "border-primary/30 bg-primary/10 text-primary",
        "success-soft": "border-success/40 bg-success-muted text-success-strong",
        "warning-soft": "border-warning/50 bg-warning-muted text-warning-strong",
        "info-soft": "border-info/30 bg-info-muted text-info",
        "destructive-soft": "border-destructive/40 bg-destructive-muted text-destructive-strong",
        "caution-soft": "border-caution/40 bg-caution-muted text-caution-strong",
        "neutral-soft": "border-border bg-muted text-muted-foreground",
        outline: "border-border text-foreground bg-transparent",
      },
      size: {
        sm: "px-2 pt-0.5 h-6 text-xs [&_svg]:size-3",
        md: "px-2.5 pt-0.5 h-7 text-xs [&_svg]:size-3.5",
        lg: "px-3 pt-0.5 h-8 text-sm [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
