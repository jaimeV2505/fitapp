"use client";

import { Dumbbell } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { MuscleGroup } from "@/lib/db/schema/enums";
import { cdnUrl } from "@/lib/images";
import { useT } from "@/lib/i18n/client";
import { muscleLabel } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";

interface ExerciseThumbProps {
  src: string | undefined;
  name: string;
  muscle: MuscleGroup;
  /** Tailwind size classes, e.g. "size-14". */
  className?: string;
  sizes?: string;
}

/** Demo photo of an exercise. Falls back to a drawn tile when there is no photo or it fails to load. */
export function ExerciseThumb({ src, name, muscle, className, sizes = "64px" }: ExerciseThumbProps) {
  const [failed, setFailed] = useState(false);
  const t = useT();

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${name}, ${muscleLabel(t, muscle)}`}
        className={cn("flex shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground", className)}
      >
        <Dumbbell className="size-1/2" strokeWidth={1.8} />
      </div>
    );
  }

  return (
    <div className={cn("ink-photo relative shrink-0 overflow-hidden rounded-xl", className)}>
      <Image
        src={cdnUrl(src)}
        alt={name}
        fill
        sizes={sizes}
        unoptimized
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/** Overlapping stack of thumbnails (dashboard hero, workout hub). */
export function ThumbStack({
  images,
  muscle,
  className,
}: {
  images: readonly string[];
  muscle: MuscleGroup;
  className?: string;
}) {
  if (images.length === 0) return null;
  return (
    <div className={cn("flex -space-x-5", className)} aria-hidden>
      {images.map((src, index) => (
        <div key={src} className="relative rounded-xl ring-4 ring-card" style={{ zIndex: images.length - index }}>
          <ExerciseThumb src={src} name="" muscle={muscle} className="size-16" sizes="64px" />
        </div>
      ))}
    </div>
  );
}
