import { fmtHM, sectorPath, toLocalMinutes } from "@/lib/time";
import type { TimeRange } from "@/lib/types";
import { C, R_RANGE, atMinute } from "./geometry";

const initials = (s: string) =>
  s
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();

/** Time ranges: tip at the centre, a curved borderless outer end, fading toward the centre. */
export default function RangeWedges({ ranges, offset }: { ranges: TimeRange[]; offset: number }) {
  return (
    <g>
      {ranges.map((r) => {
        const start = toLocalMinutes(r.startUtc, offset);
        const end = toLocalMinutes(r.endUtc, offset);
        const span = (end - start + 1440) % 1440;
        const labelR = R_RANGE - 24;
        const fits = (labelR * (span / 1440) * Math.PI * 2) / 9.5; // roughly how many characters fit
        const label = r.label.length <= fits ? r.label : initials(r.label).length <= fits ? initials(r.label) : "";
        const p = atMinute(labelR, start + span / 2);
        return (
          <g key={r.id}>
            <path d={sectorPath(C, C, R_RANGE, start, end)} fill="url(#ftp-range)">
              <title>{`${r.label}: ${fmtHM(start)}–${fmtHM(end)}`}</title>
            </path>
            {label && (
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill="var(--fg)" fillOpacity={0.88}>
                {label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
