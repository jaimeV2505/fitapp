"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { useT } from "@/lib/i18n/client";

type Mode = "sign-in" | "sign-up";

const fieldClass =
  "h-14 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

export function SignInForm({ allowSignup }: { allowSignup: boolean }) {
  const router = useRouter();
  const t = useT();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();
    setError(null);

    startTransition(async () => {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name: name || email.split("@")[0] || t("auth.defaultName") });
      if (result.error) {
        setError(result.error.message ?? t("auth.failed"));
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-3">
      {mode === "sign-up" ? (
        <input name="name" type="text" autoComplete="name" placeholder={t("auth.name")} className={fieldClass} />
      ) : null}
      <input name="email" type="email" required autoComplete="email" placeholder={t("auth.email")} className={fieldClass} />
      <input
        name="password"
        type="password"
        required
        minLength={10}
        autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
        placeholder={mode === "sign-up" ? t("auth.passwordNew") : t("auth.password")}
        className={fieldClass}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? t("auth.oneMoment") : mode === "sign-in" ? t("auth.signIn") : t("auth.createAccount")}
      </Button>
      {allowSignup ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError(null);
          }}
        >
          {mode === "sign-in" ? t("auth.createAnAccount") : t("auth.haveAccount")}
        </Button>
      ) : null}
    </form>
  );
}
