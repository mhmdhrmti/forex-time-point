import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";

interface Props {
  dateKey: string | null;
  isToday: boolean;
  onPick: (key: string) => void;
  onShift: (days: number) => void;
  onToday: () => void;
}

/** ‹ date › Today — step through trading days or pick one. */
export default function DayNavigator({ dateKey, isToday, onPick, onShift, onToday }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Trading day">
      <Button size="sm" onClick={() => onShift(-1)} disabled={!dateKey} aria-label="Previous day">
        ‹
      </Button>
      <TextInput mono type="date" value={dateKey ?? ""} onChange={(e) => onPick(e.target.value)} aria-label="Trading day" />
      <Button size="sm" onClick={() => onShift(1)} disabled={!dateKey} aria-label="Next day">
        ›
      </Button>
      <Button size="sm" onClick={onToday} disabled={isToday}>
        Today
      </Button>
    </div>
  );
}
