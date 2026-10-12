# JOB-1647 loading-screen evidence

The branch starts from `gameplay/bug-list-1` at `c49f823097acef21528a641a51c772f4b47a359a` (JOB-1635, PR #680).
The approved PHONE_LOADING and NEXT_LOADING pictures were opened from `factory/v1-wtt5ye` before implementation.

The loading scene now owns its final composition in `css/app.css`. The old loader rules in r3, r2 and offline CSS are removed. It reuses the licensed Reus source, the existing Home gold brush wordmark, the shared stadium plate and a local shared font. No image files were added and no frozen Team V file was edited. Existing markup, words, accessibility attributes, startup timing and exit fade remain unchanged.

The offline contract and loading visual audit re-pin the old reserved top band to zero and the crop anchor to `54% 0`. Desktop now fills the approved diagonal photo region. Existing source-retention, browser/standalone stability, request/error, credit, and viewport assertions remain in place. The new first-paint audit additionally delays r3, then adds r2 and offline CSS, and requires exactly equal label geometry/styles before and after; it checks both device and actual app reduced-motion settings at every requested size.

| Protected startup measurement | Before | After | Limit |
| --- | ---: | ---: | ---: |
| Initial CSS + seven scripts, raw bytes | 159344 | 158364 | 165000 |
| Initial CSS + seven scripts, gzip level 9 | 37331 | 37274 | 37500 |
| Browser journey startup gzip counter | 37331 | 37274 | 37500 |

Baseline headless screenshots were captured at all 12 sizes before edits. Final screenshots are embedded in [loading-screen-screenshots.pdf](loading-screen-screenshots.pdf), one viewport per page. [geometry.json](geometry.json) records first and late-style geometry at 360x640, 375x553, 393x660, 390x844, 430x932, 740x360, 844x390, 768x1024, 820x1180, 1366x768, 1280x800 and 1920x1080. All required words and photo credit fit, and the loader has no horizontal or vertical scrolling.

Checks (Chromium 149):

- `node scripts/pos10-syntax.mjs`: 349 active source files, 0 failures.
- `npm run -s test:contracts`: 153/153 current blocking contracts PASS.
- `npm run -s test:ops`: 73 passed, 0 failed, 0 skipped.
- `node tests/browser/v10-screen-flash-audit.cjs`: PASS. The existing audit reports its three season-dependent routes as unavailable without a completed Showdown fixture; no audit code was changed.
- `node tests/browser/loading-visual-audit.cjs`: standalone/mobile startup composition regression audit PASS, including the original browser and installed-app source-retention checks.
- `node tests/browser/loading-first-paint-audit.cjs`: 12/12 viewports PASS, with visible labels, no overflow, stable later CSS and both reduced-motion modes.

For local reproduction, serve the repository on port 4173. This cloud runtime needs `CMS_CHROMIUM_MULTI_CONTEXT=1` for the existing browser audits. The new first-paint audit selects the same supported multi-context Chromium configuration itself. `CMS_TEST_RESULTS` chooses a scratch directory for screenshots and geometry.
