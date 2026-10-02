# Team G gameplay factory board

Kept by the Claude Team G lead. Workers read this; only the lead edits it.
Updated: 2026-10-02 00:55 UTC
Home: `main` @ `2de2373` (r51). Integration branch: `gameplay/recovery-v1` (cut from `main` @ `2de2373`).
Data contract: `project-documents/leads/DATA_CONTRACT_V1.md` on branch `leads/relay`.

## Start next (Nik)

**Start 0 (normal chat) and 1 (Work-mode chat).**
Next after those: 3, then 2.

## Jobs

| Job | Title | Mode | Depends on | Code branch | State |
| --- | --- | --- | --- | --- | --- |
| 00 | Factory smoke test | plain chat | none | `gameplay/job-00-smoke` (test only) | READY |
| 01 | Fast regression CI on every gameplay push | Work mode | none | `gameplay/job-01-fast-ci` | READY |
| 02 | Two-manager journey on the emulator (provider level) | Work mode | 01 | `gameplay/job-02-two-manager-journey` | READY after 01 |
| 03 | Pure shared career model + tests | Work mode | none | `gameplay/job-03-career-model` | READY |
| 02b | Two-manager browser journey (needs a localhost-only emulator switch) | Work mode | 02 | | not written yet |
| 04 | Renderer seams: screens take a model, never the local path | Work mode | 03 | | not written yet |
| 05 | Active Showdown adapter (Rivalry, Continue, `tiebreak`, final `state`) | Work mode | 03 | | not written yet |
| 06 | Start/Join view model + `nav.locked` | Work mode | 03 | | not written yet |
| 07 | Career index Rules + client + emulator proofs (Codex review) | Work mode | 01, 02 | | not written yet |
| 08 | Completed-only read grant + session-free reader (Codex review) | Work mode | 07 | | not written yet |
| 09 | Closed-Showdown adapter into the career model | Work mode | 03, 08 | | not written yet |
| 10 | Transfer history, completed only (Codex review) | Work mode | 08 | | not written yet |
| 11 | Contract fixtures generated from the real model | Work mode | 03, 05 | | not written yet |
| 12 | Composed production Rules regression (Codex review) | Work mode | 07, 08 | | not written yet |
| 13 | Remove the r43 containment, bind `#trophyRoomButton` | Work mode | approved visual package | | waits |
| 14 | Acceptance: directive §12 and Sol's 8 proofs on the emulator | Work mode | 04 to 13 | | waits |
| 15 | One real two-device run with Nik | Nik | 14 | | waits |

## Lead notes

- G-2 is split (G2V-001R2): the app has no emulator hook today, so 02 proves the journey at provider level and 02b adds the browser journey after a localhost-only switch.
- Fast CI (01) runs on pushes to `gameplay/**` only; this factory branch holds docs and status files.
- Lead task, not a worker job: one small docs PR into `main` adding a "Gameplay factory" section to `AGENTS.md`, under POS20 gates with Nik's OK.
- Bugs found by 02 or later tests become new jobs here, numbered from 16, each with a failing test first.
