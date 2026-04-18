# Intermission

Phone-controlled TV canvas for parent-directed engagement moments. Push big text, countdowns, and preset scenes from your phone to your TV. Works alongside whatever your kids are watching — open the display page in the Frame's browser or AirPlay-mirror it from a spare device.

**Live demo:** https://intermission-one.vercel.app/

## What's in v0.2

- Manual scenes: text input, 8 presets, countdown timer, clear-to-black
- **Autopilot** — set it once, gentle interruptions on a randomized schedule
  - Gap between breaks (min/max in minutes — random within range each cycle)
  - Break duration (min/max in seconds)
  - Preset pool (curate which scenes autopilot can pick from)
  - Live status: next break ETA shown on phone
- Upstash KV persistence — settings survive cold starts

## Routes

- `/` — landing
- `/control.html` — phone UI (manual + autopilot config)
- `/display.html` — TV UI (fullscreen, polls every 1s)
- `/api/state` — GET computed scene + schedule status, POST actions

## State model

Single household, single state record. Manual scene overrides autopilot for 5 minutes after each push (then schedule resumes). Schedule fires on read — when GET `/api/state` is called and `nextFireAt <= now`, server picks a random preset, sets `currentBreakEnd`, computes next `nextFireAt`. No cron job needed.

## Persistence

Uses `@upstash/redis` with `Redis.fromEnv()`. Picks up either:
- `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Vercel Marketplace integration)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (direct Upstash dashboard)

Falls back to module-level memory if neither set — works for active demo, settings reset on cold start.

KV writes only happen on state transitions (autopilot fires, settings update, manual push). KV reads only on cold start. Free tier covers this 100x over.

## Design constraints

- No recording, no feed, no export — ever.
- Text defaults to 300pt+ on a 65" panel.
- Source takeover for true pause is v1.5 (requires SmartThings).

## License

Personal use. No warranty.
