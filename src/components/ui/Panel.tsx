import type { HTMLAttributes } from "react";

/** A raised surface with a hairline ring. */
export default function Panel({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl bg-[var(--surface)] ring-1 ring-[var(--line)] ${className}`} {...rest} />;
}
