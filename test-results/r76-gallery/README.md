# JOB-1819 r76 gallery

Open [index.html](index.html) with the sibling `before/` and `after/` folders present. Each comparison keeps before on the left and after on the right, at both requested viewport sizes. This folder is an unhosted review artifact.

```text
Gallery scope
Before: gameplay/bug-list-1 @ 2f3865feca484223ac7d267d83a9c4828bad3078
After: codex/job-1816-r76-integration @ d5695bd7979d72831be70e617ce4fad4b898d95c
Sizes: desktop 1920x1080 and phone 393x852, DPR 1, Chromium 149, en-US.
All screens are local fixture renders. The copied gallery tools stay in /tmp/gallery. No app files or existing tests changed in JOB-1819.

Checks (each ran once on the integration head; no fixes/retries)

syntax
POS10 syntax: 355 active source files, 0 failures

contracts
POS10 selected deterministic census failed in 6/197 contract(s):
- tests/contracts/static-app-release-contracts.cjs: exit 1
- tests/contracts/final-polish-presentation.cjs: exit 1
- tests/contracts/browser-journey-emulator-switch-contracts.cjs: exit 1
- tests/contracts/v10-transfer-contracts.cjs: exit 1
- tests/contracts/v10-club-contracts.cjs: exit 1
- tests/contracts/reus-gate-startup-contracts.cjs: exit 1

ops
ℹ suites 0
ℹ pass 73
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1351.239747

budget
PASS Firestore budget contracts: 16 checks, measured reads/min 3.4 / 0.0 / 3.0 / 1.8 / 60.0 (waiting <= 5 reads/min, hidden 0, idle writes 0, partner update <= 1000 ms).

reus
AssertionError [ERR_ASSERTION]: startup gzip 37569 must stay <= 37495
    at Object.<anonymous> (/workspace/fifa17-career-showdown2/tests/contracts/reus-gate-startup-contracts.cjs:29:8)

The six contract failures are inherited startup gzip size checks. This picture-only job does not change the 37,569-byte startup bundle. CE2PG could not begin the journey: the demo Auth/Firestore emulators started, but the unmodified harness failed with ENOENT for node_modules/firebase/firebase-app.js. No journey JSON, seasons, checks or reads/writes were produced. The failed run was not retried.

Not done / unsure
- home-free-limit-phone-393x852.webp: the quota notice covers soundtrack controls.
- connect-players-free-limit-phone-393x852.webp: a clipped strip of the underlying Home runtime notice leaks above the phone navigation bar after quota.
- club-phone-393x852.webp and club--confirmation-phone-393x852.webp: a large empty stadium band remains above the small manager figures; confirm intended composition.
- new-showdown-phone-393x852.webp and select-league-phone-393x852.webp: generic application header remains above artwork; confirm adopted phone design.
- rivalry / rivalry-mid-showdown, both sizes: Transfer Signings remains Unavailable; provider fixtures do not supply transfer summaries.
- Minor text/animation rendering differences remain in otherwise identical views. The comparisons JSON records every differing filename, and the PR lists all affected screen groups.
- Trophy Room MORE shows identical figures when opened by coordinate touch. The r75 label-targeted click was intercepted by its transparent checkbox; screenshots alone do not prove the label interaction fix.
- These are seeded local renders, not a completed two-device shared journey or production proof. Claude's full browser verification and publication remain outstanding.

Capture coverage
62 before/after pairs (124 WebP images): all 14 core screens, Loading, Daniel/Nik/Draw/pending Final Winner, phone HONOURS, Champion reached after published Results, season-2 Home chip/tile, mid-Showdown Standings/Rivalry, Career Statistics rivalry button, Trophy Room MORE, free-limit Home/Connect Players, club confirmation, four transfer phases and the lower Season Results review/actions area.

Capture tooling
The supplied capture.cjs imports a missing screens.cjs. Reconstructed temporary routes from repository browser audits; corrected local paths, Chromium launch, exact viewports, WebP conversion and comparison builder. A disabled r75 Standings tab is captured without forcing a click. Real optional-module loading precedes Rivalry rendering. No product source or existing test was changed. Initial temporary-harness errors were repaired before assembling the final artifact.

```

Validation

```text
PASS gallery integrity: 62 before/after pairs; both exact viewports; all images WebP, linked and present; no capture failures; 13,679,492 bytes < 25 MB.
PASS gallery page {"width":1440,"scrollWidth":1440,"images":124,"broken":[],"pairs":62,"sideBySide":true}
PASS gallery page {"width":393,"scrollWidth":393,"images":124,"broken":[],"pairs":62,"sideBySide":true}
```

The complete shot inventory, diagnostics and source heads are in the two manifests; [comparisons.json](comparisons.json) lists every pair and its pixel difference. Source images are the exact local Chromium viewport renders compressed to WebP at quality 80. No dimensions or design styles were changed. Rendering-only variance is explicitly distinguished from visible product changes in the HTML captions.
