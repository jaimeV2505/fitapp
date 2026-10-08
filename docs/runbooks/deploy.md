# Deploy runbook: GitHub -> Vercel

Target: a **private** GitHub repository, Vercel for hosting, a managed Postgres (Neon via the Vercel Marketplace is the easiest), Vercel Blob for food photos.

## 0. Before the first push (on your machine)

The Docker app container has every dependency installed, so run the checks there. `next build` (which Vercel runs) fails on type errors, so fix them first.

```
docker compose exec app pnpm typecheck
docker compose exec app pnpm lint
docker compose exec app pnpm test
```

Also confirm these files exist and will be committed: `pnpm-lock.yaml` and `drizzle/` (migrations).

## 1. GitHub

```
cd ~/Downloads/fitapp
git init -b main
git add .
git ls-files | grep -E '(^|/)\.env($|\.)'      # must print only .env.example
git ls-files | grep -E '^(backups|node_modules|\.data|\.pnpm-store|\.next)/' # must print nothing
git ls-tree -r --name-only HEAD | cut -d/ -f1 | sort | uniq -c | sort -rn | head   # sanity: top-level folders and file counts
git commit -m "Initial commit"
```

Create the repository (private) and push, either with the GitHub CLI

```
gh repo create fitapp --private --source=. --remote=origin --push
```

or on github.com (New repository, private, no README) and then

```
git remote add origin git@github.com:<you>/fitapp.git
git push -u origin main
```

The CI workflow (`.github/workflows/ci.yml`) starts running on that first push.

## 2. Database

In Vercel, after importing the project (step 3): **Storage -> Create -> Neon (Postgres)** and connect it to the project. Pick the same region for the functions and the database (Settings -> Functions -> Function Region); mismatched regions make every page slow. See `performance.md`. It adds the connection strings, named either `DATABASE_URL` / `DATABASE_URL_UNPOOLED` or `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` depending on the integration settings. The app and migrations accept both; migrations prefer the direct (unpooled) one.

## 3. Vercel project

1. vercel.com -> **Add New -> Project** -> import the GitHub repository. Framework: Next.js. Leave the build and install commands: `vercel.json` sets them.
2. Storage -> **Blob** -> create a store and connect it (adds `BLOB_READ_WRITE_TOKEN`).
3. Environment variables (Production; add the ones marked * to Preview as well):

| Variable | Value |
|----------|-------|
| `BETTER_AUTH_SECRET` * | a new secret: `openssl rand -base64 32` (not the dev one) |
| `BETTER_AUTH_URL` | your production URL, e.g. `https://fitapp.yourdomain.com` (or the `.vercel.app` URL) |
| `ALLOW_SIGNUP` | `true` for the first deploy, then `false` |
| `DEFAULT_TIMEZONE` * | `Europe/Stockholm` |
| `STORAGE_DRIVER` | `vercel-blob` |
| `ANTHROPIC_API_KEY` | your key (food photo estimates) |
| `ANTHROPIC_MODEL` | optional, defaults to `claude-sonnet-5-5` |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BLOB_READ_WRITE_TOKEN` | added by the integrations |

Preview deployments need `DATABASE_URL` (a separate database or Neon branch, never production's) and `BETTER_AUTH_SECRET` to build; they sign in at their own URL automatically.

4. **Deploy.** The production build runs `pnpm db:migrate` then `pnpm db:seed` (idempotent: built-in exercises, foods and the exercise library), then builds.

## 4. After the first deploy

1. Open the site and create your account (registration is open).
2. Set `ALLOW_SIGNUP=false` in Vercel and redeploy, so nobody else can register.
3. Log a set and a meal. Take a food photo. Check Vercel -> Logs if anything fails.
4. Add a custom domain (Settings -> Domains) and update `BETTER_AUTH_URL` to it, then redeploy.

## Ongoing

- Every push to `main` deploys to production; pull requests get preview URLs.
- Schema change: `pnpm db:generate`, commit the new migration with the code. The next production build applies it **before** the new code goes live, so keep migrations backward compatible (add first, remove later; see `database.md`).
- Backups: use the provider's point-in-time recovery plus a scheduled dump (see `database.md`).
- Vercel Hobby is for personal, non-commercial use. Move to Pro before charging users.

## Adding a dependency

The Vercel build installs with `--frozen-lockfile`, so a new dependency in `package.json` needs an updated `pnpm-lock.yaml` **in the same commit**. Run `docker compose exec app pnpm install`, check that `pnpm-lock.yaml` changed, and commit both files. Otherwise the build fails at install.

## Never lose the migrations

The Vercel build needs `drizzle/` (it applies the migrations before publishing). If a commit deletes that folder the deploy fails with `Could not find drizzle/meta/_journal.json`. Protect yourself:

```
git config core.hooksPath .githooks   # once: blocks a push whose last commit lost the migrations
pnpm check:migrations                 # or run the check by hand
```

If it happens: `git checkout $(git log --diff-filter=A --format=%h -n 1 -- drizzle/meta/_journal.json) -- drizzle`, commit and push. Never regenerate a new migration to "fix" it: it would not match the one recorded in the database.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Build fails with a TypeScript error | Run `docker compose exec app pnpm typecheck` locally and fix it. |
| `Could not find drizzle/meta/_journal.json` | The commit being built does not contain the `drizzle/` folder. See "Never lose the migrations". |
| Build fails at `db:check` | The log names the host and the likely cause (wrong password, deleted database, two variables pointing at different databases, unreachable). Fix the variables in Vercel and redeploy. |
| Build fails at `db:migrate:ci` | `drizzle/` not committed, or the database is not connected to the project. Check the build log. |
| Build fails with "Invalid environment configuration" | A required variable is missing for that environment (Preview needs `DATABASE_URL` and `BETTER_AUTH_SECRET`). |
| "Invalid origin" on sign-in | You opened an address that is not `BETTER_AUTH_URL` (no trailing slash, `https://`). The app also trusts Vercel's own addresses for the project; set `BETTER_AUTH_URL` to your main domain and redeploy. |
| Food photo times out | Check `ANTHROPIC_API_KEY`; the page allows 60 s (`maxDuration`). |
| Photos do not load | `STORAGE_DRIVER=vercel-blob` and a connected Blob store are required in production. |
