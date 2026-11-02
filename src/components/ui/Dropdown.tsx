"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  /** Secondary text shown muted after the label; also searched. */
  hint?: string;
}

interface Props<T extends string | number> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Adds a search box at the top of the list. */
  searchable?: boolean;
  className?: string;
  /** Right-align the list with the trigger (for controls near the right edge). */
  alignRight?: boolean;
}

const MIN_LIST = 160;
const MAX_LIST = 320;

/**
 * A custom select whose list always opens directly BELOW the trigger (native selects open wherever the OS likes).
 * Keyboard: ↑ ↓ Home End to move, Enter to choose, Esc to close, type to search (when searchable) or jump.
 */
export default function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  searchable = false,
  className = "",
  alignRight = false,
}: Props<T>) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [maxH, setMaxH] = useState(MAX_LIST);

  const selected = options.find((o) => o.value === value);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const openList = () => {
    const rect = root.current?.getBoundingClientRect();
    if (rect) {
      const room = window.innerHeight - rect.bottom - 16;
      setMaxH(Math.max(MIN_LIST, Math.min(MAX_LIST, room)));
    }
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const close = () => setOpen(false);
  const choose = (o: DropdownOption<T>) => {
    onChange(o.value);
    close();
  };

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Focus the search box (or list) when opened; keep the active row in view.
  useEffect(() => {
    if (!open) return;
    (searchable ? searchRef.current : listRef.current)?.focus({ preventScroll: true });
    root.current?.scrollIntoView({ block: "nearest" });
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      root.current?.querySelector<HTMLElement>("button")?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(shown.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home" && !searchable) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End" && !searchable) {
      e.preventDefault();
      setActive(shown.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) choose(shown[active]);
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openList();
          }
        }}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-left text-sm text-[var(--fg)] transition-colors hover:border-[var(--muted)] focus-visible:border-[var(--accent)]"
      >
        <span className="min-w-0 truncate">{selected?.label ?? String(value)}</span>
        <svg viewBox="0 0 12 12" aria-hidden className={`h-3 w-3 shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          onKeyDown={onKeyDown}
          className={`absolute top-full z-40 mt-1 min-w-full overflow-hidden rounded-lg bg-[var(--surface)] shadow-xl ring-1 ring-[var(--line)] ${
            alignRight ? "right-0" : "left-0"
          }`}
          style={{ width: "max-content", maxWidth: "min(92vw, 26rem)" }}
        >
          {searchable && (
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder="Search…"
              aria-label={`Search ${ariaLabel}`}
              className="w-full border-b border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none"
            />
          )}
          <ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-activedescendant={shown[active] ? `${id}-opt-${active}` : undefined}
            className="overflow-y-auto py-1 outline-none"
            style={{ maxHeight: maxH }}
          >
            {shown.length === 0 && <li className="px-3 py-2 text-xs text-[var(--muted)]">No matches</li>}
            {shown.map((o, i) => (
              <li
                key={String(o.value)}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                data-index={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o)}
                className={`flex cursor-pointer items-baseline gap-2 px-3 py-1.5 text-sm ${
                  i === active ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]" : ""
                } ${o.value === value ? "font-medium text-[var(--accent)]" : ""}`}
              >
                <span className="whitespace-nowrap">{o.label}</span>
                {o.hint && <span className="truncate text-xs font-normal text-[var(--muted)]">{o.hint}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
