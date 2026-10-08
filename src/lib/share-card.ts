/**
 * Draws a shareable image (1080 x 1350, the portrait ratio of Instagram and WhatsApp status) with the Canvas API:
 * no screenshot library, so nothing to install and it works offline. Client-side only.
 */
export interface ShareCardData {
  title: string;
  subtitle: string;
  stats: { label: string; value: string }[];
  /** Up to three highlighted records, e.g. "Incline Press · 42.5 kg". */
  records: string[];
  recordsHeading: string;
  /** Printed small at the bottom, e.g. "Logged with Fitapp". */
  footer: string;
}

const W = 1080;
const H = 1350;

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
}

/** Family of the display face as loaded by next/font, with a safe fallback. */
function displayFont(weight: number, size: number): string {
  const family = cssVar("--font-display-face", "Impact");
  return `${weight} ${size}px ${family}, Impact, sans-serif`;
}

function bodyFont(weight: number, size: number): string {
  const family = cssVar("--font-archivo", "system-ui");
  return `${weight} ${size}px ${family}, system-ui, sans-serif`;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function drawPlate(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  const gradient = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  gradient.addColorStop(0, "#fff1a8");
  gradient.addColorStop(0.42, "#f4c531");
  gradient.addColorStop(1, "#b57b00");
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(138,90,0,0.6)";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.66, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.stroke();
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * radius * 0.86, cy + Math.sin(angle) * radius * 0.86);
    ctx.lineTo(cx + Math.cos(angle) * radius * 0.95, cy + Math.sin(angle) * radius * 0.95);
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.fillStyle = "#8a5a00";
  ctx.font = displayFont(800, radius * 0.7);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PR", cx, cy + radius * 0.04);
}

export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  // background: deep ink with a blue glow from above
  ctx.fillStyle = "#0c1030";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -120, 80, W / 2, -120, 900);
  glow.addColorStop(0, "rgba(76,123,234,0.45)");
  glow.addColorStop(1, "rgba(76,123,234,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // engraved hatching, like the hero panels
  ctx.save();
  ctx.strokeStyle = "rgba(238,240,250,0.06)";
  ctx.lineWidth = 2;
  for (let x = -H; x < W; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x + H, 0);
    ctx.stroke();
  }
  ctx.restore();

  // frame
  ctx.strokeStyle = "rgba(244,197,49,0.55)";
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  const hasRecords = data.records.length > 0;
  if (hasRecords) drawPlate(ctx, W / 2, 250, 130);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const titleY = hasRecords ? 520 : 330;
  ctx.fillStyle = "#eef0fa";
  ctx.font = displayFont(800, 150);
  ctx.fillText(fitText(ctx, data.title.toUpperCase(), W - 140), W / 2, titleY);
  ctx.fillStyle = "#9ca4d6";
  ctx.font = bodyFont(600, 40);
  ctx.fillText(fitText(ctx, data.subtitle, W - 140), W / 2, titleY + 70);

  // stats row
  const statsY = titleY + 190;
  const colWidth = (W - 160) / Math.max(data.stats.length, 1);
  data.stats.forEach((stat, index) => {
    const cx = 80 + colWidth * index + colWidth / 2;
    ctx.fillStyle = "#f4c531";
    ctx.font = displayFont(800, 120);
    ctx.fillText(fitText(ctx, stat.value, colWidth - 20), cx, statsY);
    ctx.fillStyle = "#9ca4d6";
    ctx.font = bodyFont(600, 32);
    ctx.fillText(stat.label.toUpperCase(), cx, statsY + 56);
  });

  // records
  if (hasRecords) {
    const listY = statsY + 190;
    ctx.fillStyle = "#f4c531";
    ctx.font = displayFont(700, 52);
    ctx.fillText(data.recordsHeading.toUpperCase(), W / 2, listY);
    ctx.fillStyle = "#eef0fa";
    ctx.font = bodyFont(600, 44);
    data.records.slice(0, 3).forEach((line, index) => {
      ctx.fillText(fitText(ctx, line, W - 160), W / 2, listY + 70 + index * 66);
    });
  }

  ctx.fillStyle = "rgba(156,164,214,0.9)";
  ctx.font = displayFont(700, 46);
  ctx.fillText("FITAPP", W / 2, H - 120);
  ctx.font = bodyFont(500, 30);
  ctx.fillText(data.footer, W / 2, H - 75);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image"))), "image/png");
  });
}

/** Shares the image with the system share sheet when files are supported (phones), otherwise downloads it. */
export async function shareOrDownload(blob: Blob, fileName: string, title: string): Promise<"shared" | "downloaded"> {
  const file = new File([blob], `${fileName}.png`, { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "shared";
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.png`;
  link.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
