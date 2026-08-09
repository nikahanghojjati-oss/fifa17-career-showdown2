# NEXT TASK

## Current gate: v0.95.0-r13 — V1 Visual Immersion Candidate

The deployed r12 build remains the locked functional baseline. The owner's Chromebook review adds exactly two mandatory blockers before v1.0.0:

1. materially improve the Home/Main Menu layout, scale, hierarchy and finish;
2. restore an immersive pre-menu loading presentation with a large, properly licensed Marco Reus image.

Both requirements are implemented in r13. Do not open another feature workstream. The remaining work is exact deployment, target-device visual acceptance and the stable identity seal.

**Application version:** v0.95.0

**Asset revision:** `0.95.0-r13`

**Source status:** implementation complete; all deterministic, multi-viewport, complete-flow and accessibility validation passes locally

**Deployment status:** pending exact r13 release

**Owner acceptance:** pending target-Chromebook visual inspection

---

# Mandatory v1 visual requirements

## 1. Responsive metallic Home shell

Locked r13 contract:

- use the effective 1920 × 912 Chromebook page viewport well without hard-coding the app to one device;
- cap the desktop canvas at 1510 px and scale proportionally below it;
- retain dedicated low-height laptop, tablet, mobile and small-mobile layouts;
- keep the Career tile dominant and give New Showdown, Legacy, Statistics, Rule Book and Settings a clear hierarchy;
- use original blue, brushed-silver and graphite surfaces with restrained yellow/cyan accents;
- preserve readable type, keyboard focus, touch targets and all existing routes/actions;
- never introduce horizontal viewport overflow or clipped menu/media controls;
- retain exactly seven accepted Home media choices and no iframe before explicit Play.

## 2. Cinematic startup presentation

Locked r13 contract:

- show before Home on every fresh page load;
- remain cosmetic and silent, with no new route, save or user action required;
- use an original `CM17` project identity and split athlete/title composition rather than copied EA/FIFA artwork;
- use the local `assets/marco-reus-2015-cc-by.webp` portrait;
- preserve the full head and a deliberate upper/full-body crop on the target Chromebook;
- keep the app inert and `aria-hidden` until startup dismissal;
- dismiss automatically after about 1.9 seconds under normal motion;
- shorten to about 220 ms under reduced motion and remove unnecessary animation;
- bound exit cleanup at 240 ms and release app accessibility state exactly once;
- preserve complete attribution and transformation details in `THIRD_PARTY_NOTICES.md`.

The portrait source is Tim Reckmann's Wikimedia Commons photograph under CC BY 2.0. The local WebP is 900 × 1520 and 89,008 bytes. Do not silently replace it with a search result, hotlink or unlicensed image.

---

# Exact candidate evidence

## Deterministic gates

All 22 executable blocks across nine workflows pass:

- Validate Static App;
- Validate Home Bootstrap;
- Validate Transfer Workstream;
- Validate Settings Workstream;
- Validate Statistics Workstream;
- Validate Season Review;
- Validate League Confirmation;
- Validate Final Polish;
- Validate V1 Visual Immersion.

Exact startup measurements:

- eager CSS + seven eager scripts: 163,887 raw bytes;
- gzip-equivalent code: 36,681 bytes;
- local startup/Home portrait: 89,008 bytes;
- combined first-party startup: 252,895 bytes;
- dependency count: one eager local stylesheet + seven eager local scripts.

Locked r13 ceilings are 165,000 raw code bytes, 37,500 gzip code bytes, 95,000 portrait bytes and 260,000 combined first-party startup bytes. Optional gameplay, Transfer, Season Review, analytics, Settings, Legacy, Rule Book, Trophy Room, diagnostics and menu-feedback modules remain lazy.

## Real-browser regression

The exact local r13 candidate passes 98 real-Chromium journey checkpoints and 23 automated WCAG scans with zero JavaScript runtime failures, failed local assets or duplicate IDs.

Covered flow:

Startup → empty Home → Create Showdown → League Selected explicit checkpoint → League Confirmed → Club Reveal → Rivalry Confirmation → active Home → Transfer Window → Guess Entry → Signing Entry → Verdicts → Season Results → Review → Edit value recovery → Review → Confirm → Summary → completed Home → Rule Book → Career Statistics → Legacy → Settings → mobile refresh/recovery.

Dedicated startup/Home layout checks pass at:

- 1920 × 912 Chromebook-class desktop;
- 1366 × 768 low-height laptop/Chromebook;
- 768 × 1024 tablet;
- 390 × 844 mobile with reduced motion.

---

# r13 owner/browser acceptance checklist

Hard-refresh once after deployment so Chrome receives `0.95.0-r13`.

1. Confirm the startup appears immediately, fills the usable viewport and shows the complete Marco Reus crop, project title and loading status.
2. Confirm the startup dismisses automatically without a click and Home becomes usable immediately afterward.
3. In Chromebook accessibility settings or browser emulation, enable Reduce Motion and confirm startup becomes brief and non-theatrical.
4. On the target Chromebook, confirm Home is substantially larger and uses the viewport well without looking stretched or oversized.
5. Inspect empty, active and completed Home states. Tile labels, manager names, season indicator, photo credit and media controls must remain readable and aligned.
6. Navigate by keyboard through every Home tile and media choice. Focus must be obvious and must not clip.
7. Check hover/mouse and touch/click interaction. No tile may jump, overlap or trigger the wrong destination.
8. Repeat at a narrow mobile width and a tablet width. Horizontal page scrolling is a release blocker.
9. Run one disposable season through League confirmation, Club Reveal, Transfer phases and Review/Edit/Confirm to ensure r12 behavior remains unchanged.
10. Refresh the active and completed save. Continue Career, the season indicator and the completed hub must recover correctly.
11. Smoke-check Rule Book, Career Statistics, Rivalry Statistics, Trophy Room, Legacy and Settings.
12. Confirm the new presentation feels football-game inspired and classy without looking like a literal copy of the attached FIFA 17 screen.

Quality rejection rule:

Any cropped face, tiny desktop canvas, viewport overflow, inaccessible startup trap, unbounded animation, stale save header, lost Season value, unexpected route, runtime error or unreadable metallic treatment blocks v1.0.0.

If all twelve checks pass, change only the release identity/documentation required to seal the exact behavior as **v1.0.0 Stable**. Do not add another pre-v1 feature scope.
