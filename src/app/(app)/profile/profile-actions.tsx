"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const THEMES: { value: string; label: MessageKey }[] = [
  { value: "system", label: "profile.system" },
  { value: "light", label: "profile.light" },
  { value: "dark", label: "profile.dark" },
];

export function ProfileActions() {
  const router = useRouter();
  const t = useT();
  const { theme, setTheme } = useTheme();
  // next-themes only knows the stored theme on the client; avoid a hydration mismatch.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <>
      <Card className="p-6">
        <p className="mb-3 font-semibold">{t("profile.appearance")}</p>
        <div role="radiogroup" aria-label={t("profile.theme")} className="grid grid-cols-3 gap-2 rounded-2xl bg-muted p-1">
          {THEMES.map((option) => {
            const selected = mounted && theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "h-11 rounded-xl text-sm font-semibold transition-colors",
                  selected ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
                )}
              >
                {t(option.label)}
              </button>
            );
          })}
        </div>
      </Card>
      <Button variant="secondary" size="lg" onClick={signOut} disabled={signingOut}>
        {signingOut ? t("profile.signingOut") : t("profile.signOut")}
      </Button>
    </>
  );
}
