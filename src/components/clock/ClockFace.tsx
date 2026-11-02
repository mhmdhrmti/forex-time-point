import { arcPath } from "@/lib/time";
import { C, R_RING } from "./geometry";

interface Props {
  /** Market closed right now / for the viewed day: no fill, red border. */
  closed: boolean;
  /** Part-day closures (weekend start/end) as local minutes, drawn as red stretches of the border. */
  closedWindows: Array<[number, number]>;
}

/** The dial's disc and border. Closed = empty face with a red border; the rest of the clock keeps working. */
export default function ClockFace({ closed, closedWindows }: Props) {
  return (
    <g>
      <circle
        className="ftp-face"
        cx={C}
        cy={C}
        r={R_RING}
        fill={closed ? "none" : "var(--face)"}
        stroke={closed ? "var(--danger)" : "var(--line)"}
        strokeWidth={closed ? 4 : 1.5}
      />
      {!closed &&
        closedWindows.map(([a, b], i) => (
          <path key={i} d={arcPath(C, C, R_RING, a, b)} fill="none" stroke="var(--danger)" strokeWidth={4} />
        ))}
    </g>
  );
}
