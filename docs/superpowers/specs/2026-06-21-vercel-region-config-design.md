# Design: vercel.json Region + Timeout Config

## Problem

Vercel functions default to a random region and 10-second timeout. The upload
function needs up to 60 seconds (chunk + embed + extract pipeline), and all
functions benefit from running in `iad1` (US East / Virginia) — the same AWS
region as the Aurora RDS cluster — to minimise DB connection latency.

## Solution

Add `vercel.json` at the project root (approach B from brainstorming).

## File

**`recall/vercel.json`**

```json
{
  "regions": ["iad1"],
  "functions": {
    "src/app/api/upload/route.ts": {
      "maxDuration": 60
    }
  }
}
```

- `regions: ["iad1"]` — pins all functions to US East, co-located with Aurora
- `maxDuration: 60` on the upload route — matches the existing in-route declaration; explicit here for visibility
- All other routes keep the default 10-second timeout (sufficient for simple DB reads)

## What stays unchanged

- `export const maxDuration = 60` in `src/app/api/upload/route.ts` — harmless to keep both; Vercel takes the lower of the two if they differ, but they match here
- No other routes or files are touched

## Success criteria

- `/api/health` returns `status: ok` with the Aurora host in the `iad1` region
- Upload of a full transcript completes without a 504/timeout on Vercel
