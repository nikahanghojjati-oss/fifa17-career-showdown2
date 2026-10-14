# Firestore read/write meter (measurement tools only, never merged into the game)

Used by the Team G lead to measure r75 (`/mnt/project-files/gameplay/r75/FIRESTORE_BUDGET.md`) and by JOB-1824.
Everything runs against the local Firebase emulators on the demo project `demo-cms-browser-journey`; real Firebase hosts are
blocked (`FORBIDDEN_HOSTS` in `meter-journey.cjs`), so it never uses the live game's free daily allowance.

- `firestore-wrapper.js`: served in place of the Firebase Firestore SDK module; re-exports the real SDK and reports every
  document read and write (including transaction reads and listener deliveries) to Node via the `__cmsMeterEvent` binding.
- `meter-journey.cjs`: a copy of `tests/browser/two-manager-browser-journey.cjs` with the meter routes (lines ~106-135) and
  `park()` idle windows. Paths in it were for the lead's scratchpad: set `CMS_APP_ROOT` to the tree being measured.
- `report.js`, `analyze.js`, `perwin.js`: summaries of a meter JSON (`node report.js out.json`).
- `firebase.meter.json`: emulator ports. `RUN.md`: the lead's original command lines. `run60.analysis.txt`: sample output (r74).
