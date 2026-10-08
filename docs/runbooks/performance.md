# Performance runbook

## First thing to check: regions

Every page does several database queries. If the functions and the database are on different continents, each query pays that round trip (about 100 ms from Stockholm to Virginia, ten times per page).

- **Database region**: Neon (or the Vercel Storage tab) shows it. Neon through Vercel defaults to US East.
- **Function region**: Vercel project -> Settings -> Functions -> Function Region (`vercel.json` no longer forces one). Set it to the database's region (for US East, `iad1`), or move the database near you (for Stockholm, Frankfurt `fra1` is closest).

## What the code already does

- Settings are read once per request (`findUserSettings` is wrapped in React's per-request cache) and the account check reuses it.
- The home page renders its header immediately and streams each card inside its own `Suspense` boundary.
- Exercise photos load from the jsDelivr CDN; the exercise detail sheet and the charts (recharts) are loaded lazily.
- Heavy packages are import-optimised (`optimizePackageImports`).

## Measuring

- Vercel -> Logs/Observability: duration of each function call. A page that takes ~1 s with a handful of queries points at region latency.
- Browser DevTools -> Network: the document request's "Waiting for server response" (server time) vs. later requests (images, JS).
- `GET /api/health` is the cheapest database round trip: if it alone takes 100+ ms, it is latency, not code.
- Vercel Speed Insights gives real-user numbers per page once enabled.

## If it is still slow after fixing the region

1. Check cold starts (first request after idle) vs. warm ones.
2. Look for pages that await several queries in sequence; wrap independent sections in `Suspense` or run them with `Promise.all`.
3. Keep the connection pool small on serverless (`max: 5` in `lib/db/client.ts`) and use the pooled connection string for the app.
