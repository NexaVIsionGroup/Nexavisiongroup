import Link from "next/link";

/* ── Aperture mark: six iris blades open around an "N" drawn in light ── */
const C = 20; // centre of the 40×40 mark
const R = 19; // outer radius
const r = 7.4; // opening (hexagon) radius
const pt = (rad: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(C + rad * Math.cos(a)).toFixed(2)} ${(C + rad * Math.sin(a)).toFixed(2)}`;
};
const BLADES = Array.from({ length: 6 }, (_, k) => {
  const t = k * 60 - 90;
  return `M ${pt(r, t)} L ${pt(R, t + 16)} A ${R} ${R} 0 0 1 ${pt(R, t + 76)} L ${pt(r, t + 60)} Z`;
});
const SHADE = [1, 0.82, 0.62, 0.48, 0.62, 0.82];
const N_PATH = `M ${C - 3.1} ${C + 3.7} V ${C - 3.7} L ${C + 3.1} ${C + 3.7} V ${C - 3.7}`;

export function LogoMark({ uid = "nx", size = 38 }: { uid?: string; size?: number }) {
  return (
    <svg className="nxs-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-blade`} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b6fff2" />
          <stop offset="0.45" stopColor="#3ff5d6" />
          <stop offset="1" stopColor="#0f5c55" />
        </linearGradient>
        <radialGradient id={`${uid}-pupil`} cx="20" cy="20" r="8" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3ff5d6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#04100e" stopOpacity="1" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R + 0.6} className="nxs-mark-ring" />
      <circle cx={C} cy={C} r={R + 0.6} className="nxs-mark-ticks" />
      <circle cx={C} cy={C} r={r + 1.5} fill={`url(#${uid}-pupil)`} className="nxs-mark-pupil" />
      <g className="nxs-mark-blades">
        {BLADES.map((d, i) => (
          <path key={i} d={d} fill={`url(#${uid}-blade)`} fillOpacity={SHADE[i]} stroke="#04100e" strokeWidth="0.9" strokeLinejoin="round" />
        ))}
      </g>
      <path d={N_PATH} className="nxs-mark-n" />
      <path d={N_PATH} className="nxs-mark-glint" />
    </svg>
  );
}

export function Logo({ uid = "nx", onClick }: { uid?: string; onClick?: () => void }) {
  return (
    <Link href="/" className="nxs-logo" aria-label="NexaVision Group home" onClick={onClick}>
      <LogoMark uid={uid} />
      <span className="nxs-wordmark" aria-hidden>
        <span className="nxs-wm-main">
          Nexa<span className="nxs-wm-vision">Vision</span>
        </span>
        <span className="nxs-wm-group">Group</span>
      </span>
    </Link>
  );
}
