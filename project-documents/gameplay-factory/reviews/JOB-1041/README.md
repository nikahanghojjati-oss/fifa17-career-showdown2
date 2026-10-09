# JOB-1041 phone Season Results proof

Chromium 149 with the existing season-commit browser fixture, the live V10 adapter, and the production-rendered commit/acknowledge control. Provider reads are simulated; no remote mutation is performed. This is browser layout evidence. The lead still re-measures before merging and verifies iPhone Safari.

For each of 390×844, 430×932, 844×390 and 932×430:

- `*-acknowledge-top.png` shows the title above the tabs and symmetric portrait photos (both hidden in short landscape).
- `*-acknowledge-action.png` and `*-commit-action.png` show the respective action after one viewport-height wheel scroll on `<main>`.

The audit checks a full-height viewport scroller, no nested scrolling panel, no horizontal overflow, title/tab separation, photo geometry, action bounds and center hit testing, and opening/closing the scoring sheet in normal flow. It trial-clicks each action without a provider write.

Run a static server with `node tests/support/static-server.cjs`, then:

```sh
CMS_CHROMIUM_MULTI_CONTEXT=1 CMS_SEASON_RESULTS_SCREENSHOT_DIR=/tmp/job1041-proof node tests/browser/season-results-phone-layout-audit.cjs
```

Last output: `Season Results phone layout audit passed (4 viewports × 2 live action states).`

`desktop-comparison.json` records unchanged measurements at 1280×620, 1366×500, 1440×900 and 1920×1080 against the ticket base. The landscape phone override is bounded to 1000px so short desktop windows retain their existing port.
