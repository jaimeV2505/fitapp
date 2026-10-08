import Link from "next/link";
import { Search } from "lucide-react";
import { z } from "zod";
import { MUSCLE_GROUPS } from "@/lib/db/schema/enums";
import { MUSCLE_LABEL } from "@/lib/muscles";
import { cn } from "@/lib/utils";
import { LibraryList } from "@/modules/exercises/components/library-list";
import { browseExercises } from "@/modules/exercises/service";
import { requireAppUser } from "@/modules/users/app-user";

export const metadata = { title: "Exercise library" };

const paramsSchema = z.object({
  q: z.string().trim().max(60).optional(),
  muscle: z.enum(MUSCLE_GROUPS).optional(),
});

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireAppUser();
  const parsed = paramsSchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : {};
  const items = await browseExercises(user.id, { query: filters.q || undefined, muscle: filters.muscle });

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors",
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
    );

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-muted-foreground">Photos, muscles and how-to for every exercise</p>
        <h1 className="display-xl mt-1">Library</h1>
      </header>

      <form action="/library" className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search exercises"
          aria-label="Search exercises"
          className="h-12 w-full rounded-xl bg-input pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-ring"
        />
        {filters.muscle ? <input type="hidden" name="muscle" value={filters.muscle} /> : null}
      </form>

      <nav aria-label="Filter by muscle" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={filters.q ? `/library?q=${encodeURIComponent(filters.q)}` : "/library"} className={chip(!filters.muscle)}>
          All
        </Link>
        {MUSCLE_GROUPS.map((muscle) => (
          <Link
            key={muscle}
            href={`/library?muscle=${muscle}${filters.q ? `&q=${encodeURIComponent(filters.q)}` : ""}`}
            className={chip(filters.muscle === muscle)}
          >
            {MUSCLE_LABEL[muscle]}
          </Link>
        ))}
      </nav>

      <LibraryList items={items} />
      {items.length === 60 ? <p className="text-center text-sm text-muted-foreground">Showing the first 60. Refine your search to see more.</p> : null}
    </div>
  );
}
