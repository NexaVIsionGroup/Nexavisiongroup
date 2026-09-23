"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { gallery } from "./data";
import Title from "./Title";

const step = (i: number, dir: number) => (i + dir + gallery.length) % gallery.length;

export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  // Wipe each photo in as it enters the screen.
  useEffect(() => {
    const shots = grid.current?.querySelectorAll<HTMLElement>(".np-shot");
    if (!shots) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target as HTMLElement).setAttribute("data-in", "true")),
      { rootMargin: "0px 0px -10% 0px" }
    );
    shots.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : step(i, 1)));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : step(i, -1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <section className="np-section" id="gallery">
      <div className="np-wrap">
        <Title text="In the field." />
        <div className="np-gallery" ref={grid}>
          {gallery.map((g, i) => (
            <motion.button
              className="np-shot"
              key={g.src}
              onClick={() => setOpen(i)}
              aria-label={`View photo: ${g.alt}`}
              whileTap={{ scale: 0.97 }}
              data-tall={!!g.tall}
              style={{ transitionDelay: `${(i % 2) * 0.12}s` }}
            >
              <Image
                src={g.src}
                alt={g.alt}
                width={800}
                height={g.tall ? 1100 : 560}
                sizes="(max-width: 900px) 50vw, 25vw"
                style={{ aspectRatio: g.tall ? "8 / 11" : "10 / 7", objectFit: "cover" }}
              />
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="np-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={gallery[open].alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              key={open}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 60) setOpen((i) => (i === null ? i : step(i, info.offset.x < 0 ? 1 : -1)));
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={gallery[open].src} alt={gallery[open].alt} width={1400} height={1800} sizes="100vw" draggable={false} />
            </motion.div>
            <button className="np-lightbox-close" aria-label="Close photo" onClick={() => setOpen(null)}>
              <X size={22} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
