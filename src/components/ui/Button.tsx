import type { ButtonHTMLAttributes } from "react";

type Variant = "outline" | "solid" | "accent" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  outline: "text-[var(--muted)] ring-1 ring-[var(--line)] hover:text-[var(--fg)] hover:ring-[var(--fg)]",
  solid: "bg-[var(--fg)] text-[var(--bg)] hover:opacity-90",
  accent: "bg-[var(--accent)] text-white hover:opacity-90",
  ghost: "text-[var(--muted)] hover:text-[var(--fg)]",
};

const SIZES: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** The one button style used across the app. */
export default function Button({ variant = "outline", size = "md", className = "", type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  );
}
