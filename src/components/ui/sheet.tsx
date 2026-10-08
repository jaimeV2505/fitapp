"use client";

import { Drawer } from "vaul";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  /** Pinned under the scrolling content (primary action). */
  footer?: React.ReactNode;
}

/** Bottom sheet used for every form and picker: drag to dismiss, scrolls inside, footer stays visible. */
export function Sheet({ open, onOpenChange, title, children, footer }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[94dvh] w-full max-w-xl flex-col rounded-t-2xl border border-b-0 border-border bg-background outline-none"
          aria-describedby={undefined}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" aria-hidden />
          <Drawer.Title className="display-lg px-5 pb-3 pt-4">{title}</Drawer.Title>
          <div className="overflow-y-auto px-5 pb-6" data-vaul-no-drag>
            {children}
          </div>
          {footer ? <div className="pb-safe shrink-0 border-t border-border bg-background px-5 py-3">{footer}</div> : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
