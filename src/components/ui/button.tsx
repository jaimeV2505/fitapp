import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-[transform,background-color,opacity] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-[inset_0_-3px_0_color-mix(in_oklab,black_20%,transparent)] hover:opacity-90 active:translate-y-px active:shadow-none",
        secondary: "bg-muted text-foreground hover:bg-border",
        ghost: "text-foreground hover:bg-muted",
        success: "bg-success text-[#06210f] shadow-[inset_0_-3px_0_color-mix(in_oklab,black_20%,transparent)] hover:opacity-90 active:translate-y-px active:shadow-none",
        destructive: "bg-destructive text-white hover:opacity-90",
      },
      size: {
        md: "h-12 px-5 text-base",
        lg: "h-14 px-6 font-display text-2xl font-bold uppercase tracking-wide",
        sm: "h-10 px-4 text-sm",
        icon: "size-12",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
