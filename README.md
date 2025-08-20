# Twitter → RSS Proxy (Edge)

Self-hosted, free, resilient per-handle RSS with mirror rotation + short caching.

## Endpoints
- `/x/:handle` → per-handle RSS (recommended)
- `/list/:id`  → Twitter list RSS (best-effort)

## Add/replace mirrors
Edit arrays in `api/x/[handle].ts` and `api/list/[id].ts`, then redeploy.

## Notes
- RSS may download as a file in your browser; that's expected.
- CORS is open; works in Sheets, browsers, feed readers.
