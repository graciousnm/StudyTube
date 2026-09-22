import type { ReactNode } from "react";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl";

const sizeStyles: Record<ContainerSize, string> = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
};

interface ContainerProps {
  size?: ContainerSize;
  className?: string;
  children: ReactNode;
}

export function Container({
  size = "lg",
  className,
  children,
}: ContainerProps) {
  const classes = `mx-auto w-full px-4 sm:px-6 ${sizeStyles[size]}`;
  return (
    <div className={className ? `${classes} ${className}` : classes}>
      {children}
    </div>
  );
}
