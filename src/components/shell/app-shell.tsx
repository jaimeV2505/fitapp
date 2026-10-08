import { AppNav } from "./app-nav";

export function AppShell({ children, activeSessionId }: { children: React.ReactNode; activeSessionId: string | null }) {
  return (
    <div className="min-h-dvh md:pl-64">
      <AppNav activeSessionId={activeSessionId} />
      <main className="mx-auto w-full max-w-2xl px-4 pb-36 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] md:max-w-4xl md:px-10 md:pb-16 md:pt-10">
        {children}
      </main>
    </div>
  );
}
