import Image from "next/image";

/**
 * A full-bleed image that straddles the boundary between a dark chapter and a
 * light one. Its top dissolves into the dark section and its bottom into the
 * light one, so the page changes tone *through* the picture, not at a line.
 */
export default function MediaSeam({ src, alt = "", ratio = 0.62, focus = "50% 50%" }: { src: string; alt?: string; ratio?: number; focus?: string }) {
  return (
    <div className="np-mseam" style={{ aspectRatio: `1 / ${ratio}` }} aria-hidden={!alt}>
      <Image src={src} alt={alt} fill sizes="100vw" style={{ objectFit: "cover", objectPosition: focus }} />
    </div>
  );
}
