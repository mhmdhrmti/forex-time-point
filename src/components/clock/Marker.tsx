import { C, R_MARKER, atMinute } from "./geometry";

const W = 58;
const H = 24;

interface Props {
  /** Local minutes after midnight. */
  minutes: number;
  /** Text inside the pill, e.g. "13:30". */
  text: string;
  fill: string;
  textFill: string;
  /** Emphasised (hovered): larger, with a halo. */
  hot?: boolean;
  title: string;
}

/**
 * A marker on the rim: a dashed spoke from the centre to a pill showing the time.
 * Shared by time points and selected events so they read as one family.
 */
export default function Marker({ minutes, text, fill, textFill, hot = false, title }: Props) {
  const p = atMinute(R_MARKER, minutes);
  const spokeEnd = atMinute(R_MARKER - H / 2, minutes);
  const scale = hot ? 1.14 : 1;
  return (
    <g>
      <line
        x1={C}
        y1={C}
        x2={spokeEnd.x}
        y2={spokeEnd.y}
        stroke={fill}
        strokeWidth={hot ? 2.4 : 1.7}
        strokeDasharray="7 6"
        strokeLinecap="round"
        strokeOpacity={hot ? 0.95 : 0.6}
      />
      <g transform={`translate(${p.x} ${p.y}) scale(${scale})`}>
        {hot && <rect x={-W / 2 - 5} y={-H / 2 - 5} width={W + 10} height={H + 10} rx={(H + 10) / 2} fill={fill} fillOpacity={0.22} />}
        <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={H / 2} fill={fill} stroke="var(--surface)" strokeWidth={2.5}>
          <title>{title}</title>
        </rect>
        <text x={0} y={0.5} textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize={13.5} fontWeight={700} fill={textFill}>
          {text}
        </text>
      </g>
    </g>
  );
}
