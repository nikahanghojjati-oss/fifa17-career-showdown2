# PORT · JOB-1036 · Upright tablet Transfer War and Home (HO-021 part 1)

For Team G (Studio Z). Source release: r63 (`refs/pull/427/head`). Two CSS blocks, appended at the END of two existing files. No JS, HTML, backend, scoring or screen-order change. Both blocks live inside
`@media (min-width: 761px) and (max-width: 1100px) and (orientation: portrait)`, so phones (max 760 px), sideways phones and desktops are untouched.

## What goes where

| Block | Append to the end of | Exact CSS |
| --- | --- | --- |
| Transfer War, all four phases | `css/v10Transfer.css` | `visual-assets/v10_1/tr2/evidence/1036/added-rules-transfer.css` (also below) |
| Home | `css/homeV10.css` | `visual-assets/v10_1/home/evidence/1036/added-rules-home.css` (also below) |

Do not touch `visual-assets/v10_1/tr2/slice-02-plate/plate.css` or `plate.js` (byte-pinned by `tests/contracts/v10-transfer-contracts.cjs`) or `visual-assets/v10_1/home/home.css`.

## How it works (so a reviewer can follow it)

- The plate and home scripts only switch to their phone composition at max-width 760, so an upright tablet gets their desktop DOM. The blocks re-flow that same DOM (same ids, same text, same handlers) as a column, like the phone does, at tablet scale.
- The phone hero pictures (`ENV_TRANSFER_PHONE_V1`, `OVL_TRANSFER_DANIEL_PHONE_V2`, `OVL_TRANSFER_NIK_PHONE_V2`; `ENV_HOME_PHONE_V1`, `OVL_HOME_DANIEL_PHONE_V2`, `OVL_HOME_NIK_PHONE_V2`) are set as CSS background images on the existing `<picture>` boxes, because their `<source media>` only matches phones. The `<img>` inside is hidden. Relative `url(../visual-assets/...)` resolves from `css/`, the folder both files are loaded from. No new image was generated.
- Transfer: figures are 30% of the screen height (limit 35%), Daniel LEFT and Nik RIGHT. Status band, then Daniel's own glass first (fields 52 to 64 px tall, 18 px text), Nik's sealed strip, LOCK / REQUEST EARLY END / CONTINUE fixed right under them (56 px), HOME and REFRESH last (48 px). LOCK MY GUESSES / LOCK MY SIGNINGS are solid gold in the empty-field state, exactly like the phone (the app's `.menuButton:hover` turned them dark grey, so the block pins gold on hover and focus; REQUEST EARLY END and CONTINUE keep the phone's dark glass with gold text the same way). The glass grows with the spare height, so there is no dead band at 768x1024, 820x1180, 834x1194 or 1024x1366.
- Home: managers on top with the CM17 lockup, Continue as the dominant full-width gold tile, two rows of three tiles with the art in the right half, centred vertically and fully inside (square box `min(100% - 24px, 46cqw)`, trophy and player keep their 2:3 ratio), one soundtrack strip (vinyl, title, PLAY, MUTE, TRACKS), then the shared bottom bar. The CM17 wordmark, kicker and tagline sit on the lower edge of the hero, just above CONTINUE, below both pointing hands and both faces (hero is 40% of the screen height). The track sheet opens in three columns. The two identity chips are 44 px tall; they use the shared shell's `html[data-v10-screen="mainMenu"]` selector, because `css/v10Shell.css` out-ranks a plain `#app #topHeader` rule.
- Home art uses `aspect-ratio` and not `object-fit`, because `tests/contracts/v10-home-contracts.cjs` (check 11) forbids the word `object-fit` anywhere in `css/homeV10.css`.
- Above 900 px wide the app shows its 52 px top bar and no bottom bar: the Home block sets `--tb-nav-t: 52px` and `--tb-nav-b: 28px`, the Transfer block moves the figures down by 60 px.

## The 760 fallback

`js/onlinePlayerIdentity.js` line 73 (Z7) still sets `width=760` on an upright touch screen wider than 760 px. **Team G removes that fallback for Transfer and Home** once these blocks are in (keep it for every other screen until each has its own tablet layout). Until then the blocks do nothing on a real iPad (the page is 760 wide) and only apply on desktop browsers and tablets whose viewport is not forced. `tests/contracts/studio-z-contracts.cjs` check Z7 asserts the fallback, so it changes with it.

## Proof (layout audit, `tools/layout-audit` from `audit/layout-auditor`, SIZES patched; 768x1024 and 820x1180 rendered WITHOUT `phone:true` so the fallback is off)

Screens: home-empty, transfer-war-window, transfer-war-guess, transfer-war-signing, transfer-war-completed.

| Size | text-clipped | off-screen | tap-target | overlap | art-clipped | total |
| --- | --- | --- | --- | --- | --- | --- |
| 768x1024 before (r63, no fallback) | 13 | 14 | 8 | 0 | 0 | 35 |
| 768x1024 after | 0 | 0 | 0 | 0 | 0 | 0 |
| 820x1180 before (r63, no fallback) | 10 | 16 | 8 | 0 | 0 | 34 |
| 820x1180 after | 0 | 0 | 0 | 0 | 0 | 0 |
| 768x1024, 820x1180 with fallback on (r63 as shipped) | overlap 2 (minor) and 1 (minor), unchanged | | | | | |

Also 0 findings at 834x1194 and 1024x1366 (extra tablet sizes). My own check at 768x1024 and 820x1180: `scrollHeight == innerHeight` on every Transfer phase and Home, every Transfer control at least 44 px, Home identity chips 44 px.

Unchanged sizes (393x660, 375x553, 360x560, 1366x650, 1440x900, and the two fallback-on tablet renders): pixel diff 0 on Home and on Transfer Window, Guess Entry and Signing Entry. Transfer Completed differs only inside the club-name heading lines (`DANIEL . <club>`, `NIK . <club>`): the audit fixture draws random clubs on every run, so two runs of the same tree differ there too. Counts of findings are identical before and after at every size.

Tests run on the patched r63 tree: `v10-transfer-contracts` PASS (10), `v10-home-contracts` PASS (12), `studio-z-contracts` PASS (8).

Sheets: `visual-assets/v10_1/tr2/evidence/1036/before_after_768x1024.jpg`, `before_after_820x1180.jpg`, `unchanged_phone_sizes.jpg`, `unchanged_desktop_sizes.jpg`; `visual-assets/v10_1/home/evidence/1036/before_after_768x1024.jpg`, `before_after_820x1180.jpg`, `unchanged_sizes.jpg`.

## Art

No new art is needed. The phone hero pictures scale up to 820 px and 1024 px wide without visible softness.

## Exact CSS: css/v10Transfer.css (append)

```css
/* JOB-1036 (HO-021 part 1): upright tablet Transfer War, all four phases (Window, Guess Entry, Signing Entry, Verdicts).
   An upright tablet (761 to 1100 px wide) gets the phone composition at tablet scale instead of the small desktop panel:
   the three phone hero pictures as backgrounds (faces at most 34% of the screen height), the status band, Daniel's
   own glass first, Nik's sealed strip next, the primary action fixed right under them, the HOME/REFRESH row last.
   Daniel stays LEFT and Nik RIGHT in the art. Fields and buttons are 52 to 56 px tall; there is no page scroll. */
@media (min-width: 761px) and (max-width: 1100px) and (orientation: portrait) {
  /* @@ = #transferChallenge .tw-host (added by tools/build.py). One rule per line group; no nesting. */

  /* stage and world: a flow column on the real viewport, the viewport is the page (no page scroll) */
  #transferChallenge .tw-host { --tb-side: clamp(24px, 4.2vw, 40px); --tb-gap: clamp(8px, 1.15svh, 14px); --tb-action-h: 56px; --tb-action-gap: 10px; --tb-fig-h: min(30svh, 470px); --tb-top: calc(max(8px, env(safe-area-inset-top)) + 8px); --footer-h: 56px; --band-h: 44px; }
  #transferChallenge .tw-host .stage { --footer-h: 56px; --band-h: 44px; top: 0; height: 100dvh; min-height: 100dvh; overflow: hidden; z-index: 1; background: transparent; }
  #transferChallenge .tw-host .world { position: relative !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100dvh !important; transform: none !important; box-sizing: border-box; display: flex; flex-direction: column; gap: var(--tb-gap); padding: var(--tb-top) var(--tb-side) calc(var(--footer-h) + var(--tb-action-h) + var(--tb-action-gap) * 2 + env(safe-area-inset-bottom) + var(--tb-gap)); overflow: hidden; isolation: isolate; }
  #transferChallenge .tw-host .stage[data-phase="COMPLETED"] .world { padding-bottom: calc(var(--footer-h) + var(--tb-action-h) + var(--tb-action-gap) * 2 + env(safe-area-inset-bottom) + var(--tb-gap)); }
  #transferChallenge .tw-host .m-only { display: inline-flex !important; }
  #transferChallenge .tw-host .d-only { display: none !important; }

  /* hero: the phone portrait art (same three files the phone uses), as backgrounds so no picture source is needed */
  #transferChallenge .tw-host .phone-hero-art { display: block; position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; background: var(--sd-black); }
  #transferChallenge .tw-host .phone-hero-art img { display: none; }
  #transferChallenge .tw-host .phone-hero-bg { position: absolute; inset: 0 0 auto; height: calc(var(--tb-top) + 56px + var(--tb-fig-h) + 40px); z-index: 1; overflow: hidden; background: url("../visual-assets/v10_1/tr2/slice-02-plate/assets/ENV_TRANSFER_PHONE_V1.webp") 50% 40% / cover no-repeat; }
  #transferChallenge .tw-host .phone-hero-bg::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(7,6,4,.94) 0, rgba(7,6,4,.80) 70px, rgba(7,6,4,.30) 150px, transparent 230px, transparent calc(100% - 90px), var(--sd-black) 100%); }
  #transferChallenge .tw-host .phone-hero { position: absolute; display: block; width: auto; pointer-events: none; transform: none; background-repeat: no-repeat; background-size: 100% 100%; -webkit-mask-image: linear-gradient(to bottom, #000 78%, transparent 100%); mask-image: linear-gradient(to bottom, #000 78%, transparent 100%); }
  #transferChallenge .tw-host .phone-hero-daniel { z-index: 3; top: calc(var(--tb-top) + 58px); height: var(--tb-fig-h); aspect-ratio: 701 / 608; left: 0; background-image: url("../visual-assets/v10_1/tr2/slice-02-plate/assets/OVL_TRANSFER_DANIEL_PHONE_V2.webp"); filter: drop-shadow(-2px 0 5px rgba(245,197,24,.24)) drop-shadow(0 12px 14px rgba(0,0,0,.58)); }
  #transferChallenge .tw-host .phone-hero-nik { z-index: 2; top: calc(var(--tb-top) + 58px + var(--tb-fig-h) * .02); height: var(--tb-fig-h); aspect-ratio: 925 / 781; right: 0; left: auto; background-image: url("../visual-assets/v10_1/tr2/slice-02-plate/assets/OVL_TRANSFER_NIK_PHONE_V2.webp"); filter: drop-shadow(2px 0 5px rgba(245,197,24,.24)) drop-shadow(0 12px 14px rgba(0,0,0,.58)); }
  #transferChallenge .tw-host .phone-hero-art::after { content: none; }
  #transferChallenge .tw-host .scene-atmos,
  #transferChallenge .tw-host .scene .plate,
  #transferChallenge .tw-host .scene .plane { display: none; }
  #transferChallenge .tw-host .scene { position: relative; inset: auto; order: 0; flex: 0 0 auto; height: calc(var(--tb-fig-h) + var(--band-h) - 6px); min-height: 0; margin: 0 calc(var(--tb-side) * -1); background: transparent; overflow: visible; }

  /* wordmark */
  #transferChallenge .tw-host .transfer-wordmark { display: block; order: -1; flex: none; position: relative; z-index: 4; width: min(42vw, 330px); height: auto; margin: 0 auto; padding: 0; filter: drop-shadow(0 3px 3px rgba(0,0,0,.9)) drop-shadow(0 0 10px rgba(242,196,91,.22)); }
  #transferChallenge .tw-host .transfer-wordmark img { display: block; width: 100%; height: auto; }

  /* status band under the hero (production's own status text; the clock rides at the right end during the window) */
  #transferChallenge .tw-host .sign-status.reg { left: 0; right: 0; width: auto; top: auto; bottom: 0; height: var(--band-h); z-index: 2; background: #070604; transform: none; flex-direction: row !important; align-items: center; justify-content: center; gap: .5em; padding: 0 var(--tb-side); font-size: 16px; letter-spacing: .16em; line-height: 1.2; }
  #transferChallenge .tw-host .sign-status .sep { display: inline; color: var(--gold-deep); }
  #transferChallenge .tw-host .stage[data-phase="WINDOW_OPEN"] .sign-status.reg { justify-content: flex-start; padding-right: 120px; font-size: 15px; letter-spacing: .14em; }
  #transferChallenge .tw-host .stage[data-phase="WINDOW_OPEN"] .sign-status.reg[data-clock]::after { content: attr(data-clock); position: absolute; right: var(--tb-side); top: 50%; transform: translateY(-50%); font-size: 20px; letter-spacing: .04em; line-height: 1; color: #F6C75E; font-variant-numeric: tabular-nums; text-shadow: 0 0 4px rgba(255,186,64,.52); }
  #transferChallenge .tw-host .stage[data-phase="SIGNING_ENTRY"],
  #transferChallenge .tw-host .stage[data-phase="COMPLETED"] { --band-h: 50px; }
  #transferChallenge .tw-host .sign-status.full.reg { flex-direction: column !important; gap: 2px; font-size: 14.5px; letter-spacing: .1em; line-height: 1.2; padding: 0 var(--tb-side); white-space: nowrap; }
  #transferChallenge .tw-host .sign-status.full .sep { display: none; }
  #transferChallenge .tw-host .sign-status.full.lead .part:first-child { font-size: 16px; letter-spacing: .16em; filter: none; }
  #transferChallenge .tw-host .sign-screen.status-board .sign-main { display: block; }

  /* rules caption */
  #transferChallenge .tw-host .rules-card { order: 1; flex: none; position: relative; }
  #transferChallenge .tw-host .reg.rules-inner { position: relative; left: auto; top: auto; width: auto; height: auto; }
  #transferChallenge .tw-host .rules-inner,
  #transferChallenge .tw-host .rules-card.with-line .rules-inner { padding: 0 4px; gap: 6px; }
  #transferChallenge .tw-host .rules-line { justify-content: center; gap: 28px; margin: 0; }
  #transferChallenge .tw-host .rules-line .stat { flex-direction: row; align-items: baseline; gap: 7px; }
  #transferChallenge .tw-host .rules-line .stat-n { font-size: 34px; }
  #transferChallenge .tw-host .rules-line .stat-l { font-size: 16px; margin: 0; }
  #transferChallenge .tw-host .rule-note,
  #transferChallenge .tw-host .rules-card.with-line .rule-note { font-size: 16px; line-height: 1.25; text-align: center; color: var(--cream-dim); text-wrap: balance; }
  #transferChallenge .tw-host .lock-summary { font-size: 16px; line-height: 1.25; text-align: center; color: var(--cream-dim); text-wrap: balance; text-shadow: none; }

  /* glass panels: you first, then the sealed rival; they share the spare height so LOCK sits right under them */
  #transferChallenge .tw-host .panel { position: relative; flex: none; clip-path: none; border-radius: 6px; background: linear-gradient(180deg, rgba(36,28,14,.94), rgba(10,9,6,.97)); border: 1px solid rgba(242,196,91,.50); box-shadow: inset 0 1px 0 rgba(255,232,160,.30), inset 0 0 22px rgba(242,196,91,.07), 0 8px 20px rgba(0,0,0,.50), 0 0 16px rgba(242,196,91,.10); }
  #transferChallenge .tw-host .panel.own { order: 2; flex: 1 1 auto; display: flex; flex-direction: column; border-color: rgba(255,211,77,.78); box-shadow: inset 0 1px 0 rgba(255,232,160,.42), inset 0 0 26px rgba(242,196,91,.10), 0 8px 20px rgba(0,0,0,.50), 0 0 20px rgba(242,196,91,.20); }
  #transferChallenge .tw-host .panel.sealed { order: 3; }
  #transferChallenge .tw-host .stage[data-phase="WINDOW_OPEN"] .panel.sealed { flex: .5 1 auto; }
  #transferChallenge .tw-host .panel::before { content: ""; position: absolute; inset: 4px; pointer-events: none; z-index: 0; border: 1px solid rgba(242,196,91,.14); border-image: none; border-radius: 3px; filter: none; }
  #transferChallenge .tw-host .panel > * { position: relative; z-index: 1; }
  #transferChallenge .tw-host .reg.panel-title,
  #transferChallenge .tw-host .reg.panel-body,
  #transferChallenge .tw-host .reg.frost { position: relative; left: auto; top: auto; width: auto; height: auto; }
  #transferChallenge .tw-host .panel-title { min-height: 36px; margin: 10px 18px 0 18px; padding: 0; justify-content: flex-start; gap: 10px; align-items: center !important; }
  #transferChallenge .tw-host .panel-title::before { content: ""; flex: none; width: 26px; height: 14px; background: repeating-linear-gradient(115deg, var(--sd-gold-500, #f5c518) 0 3px, transparent 3px 7px); opacity: .85; }
  #transferChallenge .tw-host .panel.own .own-heading { transform: none !important; font-size: 22px; }
  #transferChallenge .tw-host .panel.own .chip-private { margin: 0 0 0 auto !important; }
  #transferChallenge .tw-host .chip { height: 28px; padding: 0 12px; font-size: 14px; }
  #transferChallenge .tw-host .phase-guess .chip-you.m-only { order: 3; }
  #transferChallenge .tw-host .panel-body { padding: 10px 18px 18px; gap: 10px; }
  #transferChallenge .tw-host .panel.own > .panel-body { flex: 1 1 auto; justify-content: space-evenly; }
  #transferChallenge .tw-host .panel.verdict { flex: 1 1 auto; display: flex; flex-direction: column; }
  #transferChallenge .tw-host .panel.verdict > .verdict-body { flex: 1 1 auto; justify-content: center; }
  #transferChallenge .tw-host .panel-body::before { inset: 4px 8px; }

  /* Guess entry: one guess per row, 52 px fields, 18 px text */
  #transferChallenge .tw-host .guess-cols { grid-template-columns: 1fr; gap: var(--tb-gap); }
  #transferChallenge .tw-host .guess-col { display: grid; grid-template-columns: 30px minmax(0, .9fr) minmax(0, 1.1fr); align-items: center; gap: 12px; }
  #transferChallenge .tw-host .guess-num,
  #transferChallenge .tw-host :where(.guessRow, .signingRow) > span.guess-num { font-size: 16px; }
  #transferChallenge .tw-host .guess-col select,
  #transferChallenge .tw-host .guess-col input,
  #transferChallenge .tw-host .signing-row input { height: clamp(52px, 5.2svh, 64px); min-height: 52px; font-size: 18px; padding: 0 14px; border-radius: 4px; }
  #transferChallenge .tw-host .guess-col select { padding-right: 34px; background-position: calc(100% - 19px) 55%, calc(100% - 13px) 55%; background-size: 6px 6px; }
  #transferChallenge .tw-host .signing-row input::placeholder { font-size: 15px; }
  #transferChallenge .tw-host .action-row { gap: 12px; }
  #transferChallenge .tw-host .privacy-note { font-size: 15px; line-height: 1.2; }
  #transferChallenge .tw-host .phase-guess .privacy-note { display: block; margin-right: 0; font-size: 15px; line-height: 1.2; }

  /* Signing entry: three fields per row */
  #transferChallenge .tw-host .signing-body { padding: 10px 18px 18px; gap: 10px; }
  #transferChallenge .tw-host .signing-rows { gap: var(--tb-gap); }
  #transferChallenge .tw-host .signing-row { grid-template-columns: 30px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
  #transferChallenge .tw-host .signing-row.signingRow:not(.is-readonly) { grid-template-columns: 30px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); }
  #transferChallenge .tw-host .signing-row.is-readonly { grid-template-columns: 30px minmax(0, 1fr); gap: 10px; min-height: 48px; padding-bottom: 4px; }
  #transferChallenge .tw-host .phase-signing .action-row { min-height: 0; }
  #transferChallenge .tw-host .phase-signing .error-line { font-size: 15px; }

  /* Window */
  #transferChallenge .tw-host .window-body { padding: 10px 18px 18px; gap: 10px; min-height: 0; }
  #transferChallenge .tw-host .f1-brief { max-width: none; font-size: 30px; line-height: 1.1; text-wrap: balance; }

  /* sealed rival: one strip (name, seal, SEALED) */
  #transferChallenge .tw-host .panel.sealed { min-height: clamp(78px, 8.4svh, 100px); }
  #transferChallenge .tw-host .panel.sealed .panel-title { position: relative; z-index: 2; min-height: clamp(78px, 8.4svh, 100px); margin: 0 18px 0 18px; }
  #transferChallenge .tw-host .panel.sealed .chip-sealed { margin-left: auto; }
  #transferChallenge .tw-host .panel.sealed .reg.frost { position: absolute; inset: 10px 14px 10px 14px; z-index: 1; place-items: center; }
  #transferChallenge .tw-host .panel.sealed .seal { width: 52px; height: 52px; }
  #transferChallenge .tw-host .panel.sealed .frost::before { width: 8px; top: 8%; bottom: 8%; }
  #transferChallenge .tw-host .rival-name { font-size: 20px; }

  /* Verdicts */
  #transferChallenge .tw-host .panel.verdict.own { order: 2; }
  #transferChallenge .tw-host .panel.verdict.rival { order: 3; }
  #transferChallenge .tw-host .rules-card.with-continue { order: 4; min-height: 0; margin-bottom: 0; }
  #transferChallenge .tw-host .rules-card.with-continue .rule-note { display: none; }
  #transferChallenge .tw-host .verdict-heading { font-size: 22px !important; }
  #transferChallenge .tw-host .verdict-body { padding: 6px 18px 18px; gap: 6px; }
  #transferChallenge .tw-host .verdict-row { grid-template-columns: 30px minmax(0, 1fr) auto; gap: 12px; padding: 2px 0 4px; }
  #transferChallenge .tw-host .vr-name { font-size: clamp(20px, 2.1svh, 24px); }
  #transferChallenge .tw-host .vr-meta { font-size: 15px; }
  #transferChallenge .tw-host .vr-word { font-size: 18px; }
  #transferChallenge .tw-host .vr-why { font-size: 14px; }
  #transferChallenge .tw-host .verdict-empty { font-size: 20px; padding: 8px 0; }
  #transferChallenge .tw-host .guess-reveal { font-size: 15px; column-gap: 12px; }

  /* actions: the primary action is fixed under the glass, the HUD row under it */
  #transferChallenge .tw-host .btn-end,
  #transferChallenge .tw-host .phase-guess .btn-lock,
  #transferChallenge .tw-host .phase-signing .btn-lock,
  #transferChallenge .tw-host .btn-continue { position: fixed; z-index: 7; left: var(--tb-side); right: var(--tb-side); bottom: calc(var(--footer-h) + env(safe-area-inset-bottom) + var(--tb-action-gap)); width: auto; height: var(--tb-action-h); min-height: var(--tb-action-h); margin: 0; font-size: 20px; box-shadow: 0 8px 24px rgba(0,0,0,.58), var(--sd-shadow-glow); }
  #transferChallenge .tw-host .btn-continue { font-size: 16px; }
  #transferChallenge .tw-host .hud-footer { position: fixed; bottom: 0; height: calc(var(--footer-h) + env(safe-area-inset-bottom)); padding: 0 var(--tb-side) env(safe-area-inset-bottom); gap: 12px; z-index: 8; background: linear-gradient(to top, rgba(6,5,3,.98) 0%, rgba(6,5,3,.94) 80%, rgba(6,5,3,0) 100%); }
  #transferChallenge .tw-host .hud-footer .ghost,
  #transferChallenge .tw-host .hud-footer :is(.menuButton, .backButton) { height: 48px; min-height: 48px; min-width: 56px; padding: 0 16px; font-size: 14px; }
  #transferChallenge .tw-host .hud-footer :is(.backButton, #refreshSharedTransferChallenge)::after { font-size: 14px; }
  #transferChallenge .tw-host .hud-mid { flex-direction: column; gap: 4px; align-items: center; flex: 1; min-width: 0; }
  #transferChallenge .tw-host .hud-title { font-size: 14px; letter-spacing: .1em; }
  #transferChallenge .tw-host .rail { gap: 16px; }
  #transferChallenge .tw-host .rail li { font-size: 14px; }
  #transferChallenge .tw-host .rail li:not(.active) .label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

  /* hover and keyboard focus keep the phone colours (the app's own button hover turns every .menuButton dark grey, which made LOCK look disabled) */
  #transferChallenge .tw-host .btn-lock.sd-btn--primary:is(:hover, :focus-visible):not(:disabled) { background: var(--sd-gold-500); filter: none; transform: none; }
  #transferChallenge .tw-host .btn-end.sd-btn--secondary:is(:hover, :focus-visible):not(:disabled),
  #transferChallenge .tw-host .btn-continue.sd-btn--secondary:is(:hover, :focus-visible):not(:disabled) { background: rgba(8,9,12,.88); filter: none; transform: none; }
  /* wider than 900 px the app's top bar (52 px) is shown over the screen */
  @media (min-width: 901px) {
    #transferChallenge .tw-host { --tb-top: calc(max(8px, env(safe-area-inset-top)) + 60px); }
  }
}
```

## Exact CSS: css/homeV10.css (append)

```css
/* JOB-1036 (HO-021 part 1): upright tablet Home (761 to 1100 px wide, portrait). The phone's three zones at tablet scale:
   the managers on top with the CM17 lockup, then the hub (Continue, the dominant full-width gold tile, then two rows of
   three tiles whose art fills the right half, centred vertically and fully inside, then one soundtrack strip), then the
   shared bottom bar. Hero pictures are the phone's own files, set as backgrounds. Daniel LEFT, Nik RIGHT. */
@media (min-width: 761px) and (max-width: 1100px) and (orientation: portrait) {
  /* @@ = #mainMenu.v10Home (added by tools/build_home.py). */

  /* frame: hero, hub, nav reserve (the phone's three zones at tablet scale) */
  #mainMenu.v10Home { --tb-nav-b: calc(56px + env(safe-area-inset-bottom)); --tb-nav-t: 0px; --tb-hero: 40dvh; --tb-pad: clamp(16px, 3vw, 28px); --tb-gap: 10px; --hdr: 0px; --gutter: var(--tb-pad); display: grid; grid-template-rows: calc(var(--tb-hero) + var(--tb-nav-t)) minmax(0, 1fr) var(--tb-nav-b); height: auto; min-height: 100dvh; overflow: hidden; }
  #mainMenu.v10Home .plateView { grid-row: 1; position: relative; z-index: 1; inset: auto; min-width: 0; min-height: 0; overflow: hidden; background-color: #060709; background-image: none; border-bottom: 1px solid rgba(201,155,69,.55); }
  #mainMenu.v10Home .phoneHeroBackground { position: absolute; inset: 0; display: block; overflow: hidden; background: url("../visual-assets/v10_1/home/assets/ENV_HOME_PHONE_V1.webp") 50% 38% / cover no-repeat; }
  #mainMenu.v10Home .phoneHeroBackground img,
  #mainMenu.v10Home .phoneHeroCutout img { display: none; }
  #mainMenu.v10Home .phoneHeroCutout { position: absolute; z-index: 2; display: block; width: auto; pointer-events: none; transform: translateX(-50%); background-repeat: no-repeat; background-size: 100% 100%; filter: drop-shadow(0 10px 16px rgba(0,0,0,.56)) drop-shadow(0 0 3px rgba(242,196,91,.46)); }
  #mainMenu.v10Home .phoneHeroDaniel { left: 30%; top: calc(var(--tb-nav-t) + .5dvh); height: 41dvh; aspect-ratio: 489 / 800; background-image: url("../visual-assets/v10_1/home/assets/OVL_HOME_DANIEL_PHONE_V2.webp"); }
  #mainMenu.v10Home .phoneHeroNik { left: 69%; top: calc(var(--tb-nav-t) - .5dvh); height: 43dvh; aspect-ratio: 637 / 800; background-image: url("../visual-assets/v10_1/home/assets/OVL_HOME_NIK_PHONE_V2.webp"); }
  #mainMenu.v10Home .phoneHeroGrade { position: absolute; z-index: 3; left: 0; right: 0; top: calc(var(--tb-hero) + var(--tb-nav-t) - 15dvh); height: 15dvh; display: block; pointer-events: none; background: linear-gradient(180deg, rgba(5,6,7,0) 0%, rgba(5,6,7,.92) 100%); }
  #mainMenu.v10Home .scrim,
  #mainMenu.v10Home .scrimLow,
  #mainMenu.v10Home .dockBed,
  #mainMenu.v10Home .hdrBg,
  #mainMenu.v10Home .areaMend,
  #mainMenu.v10Home .mend,
  #mainMenu.v10Home .scriptLine,
  #mainMenu.v10Home .fifaMenuHeading,
  #mainMenu.v10Home .menuBottomStrip,
  #mainMenu.v10Home .footDeco { display: none !important; }
  #mainMenu.v10Home #app > footer { display: block !important; position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0; }
  #mainMenu.v10Home > .nav-reserve { grid-row: 3; position: relative; inset: auto; left: auto; right: auto; bottom: auto; width: 100%; height: auto; min-height: var(--tb-nav-b); background: #060709; border-top: 1px solid rgba(201,155,69,.24); }
  #mainMenu.v10Home > .fifaMenuShell { grid-row: 2; position: relative; z-index: 4; display: block; height: 100%; min-height: 0; box-sizing: border-box; padding: var(--tb-gap) var(--tb-pad); overflow: hidden; background: linear-gradient(180deg, rgba(6,7,9,.97), #060709 24%); }
  #mainMenu.v10Home .homeLockup { display: flex !important; position: fixed; z-index: 8; top: auto; bottom: calc(100dvh - var(--tb-hero) - var(--tb-nav-t) + 10px); left: 50%; width: min(36vw, 290px); transform: translateX(-50%); align-items: center; gap: 4px; pointer-events: none; }
  #mainMenu.v10Home .homeLockup::before,
  #mainMenu.v10Home .homeLockup::after { display: none; }
  #mainMenu.v10Home .lockupKicker { align-self: center; max-width: 100%; padding: 0; font-size: 13px; letter-spacing: .27em; text-align: center; }
  #mainMenu.v10Home .lockupLegacy { align-self: center; max-width: 100%; font-size: 12px; letter-spacing: .19em; text-align: center; }
  #mainMenu.v10Home .lockupWordmarkWrap { width: 100%; margin: 0; }

  /* the two status chips (the shared shell puts them top-left up to 900 px) get 44 px tap height */
  html[data-v10-screen="mainMenu"]:not([data-v10-setup]) #app #topHeader #onlinePlayerIdentityBadge, html[data-v10-screen="mainMenu"]:not([data-v10-setup]) #app #topHeader #seasonIndicator { min-height: 44px; padding: 6px 14px !important; font-size: 14px !important; }

  /* hub grid: Continue (dominant, full width), two rows of three, the soundtrack strip */
  #mainMenu.v10Home .fifaMenuGrid { position: static; display: grid; width: 100%; height: 100%; min-height: 0; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: minmax(120px, 1.3fr) repeat(2, minmax(104px, 1fr)) 72px; gap: var(--tb-gap); }
  #mainMenu.v10Home .fifaMenuGrid > .menuTile { flex: none; height: auto; min-height: 0; margin: 0; }
  #mainMenu.v10Home .fifaMenuGrid > #continueCareer { grid-column: 1 / -1; grid-row: 1; }
  #mainMenu.v10Home #newShowdown { grid-column: 1; grid-row: 2; }
  #mainMenu.v10Home #legacyButton { grid-column: 2; grid-row: 2; }
  #mainMenu.v10Home #careerStatisticsButton { grid-column: 3; grid-row: 2; }
  #mainMenu.v10Home #homeTrophyRoomButton { grid-column: 1; grid-row: 3; }
  #mainMenu.v10Home #ruleBookButton { grid-column: 2; grid-row: 3; }
  #mainMenu.v10Home #settingsButton { grid-column: 3; grid-row: 3; }
  #mainMenu.v10Home .menuMusicTile { grid-column: 1 / -1; grid-row: 4; }

  /* secondary tiles: label top-left, the art fills the right side, centred vertically, fully inside */
  #mainMenu.v10Home .fifaMenuGrid > .menuTile:not(#continueCareer) { container-type: size; justify-content: flex-start; gap: 2px; padding: 14px 14px 14px 16px; overflow: hidden; }
  #mainMenu.v10Home .fifaMenuGrid > .menuTile:not(#continueCareer) .menuTileCode { font-size: 13px; }
  #mainMenu.v10Home .fifaMenuGrid > .menuTile:not(#continueCareer) .menuTileLabel { max-width: calc(50% - 4px); font-size: clamp(20px, 3vw, 24px); line-height: 1.05; white-space: normal; }
  #mainMenu.v10Home .fifaMenuGrid > .menuTile:not(#continueCareer) .tileArt,
  #mainMenu.v10Home #homeTrophyRoomButton .tileArt { top: 50%; bottom: auto; left: auto; right: 14px; width: auto; height: min(calc(100% - 24px), 46cqw); aspect-ratio: 1 / 1; max-width: none; object-position: center; translate: 0 -50%; opacity: 1; }
  #mainMenu.v10Home #homeTrophyRoomButton .tileArt { aspect-ratio: 341 / 512; }
  #mainMenu.v10Home .tileChevron { display: none; }

  /* Continue: the biggest tile, gold; the player stands inside it on the right */
  #mainMenu.v10Home .fifaMenuGrid > #continueCareer { container-type: size; padding: 14px 38% 14px 26px; justify-content: center; gap: 4px; overflow: hidden; }
  #mainMenu.v10Home #continueCareer .menuTileCode { font-size: 14px; }
  #mainMenu.v10Home #continueCareer .menuTileLabel { font-size: clamp(32px, 5.4vw, 44px); line-height: 1; }
  #mainMenu.v10Home #continueCareer .menuTileMeta { font-size: 16px; max-width: 100%; white-space: normal; }
  #mainMenu.v10Home #continueCareer .tileArt,
  #mainMenu.v10Home #continueCareer:disabled .tileArt { top: auto; bottom: 0; right: 4%; left: auto; width: auto; height: calc(100% - 10px); aspect-ratio: 341 / 512; max-width: none; object-position: center bottom; translate: none; opacity: 1; }

  /* soundtrack: one strip, vinyl left, title, PLAY / MUTE / TRACKS right */
  #mainMenu.v10Home .menuMusicTile,
  #mainMenu.v10Home .menuMusicTile.side { position: relative; left: auto !important; top: auto !important; width: auto !important; height: auto !important; min-height: 0 !important; max-height: none !important; padding: 8px 14px; overflow: visible; display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; grid-template-rows: minmax(0, 1fr); grid-template-areas: "player head ctrl tracks"; column-gap: 14px; row-gap: 0; align-items: center; --vinyl: 46px; }
  #mainMenu.v10Home .menuMusicPlayer { display: block; grid-area: player; }
  #mainMenu.v10Home .menuMusicPlayer .eq { display: none; }
  #mainMenu.v10Home .menuMusicSource { display: none; }
  #mainMenu.v10Home .menuMusicHeader { grid-area: head; align-items: center; }
  #mainMenu.v10Home .menuMusicHeader > div { display: block; }
  #mainMenu.v10Home .menuMusicHeader span { font-size: 13px; }
  #mainMenu.v10Home .menuMusicHeader strong { display: block; font-size: 24px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #mainMenu.v10Home .menuMusicArtist { display: none; }
  #mainMenu.v10Home .menuMusicStatus { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; }
  #mainMenu.v10Home .menuMusicControls { grid-area: ctrl; display: flex; gap: 8px; }
  #mainMenu.v10Home .menuMusicControl { height: 48px; min-width: 56px; padding: 0 16px; font-size: 15px; }
  #mainMenu.v10Home .phoneSheetToggle { grid-area: tracks; position: relative !important; z-index: 3; display: block; width: 80px; height: 48px; margin: 0; padding: 0; opacity: 0; cursor: pointer; border: 0; }
  #mainMenu.v10Home .phoneTrackSheetOpen { grid-area: tracks; z-index: 2; display: inline-flex; width: 80px; height: 48px; box-sizing: border-box; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(242,196,91,.72); background: rgba(255,255,255,.04); color: var(--cream); font: 700 14px/1 var(--cond); letter-spacing: .08em; text-transform: uppercase; pointer-events: none; }
  #mainMenu.v10Home .phoneSheetToggle:focus-visible + .phoneTrackSheetOpen { outline: 2px solid var(--gold-hi); outline-offset: 2px; }
  #mainMenu.v10Home .phoneSheetToggle:checked + .phoneTrackSheetOpen { opacity: .68; }
  #mainMenu.v10Home .menuMediaSelector { display: none; }
  #mainMenu.v10Home .phoneSheetToggle:checked ~ .menuMediaSelector { position: fixed; z-index: 52; left: var(--tb-pad); right: var(--tb-pad); bottom: calc(var(--tb-nav-b) + 10px); display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: 54px; gap: 8px; height: auto; max-height: min(calc(70px + 4 * 62px), calc(100dvh - var(--tb-nav-b) - 90px)); box-sizing: border-box; padding: 58px 14px 14px; overflow-y: auto; overscroll-behavior: contain; background: rgba(8,10,13,.98); border: 1px solid var(--gold); box-shadow: 0 -18px 52px rgba(0,0,0,.7), inset 0 2px 0 rgba(255,241,184,.65); }
  #mainMenu.v10Home .menuMediaChoice { min-height: 44px; padding: 6px 10px; }
  #mainMenu.v10Home .menuMediaChoice strong { font-size: 15px; }
  #mainMenu.v10Home .menuMediaChoice small { font-size: 13px; }
  #mainMenu.v10Home .phoneTrackSheetBackdrop,
  #mainMenu.v10Home .phoneTrackSheetClose { display: none; }
  #mainMenu.v10Home .phoneSheetToggle:checked ~ .phoneTrackSheetBackdrop { position: fixed; z-index: 50; inset: 0; display: block; cursor: pointer; background: rgba(0,0,0,.58); }
  #mainMenu.v10Home .phoneSheetToggle:checked ~ .phoneTrackSheetClose { position: fixed; z-index: 53; right: calc(var(--tb-pad) + 14px); bottom: calc(var(--tb-nav-b) + 10px + min(calc(70px + 4 * 62px), calc(100dvh - var(--tb-nav-b) - 90px)) - 52px); display: inline-flex; min-width: 56px; height: 44px; align-items: center; justify-content: center; cursor: pointer; color: var(--gold); font: 700 14px/1 var(--cond); letter-spacing: .08em; text-transform: uppercase; }
  #mainMenu.v10Home #persistentNikDanielPairPanel { left: var(--tb-pad); right: var(--tb-pad); width: auto; top: calc(var(--tb-nav-t) + 64px); max-height: calc(100dvh - 300px); }
  /* wider than 900 px the app shows its top bar and no bottom bar */
  @media (min-width: 901px) {
    #mainMenu.v10Home { --tb-nav-b: 28px; --tb-nav-t: 52px; }
  }
}
```
