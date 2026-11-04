import Image from "next/image";

type Tone = "dark" | "light";

/**
 * A chapter change that happens through a full-bleed photo: the outgoing tone
 * melts into its top, the incoming tone rises out of its bottom, a light streak
 * sweeps across and the picture drifts (CSS scroll-driven, zero JS).
 */
export function Junction({
  src,
  from,
  to,
  focus = "50% 50%",
  caption,
}: {
  src: string;
  from: Tone;
  to: Tone;
  focus?: string;
  caption?: string;
}) {
  return (
    <div className="nxs-junction" data-from={from} data-to={to} aria-hidden={!caption}>
      <div className="nxs-junction-img">
        <Image src={src} alt="" fill sizes="100vw" style={{ objectFit: "cover", objectPosition: focus }} />
      </div>
      <span className="nxs-junction-streak" />
      {caption && <p className="nxs-junction-caption nxs-display">{caption}</p>}
    </div>
  );
}
