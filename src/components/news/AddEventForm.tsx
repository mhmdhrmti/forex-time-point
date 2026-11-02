import { useState } from "react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import TextInput from "@/components/ui/TextInput";
import { dayStartMs, fmtDateKeyShort, parseHM } from "@/lib/time";
import type { Impact, NewsEvent } from "@/lib/types";

const IMPACTS: Array<{ value: Impact; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

/** Add a personal event on the viewed day. */
export default function AddEventForm({ dateKey, offset, onAdd }: { dateKey: string; offset: number; onAdd: (e: Omit<NewsEvent, "id" | "custom">) => void }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [impact, setImpact] = useState<Impact>("high");
  const [error, setError] = useState("");

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const minutes = parseHM(time);
    if (!title.trim()) return setError("Enter a title.");
    if (minutes === null) return setError("Time must be HH:MM (24h).");
    setError("");
    onAdd({ title: title.trim(), country: "", impact, allDay: false, atMs: dayStartMs(dateKey, offset) + minutes * 60_000 });
    setTitle("");
    setTime("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Add your own event on {fmtDateKeyShort(dateKey)}</h3>
      <div className="flex flex-wrap gap-2">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Event title" className="min-w-0 flex-1 basis-40" />
        <TextInput mono value={time} onChange={(e) => setTime(e.target.value)} placeholder="HH:MM" aria-label="Event time (24h)" className="w-20" />
        <Dropdown ariaLabel="Impact" value={impact} options={IMPACTS} onChange={setImpact} alignRight className="w-28" />
        <Button type="submit" variant="solid">
          Add
        </Button>
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </form>
  );
}
