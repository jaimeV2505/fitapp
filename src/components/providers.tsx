"use client";

import { I18nProvider } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/types";
import { MotionProvider } from "@/lib/motion";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} position="top-center" offset={16} />;
}

export function Providers({ children, locale, messages }: { children: React.ReactNode; locale: Locale; messages: Messages }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {/* One motion config for the app: honours the OS "reduce motion" setting. */}
      <I18nProvider locale={locale} messages={messages}>
        <MotionProvider>
          {children}
          <ThemedToaster />
        </MotionProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
