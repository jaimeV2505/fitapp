"use client";

import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/client";
import { isSoundEnabled, playClack, setSoundEnabled, subscribeSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

/** Off by default. Turning it on plays the sound once so you know what to expect. */
export function SoundToggle() {
  const t = useT();
  // The server cannot know the browser's choice: it renders "off" and the client corrects it without a mismatch.
  const enabled = useSyncExternalStore(subscribeSound, isSoundEnabled, () => false);

  function toggle() {
    const next = !enabled;
    setSoundEnabled(next);
    if (next) playClack();
  }

  return (
    <button type="button" role="switch" aria-checked={enabled} onClick={toggle} className="flex w-full items-center justify-between gap-4 text-left">
      <span>
        <span className="block font-semibold">{t("sound.title")}</span>
        <span className="block text-sm text-muted-foreground">{t("sound.hint")}</span>
      </span>
      <span aria-hidden className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors", enabled ? "bg-primary" : "bg-muted")}>
        <span className={cn("absolute top-1 size-6 rounded-full bg-background shadow transition-transform", enabled ? "translate-x-7" : "translate-x-1")} />
      </span>
    </button>
  );
}
