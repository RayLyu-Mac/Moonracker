import type React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      neutral: "bg-slate-100 text-slate-700",
      high: "bg-rose-100 text-rose-700",
      medium: "bg-amber-100 text-amber-700",
      low: "bg-emerald-100 text-emerald-700",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
