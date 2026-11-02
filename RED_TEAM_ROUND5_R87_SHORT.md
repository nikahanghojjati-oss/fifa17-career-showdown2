# Red team round 5 (short): r87 2.0.0 final release head

**One shot.** This round covers only what changed since round 4, so it fits in one run. Report **P0 and P1 only**: something normal play can hit that loses or corrupts data, gives wrong points, gets a player stuck, or breaks a house rule. Skip P2/P3, test-only gaps and anything already listed under "Already proven".

## Product and rules (30-second version)

- Career Mode Showdown: a private two-player FIFA 17 career tracker (Daniel = playerOne, Nik = playerTwo, each on their own phone). Static site on GitHub Pages, Firebase Auth + Firestore on the free Spark plan (billing off).
- 2.0.0 adds Roster Roulette, Special Player, and **Prime Pack**: a masked-Icon guessing round each season. One manager scores 4, 3, 2 or 1 by stage, or nobody does. Both managers can never score in the same season. A season is now 0 to 15, a **perfect season is 15** and **Golden Showdown is 150**, in every Showdown.
- House rules: no tiebreak anywhere (equal = DRAW / level); lengths are 1, 3, 5 or 10 seasons; never dim or cover anything; Reus Gate (the loading screen stays until the next screen is ready, with no black hold and no flash).
- Threat model: only what a **legitimate app** can hit in normal play (reloads, offline, slow network, two-phone races, phone lock, an old tab, the service-worker upgrade). A modified app or the console is out of scope.

## Pin

- Repo: `nikahanghojjati-oss/fifa17-career-showdown2`
- **Candidate: `ae3f3c473107b4156770e3448209216b553063eb`** (head of release PR #1156 into `main`; its base `gameplay/r87` is `e0b7eb8594e363264d78947fbbca8a7b8f058380`)
- Main (live 1.9.10): `5b4337fdd64aaf1e2ed8de5abf6830021f29c82e`
- Composed Rules SHA-256: `4520bfdafe645a28ae742fec770ca00548f24a1b5e1480050cecda1ea82ab432` (unchanged since round 4; build with `node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs`)
- Round 4 reviewed `9a9667fb`. Diff to review: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/compare/9a9667fb5805433801d7347843a0f4c5e597ef5e...ae3f3c473107b4156770e3448209216b553063eb
- If the branch moves while you work, keep reviewing the pinned SHA and just note the drift.

## Scope: only these changes

1. **#1184: 15 / 150 everywhere.** Files: `js/sharedActiveShowdownAdapter.js`, `js/sharedCareerAnalytics.js`, `js/careerScreenSeam.js`, `js/touchlineGazette.js`, `js/commentaryEngine.js`, `js/commentaryV3.js`, `js/trophyRoom.js`, `js/statistics.js`, `js/analytics.js`, `index.html`, `visual-assets/v10_1/*/`.
   - Check that every screen counts a perfect season as 15 and Golden as 150 (Season Results, Final Winner, Standings, History, Career Stats, Rivalry Stats, Trophy Room, Legacy, Gazette, Commentary, Rule Book).
   - **`js/sharedHistoryConvergence.js` `hcVerify`:** a stored projection that differs from its rebuild **only** in the two `perfectSeasons` counters is accepted and the rebuild returned (old saved summaries counted 11 or more). Can any other difference slip through this tolerance? Can a legitimate old summary still be rejected as TAMPERED and lose a player's History or Career page?
   - The old mid-season END path: a Showdown ended early, before or after 2.0.0. Does any screen show wrong totals or a wrong perfect/Golden count?
2. **#1185: Prime Pack F13 fixes.** Files: `js/iconGuessStep.js`, `js/iconGuess.js`, `js/productionSharedSeasonResults.js`, `js/productionSharedTransferChallenge.js`.
   - Arrival is written only when the page is ready, and a fault withdraws it while the other manager has not arrived. Can one manager still win alone because the other's page failed?
   - Rejoin after hidden or lock, with a fresh server clock.
   - An unknown confirm time stops publish with TRY AGAIN instead of dropping a won point. Can it get stuck forever?
   - Kill switch on: is a won point still attached?
   - Draw shown only after 97 s.
3. **#1187: Trophy Room tap.** `js/careerScreensV10.js` `v10Wire`: one delegated document listener for OPEN TROPHY ROOM. Does any tap open nothing or open twice? Is there a black screen without the loading gate?
4. **Release items (#1156, commit 6a575de1).** `tools/set-release-time.cjs`, `.github/workflows/deploy-github-pages.yml` (the site waits up to 45 min for this commit's Rules deploy), `service-worker.js`, `js/app.js` (2.0.0), `RELEASE_V2.0.0_R87.md`.
   - **Check the release-time constants** listed in `tools/set-release-time.cjs` (`RRR_FROM_MS`, `ROULETTE_FROM_MS`, `ICON_FROM_MS`, every `PRIME_PACK_FROM_MS`, `OWN_CLUB_FROM_MS`) against the actual release. At the pinned SHA they read `2026-11-01T17:00:00Z`. What happens to a Showdown confirmed on 1.9.10 after that time once the phones update to 2.0.0 mid-Showdown? Are all ten equal?
   - Can the site go live before its Rules?

## Already proven (do not redo; challenge only if you see a concrete hole)

- 10-season CE2PG two-phone emulator journey on the release head: **468/468** checks, including a **Golden 150**.
- Upgrade proof 1.9.10 to 2.0.0: **U1 to U7 pass** (deferred update off Home, apply on Home, rollback shell, kept local data and device identity, offline rollback).
- Composed Rules `4520bfda`: **64/64** emulator checks (Prime Pack round record, result points 1 to 4, never both, cap 15 per season, terminal close, expression headroom about 904/1000).
- Round 4: no P0. AST-01 and AST-02 fixed by #1185 and #1184. Sol's season-3 +3 was harness timing, fixed in #1186.

## Output (keep it short)

1. Header: the date, the candidate SHA you reviewed, and the Rules SHA-256 you built.
2. **Scorecard**, one line each, /10 with a one-line reason: behavioral correctness, data safety, server authorization, release and governance, interface.
3. **P0/P1 findings only.** For each: ID `R5-NN`, severity, file:line at the candidate SHA, the steps to reproduce (a command, or exact two-phone steps) with what you saw and what you expected, and the smallest fix.
4. If there is no P0/P1, say so in one line, plus one line on what you could not check.
