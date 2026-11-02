"use client";

import { useMemo } from "react";
import Dropdown, { type DropdownOption } from "@/components/ui/Dropdown";
import { TIMEZONES } from "@/lib/data";
import { fmtGmt } from "@/lib/time";

interface Props {
  offset: number;
  deviceOffset: number;
  onChange: (offset: number) => void;
}

/** GMT offset picker with search ("tehran", "+5:30"…) that opens below the field. */
export default function TimeZoneSelect({ offset, deviceOffset, onChange }: Props) {
  const options = useMemo<DropdownOption<number>[]>(() => {
    const list = TIMEZONES.map((t) => ({ value: t.offset, label: fmtGmt(t.offset), hint: t.places }));
    if (!list.some((o) => o.value === deviceOffset)) {
      list.push({ value: deviceOffset, label: fmtGmt(deviceOffset), hint: "This device" });
      list.sort((a, b) => a.value - b.value);
    }
    return list;
  }, [deviceOffset]);

  return <Dropdown ariaLabel="Time zone" value={offset} options={options} onChange={onChange} searchable className="min-w-0 flex-1 sm:w-[260px] sm:flex-none" />;
}
