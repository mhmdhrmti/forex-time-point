/** Brand mark: a 24h dial with a highlighted time-range wedge and a hand. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Forex Time Point logo">
      <circle cx="16" cy="16" r="13.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {/* time-range wedge: centre → 00:00 → 08:00 */}
      <path d="M16 16 L16 4.5 A11.5 11.5 0 0 1 25.96 21.75 Z" fill="var(--accent)" fillOpacity="0.42" />
      {/* quarter ticks */}
      <path d="M29.25 16h-2.4M16 29.25v-2.4M2.75 16h2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* hand */}
      <path d="M16 16 L8.6 8.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5 text-[var(--fg)]">
      <LogoMark />
      <div className="leading-tight">
        <p className="text-[15px] font-semibold tracking-wide">
          Forex <span className="font-normal text-[var(--accent)]">Time Point</span>
        </p>
        <p className="text-[11px] text-[var(--muted)]">24-hour market clock</p>
      </div>
    </div>
  );
}
