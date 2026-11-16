# House rules for every r93 red-team job (read first)

Repo: nikahanghojjati-oss/fifa17-career-showdown2. Code to test: branch **gameplay/r93** at commit **ce4d1317** (the 2.6.0 candidate; live is 2.5.1 on main 23bdd439). Use that commit, not main.

The game: a private two-player FIFA 17 career "Showdown" between two managers, Nik and Daniel, each on his own phone or Chromebook, sharing one Firebase database. Each season: club packs, Roster Roulette, Prime Pack, **Transfer War** (15-minute clock; each manager privately guesses the rival's signings and enters up to 3 signings of his own, then LOCK MY SIGNINGS; verdicts after both lock), **Squad Management** (11 starters + 4 bench from his own club pool plus kept signings; LOCK), Season Results, Chamber Men + Russian roulette. 1, 3, 5 or 10 seasons.

What counts as a bug here:
- Only things that happen in NORMAL play by the two managers using the real app. Hand-made requests, a modified app, a third person or "an attacker" are OUT OF SCOPE (private two-player tool). Do not report them.
- A finding counts only with a **replay**: exact steps (or a script) that make it happen on ce4d1317, run at least twice. If you can't run it, mark it UNSURE and say exactly what you could not run. Never present a guess as a bug.
- Known and already fixed, do not report again: LOCK MY SIGNINGS refused with 2+ signings picked from the name list (fixed in 2.5.1/#1476); Rivalry Statistics "unavailable" after a hidden final lock (#1481); reload after Transfer War skips the verdicts (fixed in #1484); two different signings with the same display name collapse into one squad entry (Astra A-TW-01, being fixed in r94).
- Equal points are a draw; there is no tiebreak anywhere. Squads may shrink to 14 by season 10 when a club runs out. The Special Player never goes on a squad board. A guessed player never joins the board and can't be signed again.

How to run things (Codex cloud): `npm ci`; contracts `node tests/support/run-selected-product-contracts.cjs --all`; Firestore emulator tests via `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-x "node tests/firebase/<file>.cjs"` (use firebase@12.17.0 in the app; project ids lowercase). The full two-manager browser journey is tests/browser/ce2pg-journey.cjs (Chromium via Playwright; env CE2PG_* options are read at the top of the file). The composed production Rules are built by scripts/build-production-firestore-rules-with-persistent-pair.mjs. Firestore Rules evaluate at most 1,000 expressions per written document.

Report format (one markdown file, plain words):
- First line: VERDICT: BLOCKER FOUND / REAL BUGS FOUND / NO BUG FOUND.
- One row per finding: ID, severity (P0 game can't continue for good, P1 a step blocked or a wrong result that sticks, P2 wrong but recoverable, P3 cosmetic), what the player sees, exact replay, file:line of the cause, CONFIRMED (ran twice) or UNSURE.
- A short list of what you checked and found clean, and what you could not run.
- Do not change code or open PRs. Read and run only.
