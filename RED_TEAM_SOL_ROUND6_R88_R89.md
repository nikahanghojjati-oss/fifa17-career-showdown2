# Red team round 6: live 2.1.0 and the 2.2.0 candidates (Sol + Astra)

**Two short parts, one run each.** Part A checks what went live in 2.1.0. Part B checks the two 2.2.0 branches before they merge. Report **P0 and P1 only**: anything normal play can hit that loses or corrupts data, gives wrong points or a wrong winner, gets a player stuck, skips or repeats a step, leaks a private pick early, or breaks a house rule. Skip P2/P3, test-only gaps and anything listed under "Already proven".

## Product and rules (30-second version)

- Career Mode Showdown is a private two-player FIFA 17 career tracker. Daniel is playerOne and Nik is playerTwo, each on his own phone. It is a static site on GitHub Pages, with Firebase Auth and Firestore on the free Spark plan (billing off).
- A Showdown is 1, 3, 5 or 10 seasons. Each season runs in this order, never skipped: **Chamber Men** (new in 2.1.0: a 7-kick shootout, turn by turn, with a 10 s clock from the rival's lock-in; a timed-out shot is a miss and a timed-out dive is the middle; each goal loads one live round in the opponent's cylinder), then **Roster Russian Roulette** (7 holes, a uniform stop that never returns to the start hole, bullets = Chamber Men goals, one pull per season), then **Prime Pack** (4/3/2/1 or nothing, never both managers), then **Transfer War** (shared 15-minute window, then private guesses and signings; LOCK refuses shot and guessed players), then **Season Results** (private until both publish), then the Season Commit and both acks, then the next season or Final Winner.
- Scoring: Europa League +3 or Champions League +5, never both. A perfect season is 15 and a Golden Showdown is 150.
- House rules: no tiebreak anywhere (equal = DRAW); never dim or cover anything; Reus Gate (the loading screen stays until the next screen is ready).
- Threat model: only what a **legitimate app** can hit in normal play (reloads, offline, slow network, two-phone races, phone lock, an old tab, the service-worker upgrade). Anything that needs a modified app or the console is out of scope.

## Pins

- Repo: `nikahanghojjati-oss/fifa17-career-showdown2`
- **Part A, live 2.1.0: main `e6485d7dca90ac1af096e9c87554089eebedb26a`.** 2.1.0 went live 2026-11-04 ~12:00 UTC. The deployed Rules are ruleset b603ae60, and the composed Rules SHA-256 is `3c0e2e3e41ed3da886b02988d0b84394fa45cf8f393f1616bce97b086d1e2cb8`. Build it with `node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs`.
  - Changes since round 5 (2.0.0 head ae3f3c47): https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/compare/ae3f3c473107b4156770e3448209216b553063eb...e6485d7dca90ac1af096e9c87554089eebedb26a
- **Part B, 2.2.0 candidates.** gameplay/r89 is still `e6485d7d`, the same as main.
  - PR #1244 (`claude-gameplay/r89-3d-engine`, head `0762951510e604a83da0b4b5ea4f96f9b994cdee`): Chamber Men 3D broadcast penalty, three.js r128 to r187, RRR polish, Kits 17. It sets `KICK_MS` to 4600.
  - The Sacked branch `claude-gameplay/r89-sacked`, head `9353c7ee0b935fa2ff4ab22f4d50d4f2760c4356`. It is still based on 2.1.0's base `3da99a4c` and has no PR yet; it will be rebased onto gameplay/r89 with the slim-Rules localize step. Diff: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/compare/3da99a4c...9353c7ee0b935fa2ff4ab22f4d50d4f2760c4356
- If a branch moves while you work, keep reviewing the pinned SHA and just note the drift.

## Part A scope: live 2.1.0

1. **Chamber Men, turn by turn** (#1205, #1219, #1232; `js/chamberMen.js`, `js/chamberMenStep.js`, Rules in `firestore.season-results-production.fragment.rules`).
   - Is any kick stored for the wrong kick or the wrong role?
   - Does the clock restart when the screen is reopened?
   - What happens when both managers lock in at the same moment, or when a send lands after the deadline?
   - Can the shown goals ever differ from the stored record?
   - Do the cylinders the roulette uses equal the goals?
   - The `CHAMBER_FROM_MS` boundary is 2026-11-04T17:00Z and applies by confirm time.
2. **Roulette driver and SB2** (#1234, #1219; `js/rosterRouletteStep.js`, `js/productionSharedTransferChallenge.js` `pstcChamberMenFirst` / `pstcRouletteFirst` / `pstcAfterSpin`).
   - Are bullets always equal to Chamber Men goals?
   - Does the earlier-season replay (F17-01) use the right season's cylinders?
   - Can the window open with one spin mark missing?
3. **LOCK refusals** (#1233). Are shot and guessed players refused at LOCK on both phones, including after a reload with a saved draft?
4. **Slim Rules** (#1242, merge `ae808444`; `scripts/localize-firestore-rules-validators.mjs`). Does the localized artifact allow and deny exactly what the pre-slim Rules did on every normal-play path? Is any heavy write closer to the 1,000-expression limit?
   - The heavy writes: season-2 Transfer START from spins, seasonResults create, seasonCommits create, and the 10-season Terminal Close.
5. **REMATCH and CONTINUE CAREER** (#1224, #1225). Does a rematch start cleanly with the planned length, and does CONTINUE CAREER land on the right step?

## Part B scope: 2.2.0 candidates

1. **#1244 Chamber Men 3D.**
   - Can the 3D scene ever show a different outcome than the stored kick?
   - Can a 3D frame that never arrives block the step? The SVG fallback and the kill switches must always let play go on.
   - Does `KICK_MS` 4600 change the shared kick deadline (`lastWriteMs + PICK_MS + KICK_MS` in `cmsPlay`) in a way that gives one phone more or less time than the other?
   - Do WebGL contexts or loops leak across seasons, and is anything missing from the service-worker shell list?
2. **Sacked** (owner decisions are final).
   - Each manager ticks only his own "I was sacked", with a confirm step before PUBLISH.
   - Any sacking ends the Showdown after that season. Points so far decide, and equal is a DRAW.
   - It counts as COMPLETED everywhere, never as "ended early".
   - `totalSeasons` stays the planned length, and REMATCH offers the planned length.
   - A sack in the planned last season counts as full length.
   - Check for any next-season write after a sack, any place that still waits for `totalSeasons`, career screens counting it wrong, and an old 2.1.0 phone showing a wrong total instead of "Unavailable".

## Already proven (do not redo; challenge only if you see a concrete hole)

- 2.1.0, CE2PG turn by turn: 1 season 182/182, 3 seasons 281/281, 10 seasons 467/467.
- 2.1.0, other checks: bullet check over 84 seasons with 0 mismatches; Release Gate 9/9; compile probe 3/3 at 1.7 to 2.9 s; composed Rules regression 65/65; live smoke green with footer v2.1.0.
- #1244: census 328/328 and the flash audit pass.
- Sacked: 10-season CE2PG 467/467 (9,676 reads, 608 writes); Rules +3,291 bytes; sacked Rules emulator 20 checks; contracts S1 to S7.

## Output (keep it short)

1. **Header:** the date, the SHAs you reviewed, and the Rules SHA-256 you built.
2. **Scorecard:** one line each, /10, with a one-line reason: behavioral correctness, data safety, server authorization, release and governance, interface.
3. **P0/P1 findings only.** Use IDs `R6-A-NN` (live) and `R6-B-NN` (candidates). For each one, give:
   - the severity;
   - file:line at the pinned SHA;
   - the exact steps (a command, or two-phone steps) with what you saw and what you expected;
   - the smallest fix.
4. **If there is no P0/P1**, say so in one line, and add one line on what you could not check.
