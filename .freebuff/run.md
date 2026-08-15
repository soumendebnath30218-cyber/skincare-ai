# Run doc — skincare-ai

## Reproduce the artifacts a fresh checkout needs
- This workspace IS the main checkout (`D:\skincare-ai`) — there is no separate worktree, so nothing needs copying.
- `.env.local` is already present in the repo root (contains `NEXT_PUBLIC_SUPABASE_URL`, Clerk keys, etc.). Do NOT commit it; a fresh clone must copy it from the main checkout.
- Install dependencies with the project's package manager (npm — see `package-lock.json`): `npm install`.

## How to run the server
- Dev server: `npm run dev` (Next.js 16, default port **3000**).
- If port 3000 is already in use, pick a free port and pass it explicitly: `npm run dev -- -p <port>`.
- Detach on Windows via PowerShell (stdout/stderr to different files):
  ```powershell
  powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput 'D:\skincare-ai\.freebuff\dev.log' -RedirectStandardError 'D:\skincare-ai\.freebuff\dev.log.err' -WindowStyle Hidden -PassThru).Id"
  ```
- Verify: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → expect `200`.

## Current state (Aug 15, 2026)
- A dev server was already serving this project on port 3000 (pid 21940) when the preview was registered; the preview uses that URL directly rather than starting a second instance.
- All bug fixes are committed (`ccdaf55`).
