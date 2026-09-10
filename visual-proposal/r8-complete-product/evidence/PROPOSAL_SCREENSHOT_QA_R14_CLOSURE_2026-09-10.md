# R8 Proposal Screenshot QA — r14 Closure Slice — 2026-09-10

Status: INTERNAL CLOSURE EVIDENCE — NOT OWNER APPROVAL

Production reconciliation anchor: `97c28b1efea6ee6e901e6076a834ec419cbad5aa` / `1.9.1-r14`.

Proposal branch: `developer/r8-26-complete-proposal-asset-build-r13-work`.

This evidence records the first final-capture candidates produced after the Audius-first media decision, Home readability correction, exact frozen-master recovery and r14 Journey Reconnect reconciliation.

## Renderer path

The system Chromium build exposed organization policy that blocks ordinary `127.0.0.1` and `file:` navigation. Those blocked pages are not QA evidence.

A bounded CDP renderer was therefore used instead:

1. create an `about:blank` target;
2. apply the requested device metrics;
3. inject the exact proposal HTML with `Page.setDocumentContent`;
4. inline only the proposal's local asset references as data URIs;
5. wait for document/image completion;
6. capture the rendered document.

This does not alter proposal HTML semantics and avoids dependence on an external screenshot service. It also preserves the zero-dollar constraint.

## Frozen master verification at render time

The local render copies were byte-for-byte copied from the already verified frozen authorities.

### A01 Nik

- file used: `a01-nik-core-thinking-hero.png`
- SHA-256: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`
- role: right-side wide Home character

### A02 Daniel

- file used: `a02-daniel-core-pointing-hero.png`
- SHA-256: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`
- role: left-side wide Home character

Manager mapping remains `Manager 1 = Daniel`, `Manager 2 = Nik`.

## Home capture candidates

The Home composition was first revised to raise its typography floor before capture. The earlier 7–9px metadata treatment was not accepted for final review.

### H-1 — wide dual-character Home

- viewport: `1600 x 900`
- local evidence file: `H-1-home-wide-data.png`
- screenshot SHA-256: `c699a8c66a3d01ea6edec71215e3aac04c3d29e54a2134c9f6ec55e58d6b918b`
- A02 Daniel left: PASS
- A01 Nik right: PASS
- central action safe zone: PASS
- six Home actions visible: PASS
- Audius Showdown Radio compact state visible: PASS
- no YouTube music fallback copy: PASS
- character/control collision: PASS
- horizontal overflow: PASS
- status: `FINAL-CAPTURE CANDIDATE`, pending final-main recheck and owner review

### H-2 — Chromebook / character-free Home

- viewport: `1024 x 768`, full-page capture
- local evidence file: `H-2-home-chromebook-1024.png`
- screenshot SHA-256: `21ab1dc07617ba79cf45bc1f82dbc76446177d89f56d927c397d407b3a6d231f`
- large character art omitted under the <=1179px contract: PASS
- all six actions visible without character interference: PASS
- compact Audius player visible: PASS
- no horizontal overflow: PASS
- status: `FINAL-CAPTURE CANDIDATE`, pending final-main recheck and owner review

A separate `1220 x 800` exploratory capture proved that the optional 1180–1279 reduced-wide character treatment can fit, but it is not the canonical Chromebook owner-review image because the explicit Chromebook contract is safer at the character-free breakpoint.

### H-3 — mobile Home

- width class: `390px`, full-page capture
- local evidence file: `H-3-home-mobile-full.png`
- screenshot SHA-256: `a12d958d9d6f756fd8e0a2f1b3b86330b1d36a6b7d2a710f813ab65a904dd270`
- large characters omitted: PASS
- six Home actions readable: PASS
- Audius player stacks without horizontal overflow: PASS
- Play / Previous / FIFA 17 Picks hierarchy readable: PASS
- provider disclosure visible: PASS
- status: `FINAL-CAPTURE CANDIDATE`, pending final-main recheck and owner review

## r14 Journey Reconnect capture candidates

Prototype authority: `prototypes/28-journey-reconnect-r14-reference.html`.

### JR-1 through JR-5 — five-state desktop review sheet

- viewport class: wide review sheet
- local evidence file: `JR-1-5-review-wide.png`
- screenshot SHA-256: `41a9320400bdc3a032e9b156cd970413d763721965ce096a67d008990d17d882`
- `OFFLINE_HOLD`: PASS
- `RECOVERY_PENDING`: PASS
- resumable `FRESH_SESSION_REQUIRED`: PASS
- `ACTIVE_RECOVERED`: PASS
- `TERMINAL_RECOVERED`: PASS
- non-authoritative vs recovered-authoritative distinction: PASS
- no invented reset/join workflow: PASS
- terminal state has no next-season resurrection cue: PASS
- status: `FINAL-CAPTURE CANDIDATE`, pending final-main recheck and owner review

### JR-3-mobile — longest action-required mobile representative

- width class: `390px`, full-page capture
- local evidence file: `JR-3-mobile-full.png`
- screenshot SHA-256: `26542ac88adfa6544acd1bc12b5da0cf786408ffd1cbe5dbb1426b6efdb0910e`
- full recovery copy remains readable: PASS
- no horizontal overflow: PASS
- state cards grow naturally: PASS
- phase and authority labels remain text-explicit: PASS
- status: `FINAL-CAPTURE CANDIDATE`, pending final-main recheck and owner review

## Important non-results

The blocked `127.0.0.1` / `file:` Chromium policy pages are explicitly excluded and must never be included in the owner package.

These captures are also not evidence that Audius network playback has passed the owner's iPhone Safari and Chromebook functional matrix. Visual rendering and provider playback proof are separate gates.

## Closure impact

The Home visual-asset blocker is no longer a rendering blocker: exact A01/A02 bytes can be supplied to the review renderer and produce the intended wide composition. Repository byte-safe placement of the PNG authorities remains a separate packaging/integration issue.

r14 Journey Reconnect is now both contractually and visually represented, so it no longer remains an unmodeled main-product drift item.

Owner approval remains `NO` for every row until the complete final screenshot set is presented together after the final `main` recheck.