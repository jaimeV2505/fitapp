#!/bin/sh
# Fails if the database migrations are missing on disk, not tracked by git, or absent from the last commit.
# Without drizzle/ in the repository the Vercel build cannot migrate the database and the deploy fails.
#   pnpm check:migrations        (also runs automatically before every `git push`, see .githooks/pre-push)
set -eu

JOURNAL="drizzle/meta/_journal.json"

if [ ! -f "$JOURNAL" ]; then
  echo "ERROR: $JOURNAL is missing on disk."
  echo "Restore the files from git history:"
  echo "  git checkout \$(git log --diff-filter=A --format=%h -n 1 -- $JOURNAL) -- drizzle"
  exit 1
fi

if ! git ls-files --error-unmatch "$JOURNAL" >/dev/null 2>&1; then
  echo "ERROR: $JOURNAL exists but git does not track it. Add it with: git add -f drizzle"
  exit 1
fi

if git rev-parse --verify HEAD >/dev/null 2>&1 && ! git cat-file -e "HEAD:$JOURNAL" 2>/dev/null; then
  echo "ERROR: the last commit does not contain $JOURNAL (a commit deleted it)."
  echo "Restore and commit it:"
  echo "  git checkout \$(git log --diff-filter=A --format=%h -n 1 -- $JOURNAL) -- drizzle"
  echo "  git commit -m \"Restore database migrations\""
  exit 1
fi

echo "OK: migrations present ($(git ls-files drizzle | wc -l | tr -d ' ') files tracked)."
