# Lead check · 1002 · V · Transfer War window strings

PASS (2026-10-06 00:10 UTC). Diff: two values in slice-02-plate/fixtures.json plus the status file, nothing else.

- Desktop 1366x768 and 1920x1080: the window sign wraps to "TRANSFER WINDOW LIVE / BUILD YOUR FIFA 17 SQUAD" inside the board; "REQUEST EARLY END" fits its button on Nik's card.
- Phone 390x664, 360x640, 375x553: the status bar line fits on one line with the timer, no overflow, no scroll.
- Not from this job (same on the old strings): in the standalone phone preview the end button sits under the footer bar and does not show, and render-qa.cjs times out clicking it ("world intercepts pointer events"). Production renders its own button there, so the live game is unaffected.
