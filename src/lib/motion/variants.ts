import type { Transition, Variants } from "motion/react";
import { distance, duration, ease, spring } from "./tokens";

/** Fade + short rise. The default entrance for blocks of content. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: distance.base },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, y: -distance.small, transition: { duration: duration.fast, ease: ease.in } },
};

/** Entrance for things that were caused by a tap: small scale + fade. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: spring.pop },
  exit: { opacity: 0, scale: 0.9, transition: { duration: duration.instant } },
};

/** Horizontal swap between steps (the next set slides in from the right). */
export const slideSwap: Variants = {
  enter: { opacity: 0, x: distance.base },
  center: { opacity: 1, x: 0, transition: { duration: duration.base, ease: ease.out } },
  leave: { opacity: 0, x: -distance.base, transition: { duration: duration.fast, ease: ease.in } },
};

/** Parent of a staggered list. Keep stagger short so long lists never feel slow. */
export function staggerContainer(step = 0.045, delay = 0.02): Variants {
  return { hidden: {}, show: { transition: { staggerChildren: step, delayChildren: delay } } };
}

export const listItem: Variants = {
  hidden: { opacity: 0, y: distance.base },
  show: { opacity: 1, y: 0, transition: spring.smooth },
};

/** Height-auto expand/collapse for accordions. */
export const collapse: Variants = {
  closed: { height: 0, opacity: 0, transition: { duration: duration.base, ease: ease.inOut } },
  open: { height: "auto", opacity: 1, transition: { duration: duration.base, ease: ease.out } },
};

/** Press feedback shared by every tappable surface. */
export const press = {
  whileTap: { scale: 0.97 },
  transition: spring.snappy,
} satisfies { whileTap: { scale: number }; transition: Transition };

/** Subtle hover lift, only for devices that really hover (not touch). */
export const hoverLift = {
  whileHover: { y: -1 },
  transition: spring.snappy,
} satisfies { whileHover: { y: number }; transition: Transition };
