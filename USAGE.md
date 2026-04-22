# Intermission — User Guide

A phone-controlled TV canvas for gentle, parent-directed moments. Push big text to your TV, run a countdown, or let Autopilot do breaks on a schedule.

**Live app:** https://intermission-one.vercel.app

---

## First-time setup (once per TV)

**1. Open the display on the TV.**

Two options, pick whichever your TV supports:

- **Samsung Frame / other smart TV with a browser:** Open the TV's built-in browser, go to `intermission-one.vercel.app/display.html`. Fullscreen it.
- **AirPlay from a phone/iPad:** Open `intermission-one.vercel.app/display.html` on an iOS device, then screen-mirror via AirPlay to your Apple TV / AirPlay-compatible TV.

You should see a black screen. That's the idle state — working correctly.

**2. Open the controller on your phone.**

Go to `intermission-one.vercel.app/control.html`. Add to home screen if you want a one-tap icon (Safari → Share → Add to Home Screen).

That's it. The two pages are already talking to each other through the cloud — no pairing, no Wi-Fi setup, no accounts.

---

## Manual use

For the dinner-table "3 more bites" moment.

**Send custom text:** Type in the text box → tap **Send to TV**. Text fills the TV screen in big bold caps.

**Send a preset:** Tap any of the 8 preset tiles (3 MORE BITES, EYES UP, SHOES ON, CLEAN UP, DANCE BREAK, TEETH TIME, ALL DONE, PAUSE). Fills the TV immediately.

**Run a countdown:** Tap **30s / 1m / 2m / 5m** in the Countdown row. TV shows a giant timer counting down. When it hits zero, it shows "TIME".

**Clear:** Tap the big **● Clear (black screen)** button. TV returns to black. Kids can resume whatever they were watching.

### Manual scenes hold for 5 minutes

If you have Autopilot running and push a manual scene, Autopilot pauses for 5 minutes (so your manual moment isn't interrupted). After 5 minutes of no manual activity, Autopilot resumes.

Hit **Clear** to release the hold immediately.

---

## Autopilot

For when you want ambient, randomized interruptions running in the background — e.g., "remind the kids to look up every 10-20 minutes during the TV morning."

**1. Open the Autopilot drawer.** Tap the **Autopilot** row near the bottom of the control page. It expands.

**2. Configure:**

- **Gap between breaks (minutes):** Set `min` and `max`. A random value in that range is picked after each break. Set `min = max` for fixed timing. *Defaults: 10 to 20.*
- **Break duration (seconds):** Same pattern — min and max, randomized each time. *Defaults: 8 to 15.*
- **Pool:** These are the scenes Autopilot picks from randomly. Add/remove by tapping the × on chips or the dashed `+ PRESET` suggestions. Add custom text with the input + **Add** button. *Defaults: "3 MORE BITES", "EYES UP", "TAKE A SIP", "DANCE BREAK".*

**3. Toggle Enabled → on.**

**4. Tap Save autopilot settings.** The status row at the top of the drawer now says something like *"next in 14m 22s"*.

**5. Close the drawer.** You can put your phone down. Autopilot runs in the cloud — it doesn't need your phone or the controller page open.

### What happens when Autopilot fires

- TV swaps from black to the randomly-picked preset text
- Text stays up for the randomized duration (e.g. 11 seconds)
- TV returns to black
- Autopilot schedules the next break at a random gap

### Stopping Autopilot

Toggle Enabled → off in the drawer, then **Save**. Any currently showing break disappears. The cycle is fully paused until you turn it back on.

---

## Recommended starting recipes

| Situation | Gap | Duration | Pool |
|---|---|---|---|
| Weekend morning TV, gentle nudges | 15 to 25 min | 8 to 12 sec | "EYES UP", "STRETCH", "WATER BREAK" |
| Dinner with a show on | 5 to 10 min | 10 to 15 sec | "3 MORE BITES", "TAKE A SIP" |
| Screen-time wind-down (30 min before bed) | 8 to 10 min | 15 to 20 sec | "ALMOST DONE", "TEETH SOON", "PAJAMAS" |
| Dance-break interval (party mode) | 3 to 5 min | 20 to 30 sec | "DANCE BREAK", "SHAKE IT", "JUMP" |

Start loose. If breaks feel too frequent, increase the gap. If they're missed / ignored, shorten the gap or bump duration.

---

## Tips

- **Custom text auto-uppercases.** Type lowercase if you want — the TV displays caps.
- **Tapping a preset fills the text input with it.** Easy to tweak and resend.
- **Autopilot fires "on read" — if nobody's looking, nothing happens.** The TV display page needs to be open for breaks to appear. This is the correct behavior: no one watching = no interruption needed.
- **One controller, one TV.** If you open the controller on two phones simultaneously, both push to the same TV — useful for co-parent handoff.
- **Settings persist.** Autopilot config survives TV-off, phone-off, and Vercel cold starts.

---

## Troubleshooting

**TV shows "settings RESET on cold start" in the footer.**
KV isn't configured. Autopilot settings will reset every ~15 minutes idle. See `UPSTASH-SETUP.md` in the repo.

**TV display goes black and stays black after a while.**
The Frame's browser may have timed out. Reload `display.html` on the TV. A meta-refresh is built in (every 30 min) but isn't always reliable.

**Phone shows "offline" when I tap Send.**
Check Wi-Fi. The controller page needs internet — it talks to the cloud, not directly to the TV.

**Autopilot is enabled but nothing fires.**
Check the **Pool** has at least one preset. If it's empty, Autopilot can't pick anything. Also check that `display.html` is actually open on the TV.

**Text is too small / too big.**
The text scales automatically to fit the screen. If a preset feels too small, shorten the text. If it's overflowing, same — shorter text = bigger display.

**Countdown finishes and shows "TIME" forever.**
Tap **Clear** to reset the TV to black.

---

## Privacy

- No accounts. No login. No tracking.
- No cameras, no microphones, no recording of any kind.
- State is stored briefly in Upstash KV for persistence — just the current scene and your Autopilot settings. Not logs, not history.
- Single global household state. If you share the URL with someone else, they see what you see. This is a private-use personal tool, not a multi-tenant app.

---

## Feature wishlist (v2+)

- Source-takeover integration with SmartThings (Samsung TVs) for true auto-pause of whatever's playing
- Sound effects on break start
- Preset scheduling (auto-enable Autopilot at 5pm, auto-disable at 8pm)
- Siri Shortcut trigger
- Ambient generated visuals via Claude API

Not shipped yet. Add to TODO if you want any of these next.
