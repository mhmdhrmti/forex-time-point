interface Tab<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  tabs: Tab<T>[];
  onChange: (value: T) => void;
}

/** Underlined tab strip. */
export default function Tabs<T extends string>({ value, tabs, onChange }: Props<T>) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-[var(--line)]">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`-mb-px border-b-2 pb-2 text-sm transition-colors ${
            value === t.value
              ? "border-[var(--accent)] font-medium text-[var(--fg)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--fg)]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
