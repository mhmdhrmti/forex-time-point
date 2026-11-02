import { useState } from "react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { parseHM, toUtcMinutes } from "@/lib/time";
import type { TimePoint } from "@/lib/types";

interface Props {
  offset: number;
  disabled: boolean;
  onAdd: (p: Omit<TimePoint, "id">) => void;
  onError: (msg: string) => void;
}

/** Label + HH:MM → a daily time point. */
export default function PointForm({ offset, disabled, onAdd, onError }: Props) {
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const m = parseHM(time);
    if (!label.trim() || m === null) return onError("A point needs a label and an HH:MM time.");
    onError("");
    onAdd({ label: label.trim(), utcMinutes: toUtcMinutes(m, offset) });
    setLabel("");
    setTime("");
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <TextInput disabled={disabled} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Point label" aria-label="Point label" className="min-w-0 flex-1 basis-36" />
      <TextInput mono disabled={disabled} value={time} onChange={(e) => setTime(e.target.value)} placeholder="HH:MM" aria-label="Point time" className="w-20" />
      <Button type="submit" variant="solid" disabled={disabled}>
        Add point
      </Button>
    </form>
  );
}
