import type { Locale } from "../config";
import type { Messages } from "../types";
import { en } from "./en";
import { es } from "./es";

export const MESSAGES: Record<Locale, Messages> = { en, es };
