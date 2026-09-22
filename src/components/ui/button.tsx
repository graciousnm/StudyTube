import type { ButtonHTMLAttributes, Ref } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "ghost-danger";
type ButtonSize = "sm" | "md" | "icon";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary:
    "border border-zinc-700 bg-transparent text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800",
  danger: "border border-red-500 bg-transparent text-red-400 hover:bg-red-600 hover:text-white",
  ghost: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
  "ghost-danger": "text-zinc-500 hover:bg-red-500/10 hover:text-red-400",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-3",
  md: "h-11 px-4",
  icon: "h-10 w-10",
};

export function buttonVariants({
  variant = "secondary",
  size = "md",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} = {}): string {
  return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ref,
  ...props
}: ButtonProps) {
  const classes = buttonVariants({ variant, size });
  return (
    <button
      ref={ref}
      type={type}
      className={className ? `${classes} ${className}` : classes}
      {...props}
    />
  );
}