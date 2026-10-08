const RAW_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/";
const CDN_BASE = "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/";

/**
 * Exercise photos are stored with their GitHub address. raw.githubusercontent.com is not a CDN (slow,
 * rate-limited), so serve the very same files through jsDelivr, which caches them worldwide.
 */
export function cdnUrl(url: string): string {
  return url.startsWith(RAW_BASE) ? CDN_BASE + url.slice(RAW_BASE.length) : url;
}
