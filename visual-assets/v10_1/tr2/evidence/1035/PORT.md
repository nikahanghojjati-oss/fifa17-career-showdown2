# PORT · JOB-1035 · Transfer War on a sideways phone (HO-021 part 2)

**For Team G (Studio Z), to put on main.** CSS only. No markup, script, art or backend change.

## What to do

1. Open `css/v10Transfer.css` (release r63 = PR #427; the same file is on `origin/main` once #427 is merged).
2. Paste the whole block below at the **very end** of the file, after the JOB-1031 block. Order matters: it must come after every other rule, because it overrides the Studio Z7 `max-height: 500px` rule and the production button-width rules.
3. Nothing else. `js/transferScreenV10.js` is untouched; the phone art is the existing upright-phone art (`visual-assets/v10_1/tr2/slice-02-plate/assets/ENV_TRANSFER_PHONE_V1.webp`, `OVL_TRANSFER_DANIEL_PHONE_V2.webp`, `OVL_TRANSFER_NIK_PHONE_V2.webp`). The block loads them as CSS backgrounds with paths relative to `css/` (`../visual-assets/...`), so keep the block in `css/v10Transfer.css`. If your release process pins or hashes `css/v10Transfer.css` (service-worker cache version, manifest, contract tests), bump it the usual way for a CSS edit.

The same text is saved as `visual-assets/v10_1/tr2/evidence/1035/added-rules.css`.

## Where it switches on

`@media (orientation: landscape) and (max-height: 500px) and (pointer: coarse)`: a touch phone held sideways. A desktop window (pointer: fine), a tablet (taller than 500 px) and every upright phone never match, so all other sizes are unchanged. The existing Studio Z7 rule (`max-height: 500px` and landscape) stays; the new block simply wins after it on touch phones.

## What it does (844x390, 932x430)

- Left strip (about 26 % of the width, 196 to 250 px): TRANSFER WAR wordmark, Daniel LEFT and Nik RIGHT (the existing upright-phone cut-outs, never mirrored), and the phase status with the live clock under it (production's own status text; the clock uses the same `data-clock` hook as the upright phone).
- Main area: the viewer's entry card fills it. The privacy note is its own line above the fields, every field shows its full placeholder at 16 px text, LOCK MY SIGNINGS / LOCK MY GUESSES / REQUEST EARLY END are full width and 44 px tall. Only the three entry rows may scroll inside the card; LOCK stays visible.
- Slim row under the card: the rules caption and the rival's sealed card. Daniel's panel is always left of Nik's (`data-panel="B"` Daniel, `"A"` Nik), so when Nik is the viewer the sealed Daniel card moves left, never the art.
- Verdicts: Daniel's and Nik's glasses side by side (Daniel left), CONTINUE full width below.
- Rail: HOME, progress, REFRESH are 44 px tall in a 52 px bar.
- At 901 px wide and up the shared top bar shows and `plate.css` starts the stage under it; the strip starts there too (`--ls-top`).
- Keyboard safety net: if a software keyboard shrinks the viewport below 330 px high, the main area scrolls instead of squeezing the fields.

## Result on r63 (layout audit, `tools/layout-audit`, sizes added as `844x390` and `932x430`)

| size | tap-target | overlap | text-clipped | page-scroll | all rules |
| --- | ---: | ---: | ---: | ---: | ---: |
| 844x390 before | 27 | 0 | 0 | 0 | 27 |
| 844x390 after | 0 | 0 | 0 | 0 | 0 |
| 932x430 before | 27 | 0 | 0 | 0 | 27 |
| 932x430 after | 0 | 0 | 0 | 0 | 0 |

Also checked with 9 extra states (Nik as viewer, locked guesses, locked signings with a 35-character name, early end requested, an error line, verdicts with three rows each): 0 findings at both sizes. 393x660, 375x553, 360x560, 1366x650 and 1440x900: 0 findings before and after, and 17 of 20 captures pixel-identical; the other 3 differ only by the live countdown digit and second hand (and a 21x8 px glint on the YOU chip), not by CSS.

## The CSS

```css
/* JOB-1035 (HO-021 part 2): Transfer War on a phone held sideways (844x390, 932x430, touch).
   Append to css/v10Transfer.css, after every other rule. CSS only: no markup, script or art changes.

   Composition: a narrow poster strip on the left (the TRANSFER WAR wordmark, Daniel LEFT and Nik RIGHT as the same two
   phone cut-outs the upright phone uses, never mirrored, and the phase status). Next to it Daniel's entry card fills the
   main area, with a slim row under it (the rules caption and Nik's sealed card; Daniel's panel always sits left of
   Nik's). The primary action sits full width at the bottom of the card, the privacy note on its own line above the
   fields, and the HOME / progress / REFRESH rail stays a 52 px bar. Nothing scrolls except the three entry rows. */
@media (orientation: landscape) and (max-height: 500px) and (pointer: coarse) {
  #transferChallenge .tw-host {
    --ls-strip: clamp(196px, 26vw, 250px);
    --ls-foot: 52px;
    --ls-top: 0px;
    --ls-line: rgba(242, 196, 91, .34);
  }

  /* ---- frame: fixed stage, no desktop plate, no scaling ---- */
  #transferChallenge .tw-host .stage {
    z-index: 1; background: transparent; overflow: hidden; --footer-h: var(--ls-foot);
  }
  #transferChallenge .tw-host .stage::before { content: none; }
  #transferChallenge .tw-host .world {
    position: absolute; inset: 0 0 var(--ls-foot) 0; left: 0 !important; top: 0 !important;
    width: auto !important; height: auto !important; transform: none !important; box-shadow: none;
    box-sizing: border-box; padding: 6px 12px 4px 0;
    display: grid; grid-template-columns: var(--ls-strip) minmax(0, 1.35fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto; column-gap: 10px; row-gap: 5px;
  }
  /* Nik's own card puts his slim row on the left, so the wide column follows the viewer's card */
  #transferChallenge .tw-host .world:has(.panel.own[data-panel="A"]:not(.verdict)) { grid-template-columns: var(--ls-strip) minmax(0, 1fr) minmax(0, 1.35fr); }
  #transferChallenge .tw-host .world:has(.panel.verdict) { grid-template-columns: var(--ls-strip) minmax(0, 1fr) minmax(0, 1fr); }
  #transferChallenge .tw-host .scene { display: contents; }
  #transferChallenge .tw-host .scene::after,
  #transferChallenge .tw-host .scene-atmos,
  #transferChallenge .tw-host .plane { display: none; }
  #transferChallenge .tw-host .m-only { display: inline-flex !important; }
  #transferChallenge .tw-host .d-only { display: none !important; }

  /* ---- poster strip: existing upright-phone art, Daniel left, Nik right ---- */
  #transferChallenge .tw-host .phone-hero-art {
    display: block; position: absolute; left: 0; top: var(--ls-top); bottom: 0; width: var(--ls-strip); z-index: 0;
    overflow: hidden; pointer-events: none; background: #070604; border-right: 1px solid var(--ls-line);
  }
  #transferChallenge .tw-host .phone-hero-art::after {
    content: ""; position: absolute; inset: 0; z-index: 4;
    background: linear-gradient(to bottom, rgba(7, 6, 4, .55) 0, rgba(7, 6, 4, 0) 22%, rgba(7, 6, 4, 0) 44%, rgba(7, 6, 4, .94) 74%, #070604 100%);
  }
  #transferChallenge .tw-host .phone-hero-art img { display: none; }
  #transferChallenge .tw-host .phone-hero-bg {
    position: absolute; inset: 0; display: block; z-index: 1;
    background: url("../visual-assets/v10_1/tr2/slice-02-plate/assets/ENV_TRANSFER_PHONE_V1.webp") 4% 34% / auto 165% no-repeat;
  }
  #transferChallenge .tw-host .phone-hero { position: absolute; display: block; transform: none; pointer-events: none;
    background-repeat: no-repeat; background-size: 100% 100%;
    -webkit-mask-image: linear-gradient(to bottom, #000 76%, transparent 100%); mask-image: linear-gradient(to bottom, #000 76%, transparent 100%); }
  #transferChallenge .tw-host .phone-hero-daniel {
    left: -8px; top: 44px; width: 148px; height: calc(148px * 608 / 701); z-index: 3;
    background-image: url("../visual-assets/v10_1/tr2/slice-02-plate/assets/OVL_TRANSFER_DANIEL_PHONE_V2.webp");
    filter: drop-shadow(-2px 0 5px rgba(245, 197, 24, .24)) drop-shadow(0 8px 10px rgba(0, 0, 0, .58));
  }
  #transferChallenge .tw-host .phone-hero-nik {
    right: -12px; top: 50px; width: 156px; height: calc(156px * 781 / 925); z-index: 2;
    background-image: url("../visual-assets/v10_1/tr2/slice-02-plate/assets/OVL_TRANSFER_NIK_PHONE_V2.webp");
    filter: drop-shadow(2px 0 5px rgba(245, 197, 24, .24)) drop-shadow(0 8px 10px rgba(0, 0, 0, .58));
  }
  #transferChallenge .tw-host .transfer-wordmark {
    display: block; position: relative; z-index: 5; grid-area: 1 / 1 / 3 / 2; align-self: start; justify-self: center;
    width: calc(var(--ls-strip) - 28px); margin: 2px 0 0; padding: 0;
    filter: drop-shadow(0 3px 3px rgba(0, 0, 0, .9)) drop-shadow(0 0 10px rgba(242, 196, 91, .22));
  }
  #transferChallenge .tw-host .transfer-wordmark img { display: block; width: 100%; height: auto; }

  /* status: the lower third of the strip (production's own status line; the live clock rides under it) */
  #transferChallenge .tw-host .sign-status.reg {
    position: relative; left: auto; top: auto; width: auto; height: auto; transform: none; z-index: 5;
    grid-area: 1 / 1 / 3 / 2; align-self: end; justify-self: stretch; margin: 0;
    flex-direction: column; align-items: center; justify-content: flex-end; gap: 2px; padding: 0 12px 4px;
    white-space: normal; text-align: center; font-size: 12px; letter-spacing: .12em; line-height: 1.12; background: none;
  }
  #transferChallenge .tw-host .sign-status .sep { display: none; }
  #transferChallenge .tw-host .sign-status .part { display: block; }
  #transferChallenge .tw-host .sign-status .part:first-child,
  #transferChallenge .tw-host .sign-status.full.lead .part:first-child {
    color: var(--gold-hot); font-weight: 700; font-size: 14px; letter-spacing: .1em; line-height: 1.1;
    background: none; -webkit-text-fill-color: currentColor; filter: none;
  }
  #transferChallenge .tw-host .sign-status[data-clock]::after {
    content: attr(data-clock); display: block; margin-top: 2px; font-weight: 700; font-size: 26px; line-height: 1; letter-spacing: .04em;
    color: #F6C75E; font-variant-numeric: tabular-nums; text-shadow: 0 0 6px rgba(255, 186, 64, .55);
  }
  /* the board clock lives in the hidden desktop plane; the strip shows it via data-clock above */
  #transferChallenge .tw-host .sign-screen { display: none; }

  /* ---- glass: flat gold-edged dark cards (no 9-slice, no clip) ---- */
  #transferChallenge .tw-host .panel {
    position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; margin: 0;
    clip-path: none; border-radius: 5px; box-sizing: border-box;
    background: linear-gradient(180deg, rgba(36, 28, 14, .94), rgba(10, 9, 6, .97));
    border: 1px solid rgba(242, 196, 91, .50);
    box-shadow: inset 0 1px 0 rgba(255, 232, 160, .30), inset 0 0 18px rgba(242, 196, 91, .07), 0 6px 16px rgba(0, 0, 0, .50);
  }
  #transferChallenge .tw-host .panel.own { border-color: rgba(255, 211, 77, .78); box-shadow: inset 0 1px 0 rgba(255, 232, 160, .42), inset 0 0 22px rgba(242, 196, 91, .10), 0 6px 16px rgba(0, 0, 0, .50), 0 0 18px rgba(242, 196, 91, .20); }
  #transferChallenge .tw-host .panel.own:not(.verdict) { grid-area: 1 / 2 / 2 / 4; }
  #transferChallenge .tw-host .panel.sealed[data-panel="B"] { grid-area: 2 / 2; }
  #transferChallenge .tw-host .panel.sealed[data-panel="A"] { grid-area: 2 / 3; }
  #transferChallenge .tw-host .panel.verdict[data-panel="B"] { grid-area: 1 / 2; }
  #transferChallenge .tw-host .panel.verdict[data-panel="A"] { grid-area: 1 / 3; }
  #transferChallenge .tw-host .rules-card { grid-area: 2 / 2; position: relative; min-width: 0; align-self: center; }
  #transferChallenge .tw-host .world:has(.panel.own[data-panel="A"]:not(.verdict)) .rules-card { grid-column: 3; }
  #transferChallenge .tw-host .rules-card.with-continue { grid-area: 2 / 2 / 3 / 4; align-self: stretch; }

  #transferChallenge .tw-host .panel-title {
    position: relative; left: auto; top: auto; width: auto; height: auto; min-height: 28px; margin: 4px 12px 0;
    padding: 0; gap: 8px; align-items: center; justify-content: flex-start; flex: none;
  }
  #transferChallenge .tw-host .panel-title::before {
    content: ""; flex: none; width: 20px; height: 12px;
    background: repeating-linear-gradient(115deg, var(--sd-gold-500, #f5c518) 0 3px, transparent 3px 7px); opacity: .85;
  }
  #transferChallenge .tw-host .panel-title .own-heading { transform: none; font-size: 17px; letter-spacing: .06em; }
  #transferChallenge .tw-host .panel-title .chip { height: 22px; padding: 0 9px; font-size: 11.5px; }
  #transferChallenge .tw-host .panel-title .chip-private { margin: 0 0 0 auto; }
  #transferChallenge .tw-host .panel-title .chip-private + .chip-you { margin-left: 0; }
  #transferChallenge .tw-host .panel-title > .chip-you:last-child:not(.chip-private + .chip-you) { margin-left: auto; }
  #transferChallenge .tw-host .panel-body {
    position: relative; left: auto; top: auto; width: auto; height: auto; flex: 1 1 auto; min-height: 0;
    display: flex; flex-direction: column; justify-content: flex-start; gap: 5px; padding: 3px 12px 8px;
  }
  #transferChallenge .tw-host .panel-body::before { inset: 3px 6px; }
  /* the privacy note, the fields, the primary action and the error each get their own line, in that order */
  #transferChallenge .tw-host .action-row { display: contents; }
  #transferChallenge .tw-host .privacy-note { order: 0; flex: none; font-size: 12.5px; line-height: 1.2; }
  #transferChallenge .tw-host .guess-cols,
  #transferChallenge .tw-host .signing-rows { order: 1; flex: 1 1 auto; min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; padding: 1px 0; }
  #transferChallenge .tw-host .btn-lock { order: 2; }
  /* an error takes the privacy note's line, so the card never grows and LOCK never moves */
  #transferChallenge .tw-host .error-line { order: 0; flex: none; font-size: 12.5px; line-height: 1.2; }
  #transferChallenge .tw-host .phase-signing .error-line { flex: none; }
  #transferChallenge .tw-host .panel-body:has(.error-line:not(:empty)) .privacy-note { display: none; }

  /* ---- fields: 16 px text, 40 px rows ---- */
  #transferChallenge .tw-host .guess-cols { display: flex; flex-direction: column; gap: 4px; }
  #transferChallenge .tw-host .guess-col { display: grid; grid-template-columns: 22px minmax(0, .8fr) minmax(0, 1.2fr); align-items: center; gap: 6px; }
  #transferChallenge .tw-host .signing-rows { gap: 4px; }
  #transferChallenge .tw-host .signing-row.signingRow:not(.is-readonly) { grid-template-columns: 22px minmax(0, .9fr) minmax(0, 1.2fr) minmax(0, 1fr); gap: 6px; }
  #transferChallenge .tw-host .guess-num { font-size: 13px; }
  #transferChallenge .tw-host :is(.guess-col select, .guess-col input, .signing-row input) {
    height: 38px; min-height: 38px; font-size: 16px; padding: 0 9px; border-radius: 3px;
  }
  #transferChallenge .tw-host .guess-col select { padding-right: 26px; background-position: calc(100% - 15px) 55%, calc(100% - 10px) 55%; background-size: 5px 5px; }
  #transferChallenge .tw-host :is(.guess-col input, .signing-row input)::placeholder { font-size: 14px; letter-spacing: 0; }
  #transferChallenge .tw-host .signing-row.is-readonly { grid-template-columns: 22px minmax(0, 1fr); gap: 8px; min-height: 36px; }

  /* ---- actions: 44 px and up ---- */
  #transferChallenge .tw-host :is(.btn-lock, .btn-end, .btn-continue),
  #transferChallenge .tw-host :is(.btn-end, .btn-lock, .btn-continue).menuButton,
  #transferChallenge .tw-host #completeTransferChallenge.btn-lock {
    position: relative; left: auto; right: auto; bottom: auto; width: 100%; min-height: 44px; height: 44px; margin: 0; flex: none;
    font-size: 17px; letter-spacing: .1em;
  }
  #transferChallenge .tw-host .btn-continue { height: auto; padding: 4px 8px; font-size: 14px; letter-spacing: .08em; }
  #transferChallenge .tw-host .phase-signing .btn-lock { height: 44px; }
  #transferChallenge .tw-host .window-body { justify-content: space-between; gap: 8px; padding: 6px 12px 8px; }
  #transferChallenge .tw-host .f1-brief { max-width: none; font-size: 21px; line-height: 1.15; }
  #transferChallenge .tw-host .end-row { justify-content: stretch; }

  /* ---- slim row: rules caption + Nik's sealed card ---- */
  #transferChallenge .tw-host .rules-inner,
  #transferChallenge .tw-host .rules-card.with-line .rules-inner {
    position: relative; left: auto; top: auto; width: auto; height: auto; padding: 0 2px; gap: 3px; justify-content: center;
  }
  #transferChallenge .tw-host .rule-note,
  #transferChallenge .tw-host .rules-card.with-line .rule-note,
  #transferChallenge .tw-host .lock-summary { font-size: 12.5px; line-height: 1.2; text-align: left; color: var(--cream-dim); text-shadow: none; }
  #transferChallenge .tw-host .rules-line { justify-content: flex-start; gap: 14px; }
  #transferChallenge .tw-host .rules-line .stat { flex-direction: row; align-items: baseline; gap: 4px; }
  #transferChallenge .tw-host .rules-line .stat-n { font-size: 17px; }
  #transferChallenge .tw-host .rules-line .stat-l { font-size: 12px; margin: 0; }
  #transferChallenge .tw-host .panel.sealed { min-height: 52px; align-items: stretch; justify-content: center; }
  #transferChallenge .tw-host .panel.sealed .panel-title { margin: 0 12px; min-height: 52px; z-index: 2; }
  #transferChallenge .tw-host .panel.sealed .chip-sealed { margin-left: auto; }
  #transferChallenge .tw-host .panel.sealed .reg.frost { position: absolute; left: 8px; right: 8px; top: 6px; bottom: 6px; width: auto; height: auto; z-index: 1; place-items: center; }
  #transferChallenge .tw-host .panel.sealed .seal { width: 34px; height: 34px; }
  #transferChallenge .tw-host .rival-name { font-size: 15px; }

  /* ---- Verdicts: both glasses side by side (Daniel left, Nik right), the continuation full width below ---- */
  #transferChallenge .tw-host .panel.verdict .panel-body { padding: 2px 12px 8px; gap: 4px; overflow-y: auto; overscroll-behavior: contain; }
  #transferChallenge .tw-host .verdict-heading { font-size: 16px; }
  #transferChallenge .tw-host .verdict-rows { gap: 2px; }
  #transferChallenge .tw-host .verdict-row { grid-template-columns: 22px minmax(0, 1fr) auto; gap: 7px; padding: 1px 0 2px; }
  #transferChallenge .tw-host .vr-name { font-size: 14.5px; white-space: normal; overflow-wrap: anywhere; }
  #transferChallenge .tw-host .vr-meta { white-space: normal; }
  #transferChallenge .tw-host .vr-meta { font-size: 12px; }
  #transferChallenge .tw-host .vr-word { font-size: 14px; }
  #transferChallenge .tw-host .vr-why { font-size: 11.5px; }
  #transferChallenge .tw-host .verdict-empty { font-size: 15px; padding: 4px 0; }
  #transferChallenge .tw-host .guess-reveal { font-size: 12.5px; column-gap: 8px; }
  #transferChallenge .tw-host .rules-card.with-continue .rule-note { display: none; }
  #transferChallenge .tw-host .rules-card.with-continue .rules-inner { padding: 0; }

  /* ---- HUD rail: HOME, progress, REFRESH ---- */
  #transferChallenge .tw-host .hud-footer {
    position: absolute; left: 0; right: 0; bottom: 0; height: var(--ls-foot); padding: 0 12px; gap: 10px; z-index: 5;
    background: linear-gradient(to top, rgba(6, 5, 3, .98) 0%, rgba(6, 5, 3, .94) 80%, rgba(6, 5, 3, 0) 100%);
  }
  #transferChallenge .tw-host .hud-footer :is(.menuButton, .backButton) { height: 44px; min-height: 44px; min-width: 44px; padding: 0 18px; }
  #transferChallenge .tw-host .hud-mid { flex: 1; justify-content: center; gap: 18px; min-width: 0; }
  #transferChallenge .tw-host .rail { gap: 12px; }
  #transferChallenge .tw-host .rail li { font-size: 12px; }
}
/* The shared top bar shows from 901 px wide, and plate.css starts the stage below it; the strip starts there too. */
@media (orientation: landscape) and (max-height: 500px) and (pointer: coarse) and (min-width: 901px) {
  #transferChallenge .tw-host { --ls-top: var(--sd-nav-top-h, 52px); }
}

/* Safety net for a software keyboard that shrinks the viewport (not one of the audited sizes): the slim row and the
   fixed rows give way and the main area scrolls, so the focused field is never squeezed to nothing. */
@media (orientation: landscape) and (max-height: 330px) and (pointer: coarse) {
  #transferChallenge .tw-host .world { overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; grid-template-rows: auto auto; align-content: start; }
  #transferChallenge .tw-host .panel { min-height: auto; }
  #transferChallenge .tw-host .guess-cols,
  #transferChallenge .tw-host .signing-rows { overflow: visible; flex: none; }
  #transferChallenge .tw-host .panel.sealed { min-height: 52px; }
}
```
