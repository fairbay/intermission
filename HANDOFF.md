<!-- handoff-meta: { "generated": "2026-04-22T14:00:00Z", "project": "intermission" } -->

# HANDOFF — Intermission

## Current state

- **Live:** https://intermission-one.vercel.app
- **Version:** v0.2 (commit `9f10316` as of handoff date)
- **Vercel project:** `prj_L5ijQFEaUPoq72J5Yn3SzJ4jP78J` under team `fairbays-projects`
- **Deployment status:** READY (verified via Vercel MCP on 2026-04-22)
- **KV persistence:** connected to Baylee's existing Upstash database, key `intermission:state:default`. Verified via `GET /api/state` returns `"persistence":"kv"`.

## What's working

- Phone control page at `/control.html` — manual text, 8 presets, countdown picker (30s/1m/2m/5m), clear-to-black
- TV display page at `/display.html` — fullscreen rendering, 1s polling, wake-lock API, 30-min meta-refresh fallback
- Autopilot — randomized gap (min/max minutes) + duration (min/max seconds) + configurable preset pool
- Compute-on-read scheduling (no cron) — autopilot fires when display polls `/api/state` and `nextFireAt <= now`
- Manual override window — manual scene holds for 5 min before autopilot resumes
- Settings persist across cold starts

## Files

```
/
├── index.html          # landing + instructions
├── control.html        # phone UI (all state in single inline <script>)
├── display.html        # TV UI (fullscreen, polls every 1s)
├── api/state.js        # GET computed scene + schedule, POST scene/clear/schedule actions
├── package.json        # @upstash/redis ^1.34.3
├── vercel.json         # cleanUrls: true
├── README.md           # dev docs
├── USAGE.md            # user guide
└── HANDOFF.md          # this file
```

## Architecture notes

- Single-tenant, single-household. No auth. One global state record in KV.
- Schedule logic is **compute-on-read**: when display polls, server checks if it's time to fire. This means no background worker needed, and if nobody's watching the TV, no interruption fires. Correct behavior.
- State shape: `{ manualMode, manualPayload, manualUntil, schedule: { enabled, gapMinSec, gapMaxSec, durationMinSec, durationMaxSec, presets, nextFireAt, currentBreakEnd, currentBreakText } }`
- Persistence detection: `state.js` checks for `KV_REST_API_URL`/`KV_REST_API_TOKEN` OR `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`. Falls back to module-level memory if neither set (useful for dev).
- `scripts/git_push.py` via git-ops handles all commits.

## Open items

- **Real-world meal test** — Baylee hasn't live-tested yet. Preset copy is a guess; tuning happens after 2-3 meals of real use.
- **Frame TV browser reliability** — unverified whether Samsung Tizen browser holds `display.html` long enough, or if it times out. Fallback is AirPlay-mirror from a spare iPad running the page in Safari. Find out after first live test.

## What needs doing next (prioritized)

### Tier 1 — only if test surfaces issues

1. **If Tizen browser fails:** document the AirPlay fallback clearly, add to USAGE.md troubleshooting.
2. **If presets feel wrong:** update the hardcoded list in `control.html` (`PRESETS` const) and the default pool in `api/state.js` (`DEFAULT_STATE().schedule.presets`).
3. **If timing feels off:** adjust defaults — currently 10-20 min gap, 8-15 sec duration.

### Tier 2 — v1 polish after test confirms core works

1. **Editable presets** — let user curate the manual preset grid in the UI, persist to KV.
2. **Preset emoji/styling** — let scenes be more than text (background color, emoji, countdown style).
3. **Sound on break** — optional chime when autopilot fires.

### Tier 3 — v2 ambitious

1. **SmartThings source-switch** — on scene push, swap TV input so whatever streamer is running auto-pauses. Requires SmartThings API integration + the Samsung Frame user's token.
2. **Siri Shortcut trigger** — `"Hey Siri, intermission dance break"` fires a scene without opening the controller.
3. **Ambient generated visuals** — Claude API generates scene backgrounds from a prompt; runs on a loop during focus-mode breaks.
4. **Scheduling layer** — auto-enable autopilot at 5pm, auto-disable at 8pm. Rules like "weekends only" or "30min before bedtime."

## Session learnings

- Vercel MCP is read-mostly — cannot provision storage or set env vars. Use dashboard deep-links like `vercel.com/fairbays-projects/intermission/stores` for those. (Encoded in memory #20.)
- Compute-on-read scheduling is a clean pattern for "background" features that shouldn't fire when nobody's watching — no cron, no worker, just a tick check on each poll.
- Connect an existing KV database instead of creating new ones for small-state projects. Namespace via key prefix. (Applies generally.)

## Vault entry

- `fairbay/idea-vault/archive/intermission.md`
- Status: `building`
- Verdict: `Public Good`
- Scores: Impact 59% / Business 41% / Sustainability 86%

## How to continue

If picking this up in a new chat:
1. Read this file first.
2. Current status via `GET https://intermission-one.vercel.app/api/state` — should return `"persistence":"kv"`.
3. Runtime logs accessible via Vercel MCP `get_runtime_logs` with `projectId=prj_L5ijQFEaUPoq72J5Yn3SzJ4jP78J`, `teamId=team_hDPlehxYhRW7Hrq8ddre65Qg`.
4. Push changes via git-ops to `fairbay/intermission`, main branch. Vercel auto-deploys.
