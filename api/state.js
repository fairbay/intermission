// Intermission state API.
// GET  /api/state  -> computed scene + schedule status (display + control poll)
// POST /api/state  -> { action: "scene" | "clear" | "schedule", ... }
//
// Persistence: Upstash KV via Redis.fromEnv() (works with Vercel Marketplace
// "KV_REST_API_URL/KV_REST_API_TOKEN" or upstream "UPSTASH_REDIS_REST_URL/TOKEN").
// Falls back to module-level memory if no env vars (works for active demo, lost on cold start).

import { Redis } from "@upstash/redis";

const KEY = "intermission:state:default";
const MANUAL_HOLD_MS = 5 * 60 * 1000; // manual scene shows for 5 min then schedule may resume

const DEFAULT_STATE = () => ({
  // Manual scene (overrides schedule while active)
  manualMode: "black",
  manualPayload: "",
  manualUntil: 0,
  // Schedule
  schedule: {
    enabled: false,
    gapMinSec: 600,        // 10 min
    gapMaxSec: 1200,       // 20 min
    durationMinSec: 8,
    durationMaxSec: 15,
    presets: ["3 MORE BITES", "EYES UP", "TAKE A SIP", "DANCE BREAK"],
    nextFireAt: 0,
    currentBreakText: "",
    currentBreakEnd: 0,
  },
});

// --- Persistence layer (lazy redis init) ---
let _redis = null;
let _redisChecked = false;
function getRedis() {
  if (_redisChecked) return _redis;
  _redisChecked = true;
  try {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) _redis = new Redis({ url, token });
  } catch (e) { /* no-op */ }
  return _redis;
}

let cachedState = null;

async function loadState() {
  if (cachedState) return cachedState;
  const redis = getRedis();
  if (redis) {
    try {
      const stored = await redis.get(KEY);
      cachedState = stored ? mergeWithDefaults(stored) : DEFAULT_STATE();
    } catch (e) {
      cachedState = DEFAULT_STATE();
    }
  } else {
    cachedState = DEFAULT_STATE();
  }
  return cachedState;
}

async function saveState(s) {
  cachedState = s;
  const redis = getRedis();
  if (redis) {
    try { await redis.set(KEY, s); } catch (e) { /* swallow — keep memory copy */ }
  }
}

function mergeWithDefaults(s) {
  const d = DEFAULT_STATE();
  return {
    ...d,
    ...s,
    schedule: { ...d.schedule, ...(s.schedule || {}) },
  };
}

// --- Helpers ---
function randInt(min, max) {
  if (max < min) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clampNum(n, lo, hi, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(hi, Math.max(lo, v));
}

// --- Schedule tick (compute-on-read) ---
async function tickSchedule(state) {
  const now = Date.now();
  if (!state.schedule.enabled) return false;
  if (state.schedule.currentBreakEnd > now) return false; // still in break
  if (state.schedule.nextFireAt > now) return false;     // not yet
  if (!state.schedule.presets || state.schedule.presets.length === 0) return false;

  const text = pickRandom(state.schedule.presets);
  const dur = randInt(state.schedule.durationMinSec, state.schedule.durationMaxSec) * 1000;
  const gap = randInt(state.schedule.gapMinSec, state.schedule.gapMaxSec) * 1000;
  state.schedule.currentBreakText = text;
  state.schedule.currentBreakEnd = now + dur;
  state.schedule.nextFireAt = state.schedule.currentBreakEnd + gap;
  await saveState(state);
  return true;
}

// --- Compute the scene the display should show ---
function computeScene(state) {
  const now = Date.now();
  if (state.manualUntil > now) {
    return { mode: state.manualMode, payload: state.manualPayload };
  }
  if (state.schedule.enabled && state.schedule.currentBreakEnd > now) {
    return { mode: "text", payload: state.schedule.currentBreakText };
  }
  return { mode: "black", payload: "" };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const state = await loadState();

  if (req.method === "GET") {
    await tickSchedule(state);
    const scene = computeScene(state);
    return res.status(200).json({
      ...scene,
      ts: Date.now(),
      manualUntil: state.manualUntil,
      schedule: {
        enabled: state.schedule.enabled,
        gapMinSec: state.schedule.gapMinSec,
        gapMaxSec: state.schedule.gapMaxSec,
        durationMinSec: state.schedule.durationMinSec,
        durationMaxSec: state.schedule.durationMaxSec,
        presets: state.schedule.presets,
        nextFireAt: state.schedule.nextFireAt,
        currentBreakEnd: state.schedule.currentBreakEnd,
        currentBreakText: state.schedule.currentBreakText,
      },
      persistence: getRedis() ? "kv" : "memory",
    });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const action = body.action;
    const now = Date.now();

    if (action === "scene") {
      if (!["text", "countdown", "black"].includes(body.mode)) {
        return res.status(400).json({ error: "invalid mode" });
      }
      state.manualMode = body.mode;
      state.manualPayload = body.payload == null ? "" : String(body.payload);
      state.manualUntil = now + MANUAL_HOLD_MS;
      await saveState(state);
      return res.status(200).json({ ok: true });
    }

    if (action === "clear") {
      state.manualUntil = 0;
      state.manualMode = "black";
      state.manualPayload = "";
      // Don't clear current break — autopilot break still finishes naturally
      await saveState(state);
      return res.status(200).json({ ok: true });
    }

    if (action === "schedule") {
      const s = body.schedule || {};
      if (typeof s.enabled === "boolean") state.schedule.enabled = s.enabled;
      if (s.gapMinSec != null)      state.schedule.gapMinSec = clampNum(s.gapMinSec, 30, 86400, state.schedule.gapMinSec);
      if (s.gapMaxSec != null)      state.schedule.gapMaxSec = clampNum(s.gapMaxSec, 30, 86400, state.schedule.gapMaxSec);
      if (s.durationMinSec != null) state.schedule.durationMinSec = clampNum(s.durationMinSec, 2, 600, state.schedule.durationMinSec);
      if (s.durationMaxSec != null) state.schedule.durationMaxSec = clampNum(s.durationMaxSec, 2, 600, state.schedule.durationMaxSec);
      if (Array.isArray(s.presets)) state.schedule.presets = s.presets.filter(p => typeof p === "string" && p.trim()).slice(0, 30);

      // Normalize: ensure max >= min
      if (state.schedule.gapMaxSec < state.schedule.gapMinSec) state.schedule.gapMaxSec = state.schedule.gapMinSec;
      if (state.schedule.durationMaxSec < state.schedule.durationMinSec) state.schedule.durationMaxSec = state.schedule.durationMinSec;

      // If just turned ON, schedule first fire after random gap
      if (state.schedule.enabled && state.schedule.nextFireAt <= now) {
        state.schedule.nextFireAt = now + randInt(state.schedule.gapMinSec, state.schedule.gapMaxSec) * 1000;
      }
      // If just turned OFF, end any active break
      if (!state.schedule.enabled) {
        state.schedule.currentBreakEnd = 0;
        state.schedule.nextFireAt = 0;
      }
      await saveState(state);
      return res.status(200).json({ ok: true, schedule: state.schedule });
    }

    return res.status(400).json({ error: "unknown action" });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
