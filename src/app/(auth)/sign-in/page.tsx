import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="display-xl">Fitapp</h1>
      <p className="mt-2 text-muted-foreground">Log your training and meals in seconds.</p>
      <SignInForm allowSignup={env.ALLOW_SIGNUP} />
    </main>
  );
}
