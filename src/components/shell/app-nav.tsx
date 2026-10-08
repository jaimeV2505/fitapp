"use client";

import { motion } from "motion/react";
import { spring } from "@/lib/motion";
import { Dumbbell, House, LineChart, User, Utensils, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** The workout action is the most used one: it gets the raised button on mobile. */
  primary?: boolean;
}

function buildItems(activeSessionId: string | null): NavItem[] {
  return [
    { href: "/", label: "Home", icon: House },
    { href: "/nutrition", label: "Nutrition", icon: Utensils },
    { href: activeSessionId ? `/workout/${activeSessionId}` : "/workout", label: "Workout", icon: Dumbbell, primary: true },
    { href: "/progress", label: "Progress", icon: LineChart },
    { href: "/profile", label: "Profile", icon: User },
  ];
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  const base = href.startsWith("/workout") ? "/workout" : href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function AppNav({ activeSessionId }: { activeSessionId: string | null }) {
  const pathname = usePathname();
  const items = buildItems(activeSessionId);

  return (
    <>
      {/* Mobile: bottom bar */}
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-end justify-between px-3 pt-2 pb-2">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            if (item.primary) {
              return (
                <li key={item.label} className="flex-1">
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className="relative -mt-8 mx-auto flex size-16 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-card"
                  >
                    <motion.span className="flex items-center justify-center" whileTap={{ scale: 0.88, rotate: -8 }} transition={spring.snappy}>
                      <Icon className="size-7" strokeWidth={2.2} />
                    </motion.span>
                    {activeSessionId ? (
                      <span className="absolute -right-0.5 -top-0.5 flex size-3.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                        <span className="relative inline-flex size-3.5 rounded-full border-2 border-card bg-success" />
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.label} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <motion.span
                    className="flex flex-col items-center gap-0.5"
                    whileTap={{ scale: 0.88 }}
                    animate={{ y: active ? -1 : 0 }}
                    transition={spring.snappy}
                  >
                    <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                    {item.label}
                  </motion.span>
                  {active ? (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute -top-1 h-0.5 w-6 rounded-full bg-primary"
                      transition={spring.layout}
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: side rail */}
      <nav aria-label="Main" className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-1 border-r border-border bg-card p-4 md:flex">
        <p className="display-lg px-3 py-4">Fitapp</p>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 items-center gap-3 rounded-2xl px-3 text-base font-medium transition-colors",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60",
                item.primary && !active && "text-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
              {item.label}
              {item.primary && activeSessionId ? <span className="ml-auto size-2 rounded-full bg-success" /> : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
