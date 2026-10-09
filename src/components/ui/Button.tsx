import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:brightness-110",
  secondary:
    "bg-surface text-fg-2 ring-1 ring-inset ring-border hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-3 hover:text-foreground",
  danger: "bg-danger-solid text-white shadow-sm hover:brightness-110",
  success: "bg-success-solid text-white shadow-sm hover:brightness-110",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
