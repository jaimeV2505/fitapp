import type { en } from "./messages/en";

type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };

/** Every language must provide exactly the keys of the English dictionary: a missing key is a compile error. */
export type Messages = DeepString<typeof en>;

type Paths<T> = { [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}` }[keyof T & string];

/** Dotted path of any message (namespace.key). Typos are compile errors. */
export type MessageKey = Paths<typeof en>;
