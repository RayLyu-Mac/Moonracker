import type React from "react";
import { cn } from "../../lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.38)]",
        className,
      )}
      {...props}
    />
  );
}
