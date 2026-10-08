"use client";

import { motion, useReducedMotion } from "motion/react";
import { Dumbbell } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cdnUrl } from "@/lib/images";
import { useT } from "@/lib/i18n/client";

interface ExerciseGalleryProps {
  images: readonly string[];
  name: string;
}

/**
 * Start and end position of the movement, cross-fading every ~1.4 s so the photos read as a tiny animation.
 * Tapping switches manually. Motion is paused for people who prefer reduced motion.
 */
export function ExerciseGallery({ images, name }: ExerciseGalleryProps) {
  const reduceMotion = useReducedMotion();
  const t = useT();
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (images.length < 2 || reduceMotion) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % images.length), 1400);
    return () => window.clearInterval(id);
  }, [images.length, reduceMotion]);

  if (images.length === 0 || broken) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Dumbbell className="size-10" strokeWidth={1.6} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIndex((current) => (current + 1) % images.length)}
      aria-label={t("exercise.showNext", { name })}
      className="ink-photo relative block aspect-[4/3] w-full overflow-hidden rounded-2xl"
    >
      {images.map((src, i) => (
        <motion.div
          key={src}
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          <Image
            src={cdnUrl(src)}
            alt={i === 0 ? t("exercise.startPosition", { name }) : t("exercise.endPosition", { name })}
            fill
            sizes="(max-width: 640px) 100vw, 560px"
            unoptimized
            className="object-cover"
            onError={() => setBroken(true)}
          />
        </motion.div>
      ))}
      {images.length > 1 ? (
        <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
          {images.map((src, i) => (
            <span
              key={src}
              className={`h-1.5 rounded-full bg-white/80 transition-all ${i === index ? "w-5" : "w-1.5 opacity-40"}`}
            />
          ))}
        </span>
      ) : null}
    </button>
  );
}
