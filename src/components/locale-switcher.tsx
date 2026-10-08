"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n/config";
import { setLocaleAction } from "@/lib/i18n/actions";
import { useLocale, useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Language switcher: used on Profile and on the sign-in page. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const current = useLocale();
  const t = useT();
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
    });
  }

  return (
    <div role="radiogroup" aria-label={t("common.language")} className={cn("grid grid-cols-2 gap-1 rounded-xl bg-muted p-1", className)} aria-busy={pending}>
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          role="radio"
          aria-checked={locale === current}
          lang={locale}
          onClick={() => choose(locale)}
          className={cn(
            "h-11 rounded-lg text-sm font-semibold transition-colors",
            locale === current ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
          )}
        >
          {LOCALE_LABEL[locale]}
        </button>
      ))}
    </div>
  );
}
