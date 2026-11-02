import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import DayNavigator from "./DayNavigator";
import TimeZoneSelect from "./TimeZoneSelect";

interface Props {
  offset: number;
  deviceOffset: number;
  usingDeviceZone: boolean;
  onOffset: (offset: number) => void;
  onUseDevice: () => void;
  dateKey: string | null;
  isToday: boolean;
  onPickDate: (key: string) => void;
  onShiftDate: (days: number) => void;
  onToday: () => void;
}

/** Time zone on the left, trading day on the right (stacks on small screens). */
export default function ControlBar(p: Props) {
  return (
    <Panel className="flex flex-wrap items-center gap-x-5 gap-y-3 p-3">
      <label className="flex min-w-0 flex-1 basis-64 items-center gap-2 text-xs text-[var(--muted)] sm:flex-none">
        <span className="shrink-0">Time zone</span>
        <TimeZoneSelect offset={p.offset} deviceOffset={p.deviceOffset} onChange={p.onOffset} />
      </label>
      {!p.usingDeviceZone && (
        <Button size="sm" variant="ghost" onClick={p.onUseDevice}>
          Use device zone
        </Button>
      )}
      <div className="sm:ml-auto">
        <DayNavigator dateKey={p.dateKey} isToday={p.isToday} onPick={p.onPickDate} onShift={p.onShiftDate} onToday={p.onToday} />
      </div>
    </Panel>
  );
}
