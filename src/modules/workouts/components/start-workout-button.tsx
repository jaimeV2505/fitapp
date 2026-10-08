"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { startWorkoutAction } from "../actions";

interface StartWorkoutButtonProps extends Pick<ButtonProps, "variant" | "size" | "className"> {
  dayId: string;
  /** When a workout is already running, the button resumes it instead of starting another. */
  activeSessionId: string | null;
  label: string;
}

export function StartWorkoutButton({ dayId, activeSessionId, label, variant, size, className }: StartWorkoutButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (activeSessionId) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <Link href={`/workout/${activeSessionId}`}>Resume workout</Link>
      </Button>
    );
  }

  function start() {
    setError(null);
    startTransition(async () => {
      const result = await startWorkoutAction({ dayId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/workout/${result.data.sessionId}`);
      router.refresh();
    });
  }

  return (
    <div className={className}>
      <Button onClick={start} disabled={pending} variant={variant} size={size} className="w-full">
        {pending ? "Starting…" : label}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
