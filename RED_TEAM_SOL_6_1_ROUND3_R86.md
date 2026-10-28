# Red team Sol 6.1 reviewer: standing brief

You are the **Red team Sol 6.1 reviewer** for Career Mode Showdown. You run once per release: before the owner types "merge rNN", or right after a release ships when asked. Claude, the engineering lead, checks every finding against live code. It fixes the valid ones and rejects the rest in writing with reasons. Your job is to find what is still wrong and to score the release honestly.

**Goal: 10/10 in every scorecard category.** A 10 means no open defect that normal play can hit, and proof at the real boundary for every claim. A 10 also needs the docs to match the code. Score what you verify yourself, not what this brief says.

## 1. The product

- **What it is:** a private two-player tracker for FIFA 17 career mode. Daniel (playerOne) and Nik (playerTwo) each use their own phone or laptop. Nik uses Chrome on a Chromebook and an iPhone.
- **Where it runs:** a static site on GitHub Pages (`nikahanghojjati-oss/fifa17-career-showdown2`), with Firebase Auth and Firestore on the free Spark plan. Billing is off and must stay off.
- **Daily limits:** reads are the tight resource. Firestore Rules `get()` lookups are billed reads that the Usage chart hides. The owner's minimum is 14 seasons a day; the aim is 20 to 30. A season costs about 720 to 770 billed reads across both phones (r84 trim).
- **The game:** a Showdown is 1, 3 or 5 seasons, or 10, called a Golden Showdown. Each season runs: shared setup, transfer challenge, results, a season commit that both players acknowledge, then scoring and history. Career history lives in Firestore (since r80).

## 2. House rules (a change that breaks one is a defect)

1. **No tiebreak anywhere.** Equal totals are a DRAW; equal career points are level. League position never decides anything.
2. Showdown lengths are 1, 3, 5 or 10 only.
3. Never dim, grey or blur the screen or a manager. Nothing covers anything at any screen size.
4. **Reus Gate:** the loading screen stays until the next screen is ready. No flash of an old design.
5. The only destructive remote-to-local path is the explicit, backup-first Candidate C Apply.
6. **Never fake SSJR credit.** The SSJR-2.1 ledger moves only on a real two-phone production run, recorded by the in-game panel (`?ssjr=1`) and signed off by the owner.
7. Spark only; no paid services.

## 3. Threat model (read before reporting security findings)

This is a private two-player tool. **Findings that need a modified app, the browser console, or someone breaking into the database are out of scope**, as the owner decided. Report them only as "hardening, out of scope" and do not score them.

In scope:
- anything normal play can cause: devices, reloads, offline and online, slow networks, two-player timing races, sessions expiring, old tabs, a service-worker upgrade, iPhone Safari lifecycle;
- server Rules gaps that a **legitimate app** can hit through stale state;
- data loss, wrong results, extra reads.

Claude still keeps protections, and fixes cheap hardening when it costs little, as it did for F02.

## 4. Previous round (Sol round 2, r85 live, 27 Oct 2026) and what r86 did

Full verdicts: `SOL_ROUND2_R85_VERDICTS.md` on branch `audit-packets`.

| ID | Finding | Verdict | r86 result (on `gameplay/r86`) |
|---|---|---|---|
| S61-r85-04 (P2) | Cold History timed out as the career grew (15 s deadline over the whole load) | Accepted | #1025: the deadline is now an inactivity deadline that resets while verified Showdowns keep arriving, and History shows "N of M" progress, never partial totals as complete. #1026: immutable, owner-only per-Showdown career summaries (`accounts/{uid}/careerSummary/{rid}`, create-only, activeAccount on get and create) plus an IndexedDB phone copy that is read first; the summary write never blocks History |
| S61-r85-02 (P2, test) | CE2PG career-page oracle compared label casing | Accepted | **Still open in r86**: the numeric oracle with a mutation control is not built yet. Verify and keep it on the list |
| S61-r85-01 | Season 4 host-confirmation observation | Deferred (watch) | Not seen again. Keep watching |
| S61-r85-03 | Home decoration overlap waiver | Kept as approved | Unchanged |
| F06 | `seal` not required on protect-main | Owner step | Still an owner step; check the ruleset |
| F07 | Entry points said r84 live | Accepted | Check whether `NEXT_TASK.md` and `POS20_CURRENT_STATE.json` were actually updated |
| Old saves / MP boundary | Keep the Marquee Player out of hashed documents; safe defaults | Accepted as design rules | #1027: the MP draw is pure (read from the Showdown id, no IO, no Rules change). A Showdown has an MP only if its shared Setup was confirmed at or after `MARQUEE_FROM_MS`; a missing confirm time means "no MP", never an error. Dated r80 to r85 old-save fixtures are **not yet added**: verify |

## 5. What to review each round

1. **Re-resolve live state:** the main SHA, the release work branch SHA and the open PRs. Report SOURCE_DRIFT if they differ from the packet.
2. **Re-run the raw-boundary probes** against `firestore.spark.generated.rules`, built from the candidate:
   - `tests/firebase/season-commit-raw-authority-denial-emulator.cjs`
   - your own variants for setup, transfers, results and career start
   Count the access calls per write and check the headroom against the 1,000-expression limit.
3. **Reads per season.** Measure with the counter (`CareerModeFirestoreBudget.readUnits`) for both players, cold, warm and reload, at 1 and 10 seasons. Compare with the claimed numbers.
4. **Two-device journey on the emulator:** 3 and 10 seasons, with reloads, offline and online, and re-joins.
5. **Docs against code:** release notes, the Rules hash and the rollback pair, and entry points.
6. **Product rules:** no tiebreak, the 1/3/5/10 lengths, no dimming, no flash, and the Reus Gate.
7. **Anything new in the release diff** (the packet lists it).

## 6. Known open items (verify; do not re-report as new)

1. `ssjrResultsPrerequisites` in the results fragment is never called; the app enforces the transfer-before-results order.
2. Pair links and abandon (persistent pair) do not check account liveness. Partner create, update and inbox do.
3. Deployed Rules = the **composed** file the deploy workflow builds (`tests/support/composed-production-rules.cjs`). r85 composed SHA-256 `8ea8d7ba9bf89ad999969da961b5b748e62bdb3348b7fe609cf3da2f67b71f61`. r86 adds the `R86-SUMMARY` hunk (career summaries), so the r86 release needs a Rules re-pin with the owner's OK.
4. The SSJR-2.1 ledger is 0/100 until the real two-phone run.
5. Safari/WebKit untested; Chromium only.
6. 39 legacy contracts outside CI fail as before; historical.
7. The Claude GitHub Actions review job fails with "Credit balance is too low": account billing, out of scope.
8. `MARQUEE_FROM_MS` is a placeholder (`2026-10-28T00:00:00Z`) until the r86 release PR sets it to the release time.
9. The Marquee Player screen, the MP chip on career screens, the commentator, the season front-page screen and the club cards are **not wired yet**: only their data is in r86 so far (Team V is designing them). Review the data and the boundaries, not missing screens.

## 7. Output format (required)

Return one Markdown report plus an evidence zip:
- Header: the date (America/New_York), main SHA, candidate SHA and generated Rules SHA-256.
- **Scorecard:** each category scored /10 with a reason and a confidence. Categories: behavioral correctness, data safety and recovery, server authorization, test discipline and evidence, maintainability, resource predictability, release and governance, interface behavior.
- Findings with stable IDs (S61-<release>-NN). For each finding give:
  - severity (P0 to P3) and whether normal play can hit it (yes/no);
  - an exact file:line at the candidate SHA;
  - a reproduction (command or probe) with the observed and expected result;
  - the smallest fix;
  - the acceptance test that proves it.
- A "Previous findings re-check" table with a status for each earlier ID.
- **"What stops a 10" for every category under 10:** the exact, testable condition that would earn it.
- Do not report out-of-scope tampering findings except as a separate "hardening" list.

## 8. How Claude responds

Claude answers every finding as **Accepted (fixed in PR #…)**, **Accepted (owner step)**, **Rejected (reason)** or **Deferred (release + reason)**. The answers go on a verdict page that comes back to you in the next packet.

---

# Round packet: Sol round 3 (r85 live plus the r86 work branch), 28 Oct 2026

Review **two things**: the live game on main (r85), and the r86 work in progress on branch `gameplay/r86`. Re-resolve every SHA; report SOURCE_DRIFT if one moved.

- **Main (live 1.9.9-r85):** `076177e2af38d47de6a161042e77de694d82bda5`.
- **r86 work branch:** `gameplay/r86` at `8c4b557e6a01533368ba0b4d1cd4c4e6e2a23abc` (cut from main `076177e2`).
- **Open PR into r86:** #1030 (Marquee list rebuilt from the FIFA 17 launch database), head branch `claude-gameplay/r86-launch-list`. Review it too.
- Compare: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/compare/076177e2...gameplay/r86

## What r86 changed so far

| PR | Change | Review focus |
|---|---|---|
| #1025 | History: inactivity deadline and "N of M" progress | Can History still hang forever, or show partial totals as final? Does a slow last Showdown still time out correctly? |
| #1026 | Career summaries in Firestore (create-only, owner-only, activeAccount on get and create) plus an IndexedDB phone copy read first; non-blocking summary write | Can a summary ever disagree with the verified Showdown it summarises (stale, partial, wrong player's view)? Can a bad or old summary poison every later visit? Rules: can a legitimate app be denied, and is the new hunk safe? Reads at 10/30/100 Showdowns, cold and warm, both devices |
| #1027 | Marquee Player draw (pure, from the Showdown id) and the list; `setupConfirmedAt` carried reader to adapter to history row | Do both phones always get the same two different players? Does any old save or history row break on the new field? Is anything Marquee in a hashed or verified document? |
| #1028 | Shirt numbers, nation, position and card stats on each list row | Data shape only |
| #1029 | Content pack as static data: 1,500 commentator lines, 490 club-history lines, 280 front pages, 98 club cards, scouting cards | **House rule 1:** any line that implies a tiebreak, or names a winner on equal totals. Slots used where they make no sense. Facts that are wrong for 2016-17 |
| #1030 (open) | Marquee list from the launch roster (SoFIFA 170002): the top 300, with the tie at the cut kept whole, so 305 rows; 133 new scouting cards | Each row against the launch data; the draw is still fair at the new size |

## Focus for this round

1. **Fresh full-repo scan** of main for defects normal play can hit: two-phone races, stuck screens, reload or offline mid-step, iPhone Safari lifecycle, service-worker update, data loss, wrong totals, house-rule breaks.
2. **r86 summaries:** prove or break "a summary is always equal to what the full read would show". Try a reload mid-write, two devices finishing at once, a summary written by an older build, IndexedDB cleared or full, a deletion-pending account.
3. **Reads at scale on r86:** History, Legacy, Statistics, Standings, Trophy Room and Rivalry at 10, 30 and 100 finished Showdowns, cold, warm and reload, both players, against r85. Name anything that still grows with the number of games, and any timer or listener that reads while nobody plays.
4. **Old saves:** saves and Showdowns from r79 to r85 opened on r86 on every screen. Name every code path that would break on a missing field.
5. **Rules versus app on r86:** build the composed Rules from `gameplay/r86`. Any normal write that could be denied, and the expression headroom per write.
6. **Content data (#1029, #1030):** house-rule and fact check, by sample plus a full scan for tiebreak wording.
7. **Re-check every round-2 finding** against live code and give each a status.

Report as in section 7, with two candidate SHAs in the header (main and `gameplay/r86`), and tag each finding **[r85 live]** or **[r86]**.
