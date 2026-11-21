# Status · JOB-25 · G-13 part 2b: Home, music and Loading

State: MERGED
Step: done
Updated: 2026-10-04 23:37 UTC
Chat: Team G lead helper (Claude Code)
Code branch: gameplay/job-25-v10-home
Head commit: 77ed05d5c5bfa28a60c2d2e5badf6f1525b9b193
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/360 (base gameplay/recovery-v1, mergeable clean)
CI: all 16 green on the exact head: Validate Gameplay Fast (Gameplay contracts, Composed production Rules regression, Composed Rules on the emulator, Two-manager browser journey) and Validate POS20 (12, including FULL/VISUAL proofs and the exact-head cognitive seal).

## Notes
- Built on job 24 (#349, 36a0ce10, now in recovery fc95cb57; nothing else to merge). Started by Codex (draft 35db49fe).
- Team V Home on the real #mainMenu, via job 24's loader (home.css + app adapter css/homeV10.css + soundtrack.js). Product ids/text are unchanged and the Reus photo and credit stay.
- Audius: no request before Play. One persistent <audio> on <body> keeps playing across screens and is reused on return. YouTube is retired lazily, with the diagnostics nodes kept.
- Loading stays the app splash (pre-lazy startup markup; protected LOADING_VISUAL audit).
- The pair-connection panel now shows above the plate (the routing audit caught the plate covering it).
- Home images were appended at the end of job 24's F9c V10_IMAGES (append-only).
- No Codex review: Codex usage limit reached (coordinator: lead reviews).

## Self-check
- npm run test:contracts exit 0 (121/121); npm run test:ops 73/73.
- Local audits pass: home-visual, loading-visual, persistent-pair routing, offline-boundary. stability-audit fails locally the same way on the job 24 base (environment).
- startup 162809/37495, gzip 37495/37500; index.html and RUNTIME_REVISION unchanged.

## Model gaps
- Loading not skinned. Continue tile keeps Reus. No Trophy Room tile, and Legacy/Statistics stay contained. The offline line still says YOUTUBE. No entrance motion. Playback against real Audius was not run (stubbed).

## Lead merge

Merged into gameplay/recovery-v1 at 7b32ad9d (PR #360, exact head 77ed05d5, 16/16 checks), Sun 4 Oct 2026, 7:40 p.m. Boston time. The lead checked the phone and desktop screenshots.
