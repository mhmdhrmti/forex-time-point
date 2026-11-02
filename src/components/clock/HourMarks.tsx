import { R_LABEL, R_RING, atMinute } from "./geometry";

/** 24 ticks and numerals; every sixth hour is emphasised. */
export default function HourMarks() {
  return (
    <g>
      {Array.from({ length: 24 }, (_, hour) => {
        const major = hour % 6 === 0;
        const a = atMinute(R_RING, hour * 60);
        const b = atMinute(R_RING + (major ? 12 : 7), hour * 60);
        const l = atMinute(R_LABEL, hour * 60);
        return (
          <g key={hour}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={major ? "var(--fg)" : "var(--muted)"}
              strokeWidth={major ? 2.2 : 1.3}
              strokeOpacity={major ? 0.9 : 0.6}
            />
            <text
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono"
              fontSize={major ? 35 : 27}
              fontWeight={major ? 700 : 500}
              fill={major ? "var(--fg)" : "var(--muted)"}
            >
              {String(hour).padStart(2, "0")}
            </text>
          </g>
        );
      })}
    </g>
  );
}
