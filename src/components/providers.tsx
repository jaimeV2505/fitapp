"use client";

import { MotionProvider } from "@/lib/motion";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} position="top-center" offset={16} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {/* One motion config for the app: honours the OS "reduce motion" setting. */}
      <MotionProvider>
        {children}
        <ThemedToaster />
      </MotionProvider>
    </ThemeProvider>
  );
}
