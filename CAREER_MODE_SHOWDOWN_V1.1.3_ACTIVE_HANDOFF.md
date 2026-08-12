# Career Mode Showdown v1.1.3 — Active Handoff

Status: IN PROGRESS
Started: 2026-08-11 (America/New_York)
Base main SHA: `9c9ff5fe8a3361b91400e5b37b310fa7bb42f5de`
Branch: `v1.1.3-candidate-c-visual-fixes`
Previous runtime authority: `6dfea100829016eee4820b342729b8c823426f95` (`v1.1.2 / 1.1.2-r1`)

## Owner instruction — 2026-08-11

The owner asked to move toward the next build while prioritizing the following newly reported and newly requested work:

1. Investigate and fix an intermittent League Wheel defect: after the wheel stops and selects a league, but before the owner presses Next, the wheel can begin another spin/reroll and then stop on the same league.
2. Replace the James Rodríguez source photograph again and do not reuse any James source picture previously used by this project.
3. Replace Marcus Rashford and Anthony Martial source photographs.
4. Select player photographs for stronger extreme emotion / drama / cinematic impact, whether in-game or outside the match, while prioritizing high image quality, photogenic composition and historically meaningful moments.
5. Add at least seven additional football photographs across appropriate screens, using disciplined UI/UX placement and visual control rather than decorative clutter.
6. Continue toward the next substantive build after the owner-priority defect and visual work, while preserving protected gameplay/scoring/data-safety architecture.

## Operating constraints carried forward

- `00_HANDOFF_GOLDEN_RULE.md` remains mandatory; this file is being maintained continuously.
- `js/screens.js` remains sole route/history authority.
- `js/storage.js` remains sole persistence authority.
- Scoring/tiebreak rules, exactly-two-manager model, same-league/different-club semantics, permanent club assignment and Transfer/Season Review behavior must not change during this owner-priority work.
- Marco Reus Home/loading identity remains protected unless new evidence specifically requires a change; the owner previously liked the loading screen.
- Candidate A export and Candidate B read-only import analysis remain protected dependencies.
- Candidate C — Atomic Restore + Recovery UX — remains the next substantive Data Safety and Recovery task after these owner-priority fixes are integrated safely.
- Existing startup budgets may not be raised merely to accommodate new visuals; added photos should remain lazy/non-eager where possible.
- Every third-party photo must have explicit provenance/license authority recorded before publication.

## Current execution checkpoint

- Verified current `main` is exactly `9c9ff5fe8a3361b91400e5b37b310fa7bb42f5de`.
- Read `00_HANDOFF_GOLDEN_RULE.md`, `00_DEVELOPER_START_HERE.md`, and `NEXT_TASK.md` from that SHA.
- Created focused branch `v1.1.3-candidate-c-visual-fixes` from exact current main.
- Next: reproduce/trace the League Wheel timer/state defect from live source and tests; inspect current visual source authority and screen placement; research replacement licensed photos and at least seven additional high-value cinematic visuals; then implement with regression gates before Candidate C work proceeds.

## Acceptance state

Owner acceptance: PENDING. No visual or runtime change from this branch should be described as owner-approved until the public build is available and the owner has inspected it.
