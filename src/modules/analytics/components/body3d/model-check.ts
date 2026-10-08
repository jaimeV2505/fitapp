const checks = new Map<string, Promise<boolean>>();

/** Whether a model file exists at `url`. One request per page, remembered. A missing file is not an error. */
export function modelExists(url: string): Promise<boolean> {
  let check = checks.get(url);
  if (!check) {
    check = fetch(url, { method: "HEAD" })
      .then((response) => response.ok && !(response.headers.get("content-type") ?? "").includes("text/html"))
      .catch(() => false);
    checks.set(url, check);
  }
  return check;
}
