import { useMemo } from "react";
import Dropdown from "@/components/ui/Dropdown";
import SegmentedControl from "@/components/ui/SegmentedControl";
import type { Impact } from "@/lib/types";

export type ImpactFilter = Impact | "all";

const IMPACTS: Array<{ value: ImpactFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

interface Props {
  impact: ImpactFilter;
  currency: string;
  currencies: string[];
  onImpact: (f: ImpactFilter) => void;
  onCurrency: (c: string) => void;
}

/** Impact and currency filters for the day's list. */
export default function EventFilters({ impact, currency, currencies, onImpact, onCurrency }: Props) {
  const options = useMemo(() => {
    const list = [...currencies];
    if (currency !== "all" && !list.includes(currency)) list.push(currency);
    return [{ value: "all", label: "All currencies" }, ...list.map((c) => ({ value: c, label: c }))];
  }, [currencies, currency]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl ariaLabel="Filter by impact" value={impact} options={IMPACTS} onChange={onImpact} />
      <Dropdown ariaLabel="Filter by currency" value={currency} options={options} onChange={onCurrency} alignRight className="w-40" />
    </div>
  );
}
