import { ImageResponse } from "next/og";

// Link preview for texts and social shares of /nexaphone (and inherited by child pages).
export const runtime = "edge";
export const alt = "Nexa Pro: phones that lock to the tower you choose";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function font(family: string, weight: number) {
  // A plain curl user agent makes Google Fonts return one complete TTF, which the renderer can read.
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`, {
      headers: { "User-Agent": "curl/8" },
    })
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
  try {
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

function tower(h: number, on: boolean) {
  const w = h * 0.4;
  const c = on ? "#56e0e8" : "#8fa3b0";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 10}" height="${h + 14}" viewBox="${-w / 2 - 5} -14 ${w + 10} ${h + 14}"><circle cx="0" cy="-7" r="5" fill="#ff4a3d"/><path d="M0 0 L${-w / 2} ${h} M0 0 L${w / 2} ${h} M${-w * 0.2} ${h * 0.4} H${w * 0.2} M${-w * 0.33} ${h * 0.66} H${w * 0.33} M${-w * 0.1} ${h * 0.2} L${w * 0.2} ${h * 0.4} M${-w * 0.2} ${h * 0.4} L${w * 0.33} ${h * 0.66}" stroke="${c}" stroke-width="${on ? 4 : 3}" stroke-linecap="round" fill="none"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default async function OG() {
  const [display, body] = await Promise.all([font("Big Shoulders Display", 800), font("IBM Plex Sans", 500)]);
  const towers = [
    { h: 150, on: false },
    { h: 110, on: false },
    { h: 230, on: true },
    { h: 120, on: false },
    { h: 170, on: false },
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "radial-gradient(circle at 78% 30%, #173340 0%, #0d1419 55%)",
          padding: 64,
          color: "#e9eef0",
          fontFamily: "Plex",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, fontFamily: "Display", letterSpacing: 2 }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, background: "#56e0e8", boxShadow: "0 0 24px #56e0e8" }} />
          NEXA PRO
        </div>
        <div style={{ position: "absolute", right: 70, top: 70, display: "flex", alignItems: "flex-end", gap: 34 }}>
          {towers.map((t, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={tower(t.h, t.on)} alt="" width={Math.round(t.h * 0.4 + 10)} height={t.h + 14} style={{ opacity: t.on ? 1 : 0.4 }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Display" }}>
          <div style={{ fontSize: 132, lineHeight: 0.9 }}>PICK THE TOWER.</div>
          <div style={{ fontSize: 132, lineHeight: 0.9, color: "#56e0e8" }}>KEEP THE SPEED.</div>
          <div style={{ fontSize: 30, color: "#a9b7c1", marginTop: 22, fontFamily: "Plex" }}>
            No more full bars and no internet. Flagship phones, rebuilt for work.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      // Only pass fonts that loaded; an empty list would remove the built-in fallback font.
      ...(display || body
        ? {
            fonts: [
              ...(display ? [{ name: "Display", data: display, weight: 800 as const, style: "normal" as const }] : []),
              ...(body ? [{ name: "Plex", data: body, weight: 500 as const, style: "normal" as const }] : []),
            ],
          }
        : {}),
    }
  );
}
