import { useState } from "react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { parseHM, toUtcMinutes } from "@/lib/time";
import type { TimeRange } from "@/lib/types";

interface Props {
  offset: number;
  disabled: boolean;
  onAdd: (r: Omit<TimeRange, "id">) => void;
  onError: (msg: string) => void;
}

/** Label + start + end → a daily time range. */
export default function RangeForm({ offset, disabled, onAdd, onError }: Props) {
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const s = parseHM(start);
    const e = parseHM(end);
    if (!label.trim() || s === null || e === null || s === e) return onError("A range needs a label and two different HH:MM times.");
    onError("");
    onAdd({ label: label.trim(), startUtc: toUtcMinutes(s, offset), endUtc: toUtcMinutes(e, offset) });
    setLabel("");
    setStart("");
    setEnd("");
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <TextInput disabled={disabled} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Range label" aria-label="Range label" className="min-w-0 flex-1 basis-36" />
      <TextInput mono disabled={disabled} value={start} onChange={(e) => setStart(e.target.value)} placeholder="Start" aria-label="Range start" className="w-20" />
      <TextInput mono disabled={disabled} value={end} onChange={(e) => setEnd(e.target.value)} placeholder="End" aria-label="Range end" className="w-20" />
      <Button type="submit" variant="solid" disabled={disabled}>
        Add range
      </Button>
    </form>
  );
}
