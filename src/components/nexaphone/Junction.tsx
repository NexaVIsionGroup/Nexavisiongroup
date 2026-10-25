import Image from "next/image";

type Tone = "dark" | "light";

/**
 * The transition between two chapters IS a picture. Full-bleed image; the
 * outgoing chapter's colour melts into its top half, the incoming chapter's
 * colour rises out of its bottom half, with a light streak sweeping across.
 * No line, no corner: the page changes tone through the image.
 */
export default function Junction({
  src,
  from,
  to,
  focus = "50% 50%",
  alt = "",
  streak = true,
}: {
  src: string;
  from: Tone;
  to: Tone;
  focus?: string;
  alt?: string;
  streak?: boolean;
}) {
  return (
    <div className="np-junction" data-from={from} data-to={to} aria-hidden={!alt}>
      <Image src={src} alt={alt} fill sizes="100vw" style={{ objectFit: "cover", objectPosition: focus }} />
      {streak && <span className="np-junction-streak" />}
    </div>
  );
}
