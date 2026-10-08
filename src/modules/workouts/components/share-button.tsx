"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { renderShareCard, shareOrDownload, type ShareCardData } from "@/lib/share-card";
import { useT } from "@/lib/i18n/client";

/** Builds the workout image on the device and opens the share sheet (or downloads it on desktop). */
export function ShareButton({ data, fileName }: { data: ShareCardData; fileName: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function share() {
    setBusy(true);
    try {
      const blob = await renderShareCard(data);
      await shareOrDownload(blob, fileName, data.title);
    } catch {
      toast.error(t("share.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" size="lg" className="w-full" onClick={share} disabled={busy}>
      <Share2 className="size-5" /> {busy ? t("share.working") : t("share.button")}
    </Button>
  );
}
