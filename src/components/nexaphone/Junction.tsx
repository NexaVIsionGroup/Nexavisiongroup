import Image from "next/image";

type Tone = "dark" | "light";

/**
 * The transition between two chapters IS a picture (or a muted video loop).
 * Full-bleed; the outgoing chapter's colour melts into its top half, the
 * incoming chapter's colour rises out of its bottom half, with a light streak
 * sweeping across. No line, no corner: the page changes tone through the media.
 */
export default function Junction({
  src,
  video,
  from,
  to,
  focus = "50% 50%",
  alt = "",
  streak = true,
}: {
  src: string;
  /** Optional muted loop; `src` is then the poster. */
  video?: string;
  from: Tone;
  to: Tone;
  focus?: string;
  alt?: string;
  streak?: boolean;
}) {
  return (
    <div className="np-junction" data-from={from} data-to={to} aria-hidden={!alt}>
      {video ? (
        <video className="np-junction-video" src={video} poster={src} autoPlay muted loop playsInline preload="metadata" style={{ objectPosition: focus }} />
      ) : (
        <Image src={src} alt={alt} fill sizes="100vw" style={{ objectFit: "cover", objectPosition: focus }} />
      )}
      {streak && <span className="np-junction-streak" />}
    </div>
  );
}
