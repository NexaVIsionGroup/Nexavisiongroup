import type { Device } from "./data";

/** Placeholder product render (back of phone) until real photography exists. */
export default function PhoneRender({ d }: { d: Device }) {
  const { island, body, accent } = d.render;
  const fold = d.family === "fold";
  const w = fold ? 150 : 120;
  return (
    <svg viewBox={`0 0 ${w + 20} 260`} aria-hidden>
      <defs>
        <linearGradient id={`g-${d.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity=".55" />
          <stop offset=".35" stopColor={body} />
          <stop offset="1" stopColor={body} />
        </linearGradient>
      </defs>
      <rect x="10" y="6" width={w} height="248" rx={fold ? 14 : 20} fill={`url(#g-${d.id})`} />
      <rect x="10.5" y="6.5" width={w - 1} height="247" rx={fold ? 14 : 20} fill="none" stroke="rgba(255,255,255,.18)" />
      {fold && <path d={`M${10 + w / 2} 8 V252`} stroke="rgba(255,255,255,.12)" />}
      {island === "round" && (
        <g transform={`translate(${10 + w / 2} 58)`}>
          <circle r="36" fill="rgba(0,0,0,.35)" stroke={accent} strokeOpacity=".6" />
          {[[-13, -13], [13, -13], [0, 12]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="9.5" fill="#07090b" stroke="rgba(255,255,255,.25)" />
          ))}
        </g>
      )}
      {island === "offset" && (
        <g transform="translate(46 60)">
          <rect x="-24" y="-40" width="48" height="84" rx="24" fill="rgba(0,0,0,.35)" stroke={accent} strokeOpacity=".6" />
          {[-22, 0, 22].map((y) => <circle key={y} cy={y} r="9" fill="#07090b" stroke="rgba(255,255,255,.25)" />)}
        </g>
      )}
      {island === "wide" && (
        <g transform="translate(22 22)">
          <rect width="66" height="72" rx="18" fill="rgba(0,0,0,.35)" stroke={accent} strokeOpacity=".6" />
          {[[20, 20], [46, 20], [20, 50], [46, 50]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 3 ? 4 : 9} fill="#07090b" stroke="rgba(255,255,255,.25)" />
          ))}
        </g>
      )}
      {island === "fan" && (
        <g>
          <rect x={10 + w / 2 - 22} y="92" width="44" height="44" rx="22" fill="rgba(0,0,0,.4)" stroke={accent} strokeOpacity=".8" />
          {[0, 45, 90, 135].map((a) => (
            <path key={a} d="M0 -16 V16" transform={`translate(${10 + w / 2} 114) rotate(${a})`} stroke={accent} strokeWidth="2" strokeLinecap="round" opacity=".8" />
          ))}
          {[0, 1, 2].map((i) => <circle key={i} cx={30} cy={30 + i * 22} r="8" fill="#07090b" stroke="rgba(255,255,255,.25)" />)}
          <path d={`M${w - 4} 180 v40`} stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
