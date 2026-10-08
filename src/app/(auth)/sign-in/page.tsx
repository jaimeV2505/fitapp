import { redirect } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { titleOf } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";
import { SignInForm } from "./sign-in-form";

export const generateMetadata = titleOf("auth.signIn");

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/");
  const t = await getT();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="display-xl">Fitapp</h1>
      <p className="mt-2 text-muted-foreground">{t("auth.tagline")}</p>
      <SignInForm allowSignup={env.ALLOW_SIGNUP} />
      <LocaleSwitcher className="mt-10" />
    </main>
  );
}
