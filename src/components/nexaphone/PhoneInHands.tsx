"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A junction where a video plays ON the phone in a photo. The photo is drawn
 * cover-fit; the video is projected onto the screen's four corners with a 3D
 * homography and clipped to them; the thumbs are a cut-out layered back on top.
 * Corner coordinates and mask are in the photo's own pixel space.
 */
type Pt = [number, number];
type Props = {
  photo: string;
  /** RGBA cut-out of the hands that overlap the screen, and its [x, y, w, h] box in photo pixels. */
  thumbs: string;
  thumbsBox: [number, number, number, number];
  video: string;
  size: [number, number]; // photo pixel size
  corners: [Pt, Pt, Pt, Pt]; // TL, TR, BR, BL of the screen in photo pixels
  from: "dark" | "light";
  to: "dark" | "light";
  focus?: [number, number]; // cover focal point 0..1
};

// Homography from the unit square to the 4 corners → CSS matrix3d (column-major).
function homography(c: [Pt, Pt, Pt, Pt], w: number, h: number) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = c;
  // Solve for the projective transform mapping (0,0),(w,0),(w,h),(0,h) → corners.
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - sy * dx2) / det;
  const hh = (dx1 * sy - dy1 * sx) / det;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + hh * x3;
  const cc = x0;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + hh * y3;
  const f = y0;
  // scale from unit square to the element's own w×h
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, cc, f, 0, 1];
  return `matrix3d(${m.map((v) => v.toFixed(6)).join(",")})`;
}

export default function PhoneInHands({ photo, thumbs, thumbsBox, video, size, corners, from, to, focus = [0.5, 0.45] }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{ scale: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const fit = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const scale = Math.max(W / size[0], H / size[1]);
      const ox = (size[0] * scale - W) * focus[0];
      const oy = (size[1] * scale - H) * focus[1];
      setGeo({ scale, ox, oy });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size, focus]);

  const VW = 1000;
  const VH = 470;
  const tf = geo
    ? homography(corners.map(([x, y]) => [x * geo.scale - geo.ox, y * geo.scale - geo.oy] as Pt) as [Pt, Pt, Pt, Pt], VW, VH)
    : undefined;

  return (
    <div className="np-junction np-pih" data-from={from} data-to={to} ref={host} aria-hidden>
      {/* photo, cover-fit by the same math as the mask/video */}
      <img
        src={photo}
        alt=""
        className="np-pih-photo"
        style={geo ? { width: size[0] * geo.scale, height: size[1] * geo.scale, left: -geo.ox, top: -geo.oy } : undefined}
      />
      {geo && (
        <>
          {/* video clipped to the screen's four corners */}
          <div
            className="np-pih-clip"
            style={{
              width: size[0] * geo.scale,
              height: size[1] * geo.scale,
              left: -geo.ox,
              top: -geo.oy,
              clipPath: `polygon(${corners.map(([x, y]) => `${(x * geo.scale).toFixed(1)}px ${(y * geo.scale).toFixed(1)}px`).join(", ")})`,
            }}
          >
            <video
              className="np-pih-video"
              src={video}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              style={{ width: VW, height: VH, transform: tf, left: geo.ox, top: geo.oy }}
            />
          </div>
          {/* the thumbs, cut out of the photo, back on top of the video */}
          <img
            src={thumbs}
            alt=""
            className="np-pih-thumbs"
            style={{
              width: thumbsBox[2] * geo.scale,
              height: thumbsBox[3] * geo.scale,
              left: thumbsBox[0] * geo.scale - geo.ox,
              top: thumbsBox[1] * geo.scale - geo.oy,
            }}
          />
        </>
      )}
      <span className="np-junction-streak" />
    </div>
  );
}
