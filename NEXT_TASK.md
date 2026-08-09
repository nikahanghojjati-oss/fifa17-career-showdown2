# NEXT TASK

## Current gate: v0.95.0-r11 — Final polish / regression candidate

Owner/browser accepted:

- Workstream 1B / `0.95.0-r4` — FIFA-era presentation, procedural club identities and two-pack reveal;
- Workstream 2 / `0.95.0-r5` — phased Transfer Challenge and canonical FIFA 17 transfer metadata/selectors;
- Workstream 3 / `0.95.0-r6` — Settings and persistent motion accessibility;
- Workstream 4 / `0.95.0-r8` — Career Statistics / Trophy Room / Rivalry Statistics after Home-bootstrap stabilization;
- Workstream 5 / `0.95.0-r9` — Season pre-commit Review / Edit / Confirm & Save flow;
- stabilization / `0.95.0-r10` — explicit League Wheel Continue checkpoint and refresh/resume protection.

**Application version:** v0.95.0
**Asset revision:** `0.95.0-r11`
**Current activity:** Workstream 6 final v0.95 polish / regression
**Source status:** implementation and deterministic validation complete; exact-head deployment candidate
**Owner acceptance:** pending

Do not begin v1.0 release conversion until the r11 browser acceptance below passes.

---

# r11 implementation

## Centralized FIFA-era route transition

`js/screens.js` remains the only route/history authority.

Successful screen changes now receive a short FIFA-era-inspired directional entrance:

- forward navigation enters from the right;
- Smart Back enters from the left;
- only compositor-friendly `transform` and `opacity` are animated;
- one short original yellow/cyan route rail reinforces the existing visual language;
- the destination is committed immediately, so the transition adds no artificial navigation delay.

The previous 130 ms implementation removed its animation marker on the next animation frame and could therefore cancel itself almost immediately. r11 keeps the marker through `animationend`, with a bounded fallback cleanup.

### Race / integrity protection

- route legality is checked before presentation begins;
- pending Transfer/current-showdown writes flush before the screen swap;
- destination rendering completes before transition state is applied;
- a newer navigation cancels the previous transition marker/listener/timer;
- revision checks prevent a stale animation callback from altering the latest route;
- blocked/failed navigation does not consume confirmation feedback;
- audio or animation failure cannot change navigation success;
- route history remains centralized and bounded.

### Reduced motion

Device reduced motion or the app **Reduce Motion** preference skips the theatrical route state entirely. The destination remains immediate, focus still moves correctly and no delay is inserted.

---

# Original menu click feedback

`js/menuFeedback.js` synthesizes a restrained 64 ms two-voice cue with the browser Web Audio API.

- no recorded sound file is bundled or fetched;
- no EA/FIFA waveform or proprietary interface audio is copied;
- the synthesizer is lazy and remains outside the seven-script startup shell;
- no audio context is created at startup;
- only an eligible explicit user interaction can arm the cue;
- the cue is consumed only after a successful route commit;
- a 110 ms cooldown prevents stacked rapid playback;
- Home soundtrack/trailer playback suppresses the cue;
- unsupported/blocked audio silently leaves navigation unchanged;
- hidden-page audio is suspended.

The existing Settings Accessibility panel now contains a compact **MENU CLICK FEEDBACK** switch. Its state is stored in `careerModeShowdown.preferences`; older preference records migrate safely with feedback enabled. Reset All Showdown Data continues to preserve application preferences.

---

# Accessibility / responsive / performance polish

r11 also adds:

- destination-heading focus after route changes, without viewport jumps;
- per-screen `aria-hidden` and `aria-labelledby` synchronization;
- loading-shell accessibility isolation after startup;
- scroll reset when opening a destination;
- explicit keyboard focus treatment for Back, compact, media-choice and media-control buttons;
- proper setup-label associations;
- explicit `type="button"` for all shell buttons;
- live status semantics for League selection and Transfer phase state;
- contextual accessible names for all compact Transfer fields;
- preservation of those contextual names after combobox enhancement;
- responsive Settings feedback control for Chromebook/mobile.

Performance contract:

- exactly seven initial local scripts;
- exactly one initial local stylesheet;
- `153,000–154,000` raw local startup bytes, depending on final documentation-neutral formatting;
- under `35,000` gzip-compressed local startup bytes;
- 4.8 KB lazy feedback synthesizer;
- no new framework, media file, canvas, WebGL or animation library.

Dedicated workflow:

`.github/workflows/validate-final-polish.yml`

It protects transition ordering/stale cleanup, reduced motion, accessible focus, preference migration, original synthesis, media suppression, cooldown, contextual labels and startup/lazy budgets.

All eight workflows now contain 21 deterministic validation blocks.

---

# r11 owner/browser acceptance checklist

Hard-refresh once so Chrome receives `0.95.0-r11`.

Use normal motion first:

1. From Home, open New Showdown, then use Back. The short directional transition should feel smooth and immediate, with no white flash, blank frame, overlapping screen or input delay.
2. Open Legacy, Statistics and Rule Book, then return with Back. Forward movement should feel consistent and Back should reverse direction.
3. With Home media paused, navigate between destinations and judge the click cue. It should be crisp, subtle and extremely short, not a generic loud beep.
4. Rapidly press a destination twice and try quick Back/forward actions. Only one legal screen should remain visible; history and focus must stay correct.
5. Open Settings → Motion & Feedback. Turn **MENU CLICK FEEDBACK** off, close Settings and navigate. The cue must remain muted. Refresh and verify the mute persists. Re-enable it afterward if desired.
6. Start a Home soundtrack or trailer, then navigate. The micro cue must not compete with playing media.
7. Enable **Reduce Motion**. Repeat Home → New Showdown → Back and Home → Legacy → Back. Navigation must be immediate with no theatrical slide or artificial pause.
8. Verify keyboard navigation: activate Home tiles and Back with Enter/Space. The new destination title should receive visible focus and the page should open at the top.

Regression smoke test:

9. Create a disposable Showdown and repeat the r10 League Wheel check: spin, wait at least 10 seconds, refresh before Continue, then explicitly continue. It must never auto-enter Club Assignment.
10. Complete the two-pack reveal and rivalry confirmation, then reach Showdown Home.
11. Open Transfer Challenge and verify Guess Entry, Signing Entry and verdict routing still behave normally.
12. Smoke-check Season Results → Review → Edit → Review → Confirm & Save → Summary.
13. Open Career Statistics, Rivalry Statistics, Trophy Room and Legacy.
14. Repeat the key navigation/audio/reduced-motion checks on the target Chromebook and mobile browser.

Quality rejection rule:

If the transition feels slower, choppy or visually cheap, or if the cue sounds annoying/generic, report the exact device/browser and behavior. Simplify or omit the compromised effect rather than accepting lower quality.

If r11 passes, move directly to **v1.0 Complete Release Candidate / Final Release**. Do not create another feature roadmap between r11 and v1.0.
