# House rules for every 3.0.0 "Phoenix" Sol red-team job (read first)

Model: GPT Sol, High (Nik's pick). One job = one area. Read and run only: never change code, push or open PRs.

Repo: `nikahanghojjati-oss/fifa17-career-showdown2` (public). Live is 2.12.0 on main `7dc0d48e2916d9371f600480e77881971a1c33f4`. The 3.0.0 release branch is `gameplay/r100`. Each job pins its exact commits: review THOSE SHAs, and if a branch moves while you work, keep the pinned SHA and note the drift.

## The game in 30 seconds
- A private two-player FIFA 17 career "Showdown" between exactly two managers: Daniel (playerOne) and Nik (playerTwo), each on his own phone or Chromebook. Static site on GitHub Pages; Firebase Auth (Google popup) + Firestore on the free Spark plan (billing off; Firestore cache is memory-only).
- Permanent pairing: Daniel's phone shows a code, Nik JOINs on Home; UNPAIR in Settings. Only Daniel starts a Showdown and picks 1, 3, 5 or 10 seasons.
- Each season, in this order and never skipped: Chamber Men (7-kick shootout, turn by turn) -> Roster Russian Roulette -> Prime Pack (4/3/2/1 or nothing, never both) -> Transfer War (shared 15-minute window, then private guesses and signings, LOCK) -> Season Results (private until both publish) -> the ONE shared Season Commit (LOCK & CONFIRM / CONFIRM) and both acknowledgements -> next season, or Final Winner and Terminal Close.
- Scoring: Europa League +3 or Champions League +5, never both. Perfect season 15, Golden Showdown 150. No tiebreak anywhere: equal = DRAW.
- House rules: the loading screen stays until the next screen is ready (Reus Gate); never dim or cover anything; one manager's phone must never invent the other's action; a private pick, guess, signing or score must never show before the game reveals it.

## "Phoenix" = the 3.0.0 bar
No FAIR, NORMAL-PLAY sequence may break a Showdown: any phone can reload, be killed, go offline, sleep, be swapped for another device, run two tabs, or have its clock jump mid-season, and the Showdown must resume exactly where the shared record says, with nothing lost, repeated or invented, and every tap landing at most once.

## In scope / out of scope
- IN: only what the two managers can hit with the real app in normal play: reloads, killed tabs, offline/slow network, phone lock/sleep, two tabs, a second device, races between the two phones, clock jumps, service-worker updates of the 3.0.0 build.
- OUT (do not report): a modified app, the console, hand-made requests, a third person, "an attacker". Also OUT: old saves, old versions, mixed versions and upgrade paths (pre-launch rule: no backward compatibility; the only kept old data is one finished Showdown, Arsenal v Burnley, in History).
- Do not propose new confirm dialogs, warnings or extra taps as fixes: Nik wants all safety in the background.

## Evidence rule
A finding counts only with a REPLAY that fails on the pinned SHA: exact two-phone steps or a script, run at least twice. If you could not run it, mark it UNSURE and say what you could not run. Never present a guess as a bug.

## How to run things
- `npm ci`. Contracts: `node tests/support/run-selected-product-contracts.cjs --all`.
- Firestore emulator: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-x "node tests/firebase/<file>.cjs"` (app uses firebase@12.17.0; project ids lowercase).
- Composed production Rules: `node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs` (Rules evaluate at most 1,000 expressions per written document).
- Two-manager browser journey: `tests/browser/ce2pg-journey.cjs` (Playwright Chromium; CE2PG_* env options at the top of the file).
- Fault journey (kill/reload/offline/swap at chosen write points): `FIJ_FAULT=<fault> FIJ_SEED=<n> FIJ_SEASONS=3 FIJ_ONLY=<point> node tests/browser/fault-injection-journey.cjs`.

## Report (one markdown answer, plain words)
- First line: `VERDICT: BLOCKER FOUND / REAL BUGS FOUND / NO BUG FOUND`, then the SHAs you reviewed.
- One row per finding: ID (the job's prefix), severity (P0 a Showdown can't continue for good or data is lost/corrupted or a wrong winner/points; P1 a step blocked or a wrong result that sticks, or a private value shown early; P2 wrong but recovers by itself; P3 cosmetic), what the player sees, exact replay, file:line of the cause at the pinned SHA, the smallest fix, CONFIRMED (ran twice) or UNSURE.
- Report P0 and P1 in full; list P2 in one line each; skip P3.
- Then: what you checked and found clean, and what you could not run.
