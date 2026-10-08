import type { Metadata } from "next";
import { getT } from "./server";
import type { MessageKey } from "./types";

/** `export const generateMetadata = titleOf("nav.workout");` gives a page a translated title. */
export function titleOf(key: MessageKey): () => Promise<Metadata> {
  return async () => ({ title: (await getT())(key) });
}
