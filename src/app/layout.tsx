import type { Metadata, Viewport } from "next";
import { Archivo, Barlow_Condensed } from "next/font/google";
import { Providers } from "@/components/providers";
import { getI18n } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import "./globals.css";

const sans = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display-face", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: { default: "Fitapp", template: "%s · Fitapp" }, description: t("meta.description") };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1030" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getI18n();
  return (
    <html lang={locale} suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-dvh antialiased">
        <Providers locale={locale} messages={MESSAGES[locale]}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
