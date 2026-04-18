# Intermission

A phone-controlled TV canvas for parent-directed engagement moments. Push big text, countdowns, and preset scenes to the TV while kids are watching — break attention gently, re-engage, then clear and let them resume.

**v0 scope:** text-to-TV loop, preset scene library (8 scenes), countdown timer, clear-to-black.

## Setup

1. Deploy to Vercel (this repo has no build step).
2. Open the live URL on TV and phone:
   - **TV:** load `<url>/display.html` in the Frame's browser, or AirPlay-mirror it from a spare iPad.
   - **Phone:** load `<url>/control.html`.
3. Tap a preset or type text. TV updates in under a second.

## State

v0 uses a module-level variable on the serverless function. Works perfectly for active demos but resets when the function goes cold (~15 min idle). To make state durable, add Upstash KV env vars and swap the handler in `api/state.js`.

## Design constraints

- No recording, no feed, no export — ever.
- Text defaults to 300pt+ on a 65" panel. If kids can read it from across the room without leaning in, it's not big enough.
- Source takeover is the primary pause mechanism (v1.5).
- Scene library leans playful, not policing.

## License

Personal use. No warranty.
