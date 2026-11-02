import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

/** The one text field style used across the app. */
export default function TextInput({ mono = false, className = "", ...rest }: Props) {
  return (
    <input
      className={`rounded-md border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 ${
        mono ? "font-mono" : ""
      } ${className}`}
      {...rest}
    />
  );
}
