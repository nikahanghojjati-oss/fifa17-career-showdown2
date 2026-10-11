# JOB-1467 — Team V phone tap targets (stage 1 CSS reading audit)

Scope: source review on `qa/mega-audits` of exactly `css/v10Shell.css`, `css/homeV10.css`, `css/v10Transfer.css`, and `css/rulesSettingsV10.css`. Acceptance floor: 44 × 44 CSS px for each phone button, tab, and link. These are **CSS-evidenced findings, not browser-measured dimensions**; final computed size and hit-box behavior depend on the Team V base styles and rendered markup, which this ticket does not allow reading. No game file edited.

## Findings (4)

1. **Home — clickable account identity chip is only guaranteed 30 px tall.** `css/v10Shell.css:36-39` sets `#onlinePlayerIdentityBadge` to `min-height:30px` on narrow screens; `css/homeV10.css:199-200` repeats that 30 px floor in portrait. `css/homeV10.css:67` marks it as interactive (`cursor:pointer`). Smallest fix: a phone-only `@media (max-width:760px)` override for the Home badge that sets `min-height:44px` and keeps the chip in its existing position. Do not change the noninteractive season-indicator chip merely for parity.

2. **Home, short landscape — soundtrack buttons have an explicit 32 px height.** `css/homeV10.css:280-281` gives `.menuMusicControl` `height:32px` in the short-landscape composition. That is 12 px below the 44 px tap floor; its apparent label width does not compensate for deficient height. Smallest fix: phone-only override to `min-height:44px; height:44px; min-width:44px` for the actual soundtrack buttons, and make the corresponding landscape soundtrack strip at least 50 px tall to accommodate its vertical padding (`css/homeV10.css:266-270`). Keep desktop unchanged.

3. **Home, short landscape — track-sheet opener's real checkbox hit-box is 64 × 32 px.** `css/homeV10.css:282-289` sets the interactive `.phoneSheetToggle` to `width:64px; height:32px`; the adjacent `.phoneTrackSheetOpen` label is likewise 64 × 32 px but `pointer-events:none`, so the transparent checkbox is the actual tap target. Smallest fix: under the phone-only media rule, give both the input and its visual label `min-height:44px; height:44px` while preserving their overlap and existing checkbox interaction. Share the strip-height allowance in finding 2.

4. **Home, short landscape — each expanded soundtrack track row is 42 px tall.** `css/homeV10.css:294-300` creates `grid-auto-rows:42px` in the opened sheet and explicitly relaxes the `.menuMediaChoice` minimum height to zero. This can limit a clickable track choice to a 42 px cell. Smallest fix: phone-only `grid-auto-rows:minmax(44px,auto)` and `.menuMediaChoice { min-height:44px; }` while retaining the sheet's overflow scrolling and existing track selection behavior.

## Checked without additional findings

- Home portrait main menu: `css/homeV10.css:154-173` gives the six secondary tile rows a 44 px floor, a 64 px Continue row, and a 52 px soundtrack row. Portrait track-sheet rows are 46 px (`:194-195`).
- Transfer War portrait HUD: `css/v10Transfer.css:24-29` explicitly sets the HUD action minimum width and height to 44 px. This does not verify transfer inputs, lock buttons, or landscape HUD controls, whose final dimensions are defined outside the four allowed files.
- Settings: `css/rulesSettingsV10.css:38` gives its ordinary `.menuButton` a 44 px minimum height, and `:86-88` does the same for `.sd-btn`. Other controls such as `#settingsClose` and motion choices cannot be certified from this adapter file alone.
- Shell: the decorative `.sd-nav-gear::before` is 34 × 34 px (`css/v10Shell.css:97-99`), but the pseudo-element is **not** the button hit-box, so its artwork size was **not** reported as a failure.

**Breakpoint note for Team G:** The short-landscape Home rules also affect landscape phones wider than 760 CSS px (e.g. 844 px). This ticket requires phone-only remedies with `max-width:760px`; therefore remedies strictly limited to that breakpoint do **not** resolve wider landscape-phone layouts. Team G should choose an appropriate phone-landscape breakpoint as a separate scope decision rather than silently changing desktop.

**Validation required by Team G before issuing fixes:** measure bounding boxes of each interactive target in portrait and short-landscape phone viewports; verify 44 × 44 CSS px and absence of overlap. This audit did not run a browser, change production CSS, or alter game behavior.
