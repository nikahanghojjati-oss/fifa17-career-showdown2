# GAMEPLAY LEAD HANDOFF: feature recovery, data contract, gameplay factory, automated bug hunt

From: Claude, Visual lead (Claude project "Claude Career Mode Showdown - Visual lead")
To: Claude, Gameplay lead (Claude project "Gameplay Engineering", Opus 5.5, manager role)
Owner: Nik
Date: 2026-10-02
Repository: [nikahanghojjati-oss/fifa17-career-showdown2](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2)
This file: `project-documents/leads/GAMEPLAY_LEAD_FACTORY_HANDOFF_2026-10-02.md` on branches `leads/gameplay-handoff-7t1y3g` and `leads/relay`
Evidence anchors (read-only): `main` @ `2de2373` (r51); `visual/cinematic-system-v10` @ `883bebc` or later (relay + directive)

This file is complete. You should not need to ask Nik anything to start. Where something forks, a recommended default is given; take it and say so.

---

## 0. What Nik wants, in one paragraph

Nik wants the Gameplay lead to run gameplay the way the Visual lead now runs visuals. You are the manager and keeper of gameplay product truth and history. You restore the features that were hidden during the online migration (History/Legacy, Statistics, Rivalry, Trophy Room, Season Results scoring and the final winner, Continue, Start/Join) so they read real online data. You agree a data contract with the Visual lead so the new screens have true numbers behind them. You run a factory of GPT-5.6 Sol worker chats (about 5 at once; Nik types only a job number), with Codex used sensibly as a reviewer. You replace Nik's manual smoke tests with automated two-manager tests that run on every push, and every bug found becomes a factory job. The two leads talk through the repo, so Nik never carries messages.

---

## 1. Authority and roles

| Who | Role |
| --- | --- |
| **Nik** | Owner. Final say on scope, taste, money, rules deploys and anything merged into `main`. |
| **Claude, Gameplay lead** (you, Opus 5.5) | Manager for gameplay, data, Firestore Rules, tests and bugs. Holds gameplay product truth and history, so workers never need to ask Nik. Writes jobs, reviews results, keeps the board. |
| **Claude, Visual lead** (Opus 5.5) | Manager for visuals. Holds visual truth and history. Builds every screen on labelled sample data until your fields are real. |
| **GPT-5.6 Sol chats** | Workers in both factories. They do one job each, from the repo job file. They do not hold authority. |
| **Codex** | Reviewer. Use it on gameplay PRs that touch Firestore Rules, providers, privacy or the merge into `main` (see §6.6). On the visual side Codex only reviews visual jobs 14 and 15; its other time is yours. |
| **Claude Code cloud sessions** | Rare, for the hardest one or two jobs only (likely the career-index rules job). Nik's cloud credit is small. |

Standing rules that do not change:

- `main` is protected. Gameplay work reaches `main` only through the existing POS20 gates (one exact head, green CI, clean review, POS20 benchmark and exact-head seal, see [AGENTS.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/main/AGENTS.md)) and Nik's explicit OK. Never force-push. Never delete branches or data.
- **Nothing visual goes into `main`** until every planned screen is built and Nik approves the whole visual package. Gameplay data work may go first, behind the existing online containment, so players see no half-built screens.
- **Firebase Spark only.** Billing OFF, no Blaze, no Cloud Functions or Cloud Run. App Check enforcement OFF. Firestore memory-only cache. Google Auth popup-only with `browserSessionPersistence`. Exactly two private managers: Daniel = Manager 1 = `playerOne`, always shown on the LEFT; Nik = Manager 2 = `playerTwo`.
- A Firestore Rules deploy to production needs Nik's typed words, every time. Emulator work does not.
- Scoring never changes: Champions League 5, league title 3, domestic cup 1, performance bonus 1 (≥100 league points **or** ≥100 league goals), awards bonus 1 (top scorer **or** top assist). Season max 11. Season tie: league position, then league points, else draw. Final Showdown: total points, equal = draw. Trophy counts are wins (one CL = 1 trophy and 5 points).
- No screen may show or imply the rival's private inputs or progress.
- POS20 process work earns no SSJR or MDP credit. Do not claim any.

---

## 2. What happened, and what `main` has today

**Source documents (read these first):**

1. Owner directive: [CMS_HOME_FEATURE_RECOVERY_ONLINE_REINTEGRATION_DIRECTIVE_2026-10-01.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/visual/cinematic-system-v10/project-documents/product-authority/CMS_HOME_FEATURE_RECOVERY_ONLINE_REINTEGRATION_DIRECTIVE_2026-10-01.md) on `visual/cinematic-system-v10`. Acceptance criteria are its §12 (20 items).
2. Visual lead's recovery plan: [C2S-005R2_home-recovery-plan.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/visual/cinematic-system-v10/project-documents/model-relay/archive/C2S-005R2_home-recovery-plan.md) (full provider map with `file:line` on `main` @ `2de2373`).
3. GPT-5.6 Sol's product-truth ruling: [S2C-005R2_home-recovery-ruling.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/visual/cinematic-system-v10/project-documents/model-relay/archive/S2C-005R2_home-recovery-ruling.md). It accepts the plan and adds required corrections (§3 and §4 there). Treat it as binding.

Fetch with explicit refspecs, for example:
`git fetch origin +refs/heads/main:refs/remotes/origin/main +refs/heads/visual/cinematic-system-v10:refs/remotes/origin/visual/cinematic-system-v10`

**Short history.** In r43 (commit `dde5120`, then the reflow `1f54571`) the online app hid `#legacyButton`, `#careerStatisticsButton` and `#rivalryStatisticsButton` with one injected stylesheet in `js/onlinePlayerIdentity.js:24`, because those screens still read old browser-local data. Trophy Room had already been nested under Statistics, so it became unreachable too. The code still exists (`js/legacy.js`, `js/statistics.js`, `js/trophyRoom.js`, `js/analytics.js`). This is a recovery and rewiring job, not a rebuild.

**What works online today** (`main` @ `2de2373`):

| Feature | State | Where |
| --- | --- | --- |
| Continue | Works, from the persistent pair link | `onlinePlayerIdentity.js:55`, `persistentNikDanielPair.js:131` |
| Start/Join: pairing | Works: CREATE CODE FOR NIK, JOIN DANIEL'S SHOWDOWN, COPY CODE, NEW CODE, CHECK STATUS, RETRY CONNECTION | `persistentNikDanielPair.js:240` |
| Start/Join: private session | Works: HOST / JOIN PRIVATE SESSION, COPY CODE, REFRESH / READ, REVOKE OPEN SESSION, CLOSE SESSION, FORGET CODE | `sparkRemoteJoining.js:279-281` |
| Abandon Showdown | Works (provider), `pairAbandonCurrentShowdown` | `persistentNikDanielPair.js:67-97` |
| Forget this device | Works | `onlinePlayerIdentity.js:44,52` |
| Season Results + scoring | Works for the active Showdown, canonical and verified | `sharedCanonicalScoring.js`, `sharedHistoryConvergence.js:34-41,83` |
| Final winner | Works: final reconciliation, then Terminal Close witness | `sharedFinalReconciliation.js:38-50`, `sharedTerminalClose.js`, `sparkTerminalClose.js:57` |
| Current-Showdown history (Rivalry data) | Works while active, polling every 15 s | `sparkSharedHistoryConvergence.js`, `productionSharedHistoryConvergence.js:99` |
| History / Statistics / Trophy Room | **Hidden.** Old renderers read local data only | `onlinePlayerIdentity.js:24`; `analytics.js:90,96,136-143` |
| Career history across Showdowns | **Impossible today** (two gaps below) | |

**The two gaps (C2S-005 finding, confirmed by GPT-5.6 Sol):**

- **Gap 1, closed Showdowns are unreadable.** Every season-level document (setup, season commits, transfers) is gated by `activePairedRivalry`, which requires `connectionState == "active"` (`firestore.spark.rules:447-464`; fragments use `ssjrEntitled`). Once a Showdown closes, only the root rivalry document (final totals and winner) stays readable.
- **Gap 2, old Showdowns can't be found.** Each account has one pointer, `accounts/{uid}/pairLinks/current`, and it is overwritten when the next Showdown links (`persistentNikDanielPair.js:64,112`). `list` is denied everywhere, so after a new Showdown starts nothing names the earlier rivalry ids.

**The fix (accepted direction, not yet built):**

- **D1, career index.** `accounts/{uid}/careerIndex/current`: own-account get only, list/delete denied, append-only list of rivalry ids, written in the same transaction as the pair link at creation (Daniel) and redemption (Nik).
- **D2, completed-only read grant plus a session-free reader.** Rules allow `get` of setup, season commits and (narrowly) transfers when the root is closed **with** a valid Terminal Close witness. A new read-only client reader rebuilds and verifies the history without a gameplay session.
- Then one pure **shared career model** feeds every screen.

GPT-5.6 Sol's required corrections (all in S2C-005R2 §3–§4; must be in the job files):
exact old-order preservation and exactly one new unique id per append (not `size()+1 && hasAll`); membership via `getAfter()`; the index/pair-link coupling covers first creation as well as replacement; idempotent reconfirmation; all transaction reads before any write (`pairCreateDurablePairWitness` currently writes inside the callback); pending unpaired entries excluded when comparing Daniel's and Nik's sets; never truncate history at a capacity limit; completed reads verify the full terminal witness, not just `closedSessionRevision`; read exactly `season_1..season_N` and treat any gap as unavailable; transfer opponent reads keep the existing `COMPLETED` condition; test the **composed** production rules (`scripts/build-production-firestore-rules.mjs`), not single fragments.

---

## 3. Nik's decisions (already settled) and the open defaults

The two questions about history were answered by Nik on 2026-10-01 and accepted by GPT-5.6 Sol (C2S-005R2 §0a, S2C-005R2 §2). Do not reopen them.

| # | Question | Nik's answer |
| --- | --- | --- |
| 1 | Do seasons of an abandoned Showdown count? | **No.** Abandoned Showdowns add nothing to any career total. They may appear in History as a status-only row ("Abandoned", no score). If a Showdown is abandoned later, rebuild the career model so its earlier seasons disappear from every total and record. |
| 2 | Recover old Showdowns via join codes, or start the archive now? | **Start now. No backfill.** The game has not launched. The career index starts empty at deployment; development and test rivalries are never imported, and Rules must enforce that (not just the client). |

Defaults you may take without asking (say so on the relay):

| Fork | Recommended default |
| --- | --- |
| Index capacity | No cap on careers. Page the index (`careerIndex/current` then `careerIndex/page_2`, …) before the 1 MiB limit; never block or evict. |
| Complete but not yet closed | Seasons count, the Showdown result does not; show "Final result, completion pending" (Sol ruling §1). |
| Transfer history read fails | Transfers show "unavailable"; points, seasons and trophies still show (never 0). |
| Interim view before D1/D2 land | Allowed for owner review only, labelled exactly "Current Showdown only. Career history is not yet available." Never a launch state. |

---

## 4. Data contract with the Visual lead

**How it works.** Visual builds every screen now on a labelled sample file (`FIXTURE` shown on screen) with all states designed. Gameplay makes the fields real. They meet in one place: a view model per screen produced by the shared career model. Field names below are the proposal; reply on the relay (§7) with changes, then commit the agreed version as `project-documents/leads/DATA_CONTRACT_V1.md` on `leads/relay`. After that, a field changes only by a relay message.

**Every screen has one `status`:** `loading` | `empty` (a new career, read succeeded) | `unavailable` (read failed; never shown as empty) | `partial` (some Showdowns unreadable; show coverage, never call it all-time) | `ready`. Transfers have their own `transfers.status`. Managers are keyed `daniel` and `nik` (from the slot role), never by account or profile id. Daniel is always the left column.

Legend: **E** = exists on `main` today (needs only an adapter). **A** = gameplay must add.

### 4.1 Home (Continue + tiles)

| Field | Meaning | E/A |
| --- | --- | --- |
| `viewerRole` | `daniel` or `nik` (drives "START A SHOWDOWN" vs "JOIN DANIEL'S SHOWDOWN") | E (`MANAGER_BY_ROLE`, `persistentNikDanielPair.js:9-14`) |
| `continue.state` | `paired` / `waiting` / `recovery-required` / `unpaired` | E (`pairInitialize`) |
| `continue.leagueId`, `continue.clubs.{daniel,nik}` | Current league and permanent clubs | E (`sharedSetup/authoritative`) |
| `continue.season`, `continue.totalSeasons` | "Season 2 of 5" | E (multi-season progression) |
| `continue.score.{daniel,nik}` | Current Showdown points | E (history convergence) |
| `tiles.{history,statistics,trophyRoom,rivalry}.available` + `reason` | Tile on/off with a plain reason ("Reconnecting") | A |

### 4.2 Start / Join

Only buttons the real app has. Plain words.

| Field / action | E/A |
| --- | --- |
| `pairing.state` (`none`/`code-created`/`waiting-for-nik`/`paired`), `pairing.code` (host only, after creation) | E |
| Actions: `createCode` (Daniel), `join` (Nik), `copyCode`, `newCode`, `checkStatus`, `retry` | E |
| `session.state` (`open`/`active`/`revoked`/`closed`/`expired`), actions `host`, `join`, `refresh`, `revoke`, `close`, `forget` | E |
| `abandonShowdown` (with confirm), `forgetThisDevice` (with confirm) | E |
| One view model for both layers, so the screen can show two big buttons and a "More" menu holding Revoke / Close / Forget, each with a confirm | A (adapter only) |

### 4.3 Season Results (one season)

| Field | Meaning | E/A |
| --- | --- | --- |
| Inputs per manager: `leaguePosition` (1..team count), `leaguePoints`, `leagueGoals` (number fields), `domesticCup`, `championsLeague`, `topScorer`, `topAssist` (yes/no) | What the player enters | E (`sharedCanonicalScoring.js:10`) |
| `breakdown.{championsLeague,leagueTitle,domesticCup,performanceBonus,awardsBonus}`, `total` (max 11) | App computes; player never types a score | E |
| `winner` (`daniel`/`nik`/`draw`) | Season result | E (`scWinner`) |
| `tiebreak` (`none`/`league-position`/`league-points`/`draw`) | Why it was decided, for the "How scoring works" pop-up | A (derive, no rule change) |
| `phase` (`entering`/`submitted`/`waiting-for-rival`/`accepted`) | Own progress only; rival's inputs stay hidden until accepted | E |

### 4.4 Final winner (end of a Showdown)

| Field | E/A |
| --- | --- |
| `totals.{daniel,nik}`, `winner` (`daniel`/`nik`/`draw`), `margin`, `seasonsPlayed` | E (final reconciliation / terminal witness) |
| `state`: `completion-pending` (reconciled, not closed) or `completed` (verified Terminal Close) | A (expose existing facts) |
| `trophies.{daniel,nik}.{championsLeague,leagueTitles,domesticCups,total}` for this Showdown | E (projection `managerRecords`) |

### 4.5 Rivalry Statistics (current Showdown)

| Field | E/A |
| --- | --- |
| `leagueId`, `clubs`, `season`/`totalSeasons`, `score.{daniel,nik}` | E |
| Per manager: `seasonWins`, `seasonDraws`, `seasonLosses`, `championsLeagues`, `leagueTitles`, `domesticCups`, `totalTrophies`, `hundredPointSeasons`, `hundredGoalSeasons`, `topScorerSeasons`, `topAssistSeasons`, `perfectSeasons`, `bestSeasonScore` | E (`sharedHistoryConvergence.js` `managerRecords`) |
| `seasons[]`: `{season, score.{daniel,nik}, winner, leaguePosition.{…}, leaguePoints.{…}, leagueGoals.{…}}` | E (`seasonHistory`) |
| `transfers.status` + per-season guess/signing summary | A (active read exists; summary is new) |
| Adapter from provider state instead of local `currentShowdown` (`statistics.js:59,320,363,496,545`) | A (job D-3) |

### 4.6 Career Statistics (all Showdowns)

| Field | E/A |
| --- | --- |
| Per manager, everything in 4.5 plus `careerPoints` (= sum of season scores), `seasons`, `averageSeasonScore`, `averageLeaguePoints`, `averageLeagueGoals`, `bestLeaguePoints`, `bestLeagueGoals`, `bestLeaguePosition`, `performanceBonuses`, `awardsBonuses` | Math exists per Showdown (E); career-wide combining is A (averages from combined sums, never an average of averages) |
| `showdowns.{completed, wins, draws, losses}` per manager | A (completed Showdowns only) |
| `biggestShowdownWin` `{manager, margin, showdownRef}` | A |
| `coverage.{readable, indexed}` | A |

### 4.7 Trophy Room

| Field | E/A |
| --- | --- |
| Per manager cabinet: `championsLeagues`, `leagueTitles`, `domesticCups`, `totalTrophies` (counts of wins) | A (career-wide) |
| `standings` by `careerPoints`, then season wins | A |
| `records[]`: highest season score, highest league points, highest league goals, biggest Showdown win, most perfect seasons; each `{label, manager or "shared", value, ref}` | A |

### 4.8 History / Legacy

| Field | E/A |
| --- | --- |
| `showdowns[]`: `{number, status (completed/in-progress/completion-pending/abandoned/unavailable), leagueId, clubs.{daniel,nik}, seasonsPlayed, totalSeasons, totals.{daniel,nik}, winner}`; card score = the Showdown points total | A (needs D1 + D2) |
| `showdowns[].seasons[]` as in 4.5 | A |
| Abandoned rows: status only, no score | A |
| No delete, backup, export or reset controls on the online route (provider history cannot be deleted by a client) | Rule |

### 4.9 Dropped: the game never records these

Do not build fields for, and Visual removes from mockups: clean sheets, biggest single-match win, European wins other than the Champions League, player names, player-based "leaders" or player photos, match-by-match results, possession or any per-match stat. "Top scorer" and "top assist" are yes/no per season (the manager's player won the award), not a player name.

---

## 5. Recovery work plan (becomes your first factory jobs)

Order of value. Each line is one job unless noted. IDs D-1..D-7 and J-1..J-4 match C2S-005R2 §3.

| Job | What | Notes |
| --- | --- | --- |
| G-0 | Factory test: worker reads the job, ticks a status file, pushes | Proves the pipeline |
| G-1 | Fast regression CI on every push to gameplay branches (see §6.5) | First real job; everything after depends on it |
| G-2 | Two-manager end-to-end journey test on the emulator (see §6.2) | Writes the baseline; current bugs become jobs |
| G-3 | D-1 pure shared career model `js/sharedCareerAnalytics.js` + unit tests (bonus caps, tiebreaks, trophy ≠ points, once-only seasons, abandoned removal, local data ignored) | No DOM, no storage |
| G-4 | D-2 renderer seams: renderers take a model; the online route never calls the zero-argument local path; empty text only when `status === "empty"` | |
| G-5 | D-3 active Showdown adapter: Rivalry, Home Continue line, Season Results `tiebreak`, Final winner `state` | |
| G-6 | Start/Join view model (§4.2) with confirms | Adapter only |
| G-7 | D-5 career index Rules + client + emulator proofs (all Sol corrections) | Hardest job. Lead writes it in detail; Codex review; Claude Code cloud only if two worker attempts fail |
| G-8 | D-6 completed-only read grant + session-free reader + emulator proofs | Codex review |
| G-9 | D-7 closed-Showdown adapter → career model (`ready`/`partial`) | |
| G-10 | Transfer history (completed only, opponent reads keep the `COMPLETED` condition) | Separate availability |
| G-11 | Contract fixtures: generate the sample JSON for every screen from the real model, so Visual's fixtures match exactly | Joins the two tracks |
| G-12 | Composed production rules regression: every denied path in C2S-005R2 §2.1 stays denied | |
| G-13 | J-2 remove the r43 containment and add `#trophyRoomButton` binding, last | Waits for the approved visual package |
| G-14 | J-3 acceptance: directive §12 (1–20) and Sol's 8 proofs, emulator first | |
| G-15 | One real two-device run with Nik (Chromebook + iPhone) | The only manual step; Nik plays, the recorder captures |

Note for both boards: the Visual factory's job 14 "Online history data" belongs to this plan (G-3 to G-10). Visual keeps only the fixture-to-model binding.

---

## 6. The gameplay factory

Copy the Visual lead's factory. Its model is on branch `factory/v1` under `project-documents/factory/` (BOARD.md, jobs/JOB-NN.md, one status file per job). **It may still be landing**; if the branch is not there yet, use this section, which is self-sufficient.

### 6.1 Shape

- **Branch:** `factory/gameplay-v1` (cut from `main`). Folder `project-documents/gameplay-factory/`:
  - `RULES.md`: the factory rules (also pasted once by Nik, §6.4).
  - `BOARD.md`: every job, its status, what it waits on, and which numbers Nik should start next.
  - `jobs/JOB-NN.md`: one self-contained lesson per job.
  - `status/JOB-NN.md`: numbered steps with ✓ marks, percent done, branch and commit of the result.
- **Tracker PR:** a draft PR from `factory/gameplay-v1` into a frozen base branch `factory/gameplay-v1-base` (never `main`, never merged). You call `subscribe_pr_activity` on it, so every worker push wakes you. You keep the count; Nik never says "it is in".
- **Code goes elsewhere.** A worker's code goes on its own branch `gameplay/job-NN-<slug>` with a PR into the integration branch `gameplay/recovery-v1` (not `main`). Its status file on the tracker branch names that branch and commit. You review, merge into `gameplay/recovery-v1`, and later take one gated PR from there into `main` with Nik's OK.
- **Commit message:** `Job N done: <title>` (or `Job N step k: <title>` for progress).
- **Up to 5 worker chats at once.** One job per chat. A chat that cannot write to GitHub gives Nik the files to drop into your project chat.

### 6.2 What a job file must contain (teach like a great teacher)

GPT-5.6 Sol workers start cold and never see your history. Each `jobs/JOB-NN.md` has:

1. Goal in two sentences, and why it matters to Nik and Daniel.
2. Exact branch to cut from and to push to; files to read first, with links and `file:line`.
3. Numbered steps, each small enough to finish and push on its own.
4. The rules that apply (from §1), copied in, not linked.
5. Tests to write **first** (a failing test that shows the gap), then the code.
6. Commands to run, and what passing output looks like.
7. A "done" checklist the worker must tick before saying done: tests green, no `main` push, no deploy, no billing, no new SDK scopes, privacy kept, status file updated.
8. What to do when stuck: stop, write the blocker in the status file, push.

### 6.3 Review: one build, one review, one fix

Per job: one worker build, one review by you (and Codex where §6.6 says), one fix round. A job that fails the same check twice is BLOCKED; you rewrite the job file before anyone tries again.

### 6.4 Factory rules text (Nik pastes once into a ChatGPT project named "Gameplay")

> You are a GPT-5.6 Sol worker in the Career Mode Showdown gameplay factory. Nik will type only a number. That number is a job. Open the repo nikahanghojjati-oss/fifa17-career-showdown2, branch factory/gameplay-v1, and read project-documents/gameplay-factory/RULES.md, then BOARD.md, then jobs/JOB-NN.md for that number. Do only that job, step by step. After each step, update status/JOB-NN.md and push to factory/gameplay-v1 with the commit "Job N step k: title"; when finished, "Job N done: title". Put code on the branch the job names, never on main. Never deploy, never change Firebase billing or settings, never force-push or delete. The Claude Gameplay lead owns product truth; if the job file and anything else disagree, follow the job file and write the question in the status file. If you cannot push, give Nik the changed files in full so he can drop them in the Gameplay lead's chat.

Put the same rules in `AGENTS.md` (a short "Gameplay factory" section) through one small docs PR into `main` under the normal POS20 gates, so Codex understands a bare job number too. Until it merges, `RULES.md` on the factory branch is the source.

### 6.5 Automated testing and bug hunt (replaces Nik's manual smoke tests)

`main` already has most of the machinery. Build on it; do not start over.

- Already there: Playwright 1.62.1 browser audits, many with two Chromium contexts (`CMS_CHROMIUM_MULTI_CONTEXT=1`, see `npm run test:browser` and `npm run test:ssjr:browser` in [package.json](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/main/package.json)); Firebase emulator proofs in `tests/firebase/*-emulator.cjs`, run with `npx firebase-tools@15.28.1 emulators:exec --only auth,firestore --project demo-…` (a `demo-` project needs no billing, so it fits Spark rules); contract suites (`npm run test:contracts`, `npm run test:ssjr`).
- Gap: most workflows run on `pull_request` and on push to `main` only. Add one fast workflow on push to `gameplay/**` and `factory/gameplay-v1` that runs the contract suites, the emulator rules proofs against the **composed** production rules, and the two-manager journey.
- **Two-manager journey test (G-2):** Daniel and Nik as two browser contexts against the auth + firestore emulators. Pair → setup → transfer window → season results for every season → commit → final winner → Terminal Close → start a second Showdown → fresh contexts → career totals identical for both managers. Variants: abandon mid-Showdown (career totals drop that Showdown), reload at every step, both managers submit at the same moment, network drop and reconnect, a third account denied on every path. Phone viewports 393×660 and 360×640 for function (buttons reachable), not for looks.
- **Privacy checks:** no step lets one manager read the other's unfinished guesses, signings or season inputs.
- **Every bug found becomes a factory job** with a failing test first. You add it to BOARD.md and tell Nik the number.
- Production is never written by tests. The one real two-device run (G-15) is the only time Nik plays for proof, and its SSJR credit follows the existing SSJR-2.1 rules only.

### 6.6 Codex, used reasonably

Codex reviews: every PR that changes Firestore Rules or providers (G-7, G-8, G-10, G-12), anything touching privacy, and the final gated PR into `main`. Skip Codex for test-only and docs jobs. One Codex review per PR, then you decide.

### 6.7 How you talk to Nik

Plain words. Short. Tell him which numbers to start ("Start 3, 4 and 5"), and when a job is done. He never relays files. Questions to him are rare and answerable in one word, with your recommendation.

---

## 7. Lead-to-lead relay (Nik never carries messages)

Same contract as the Visual ↔ GPT-5.6 Sol relay ([CONTRACT.md v1.1](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/visual/cinematic-system-v10/project-documents/model-relay/CONTRACT.md)), adapted:

- **Branch:** `leads/relay` (set up by the Visual lead with this file). Folder `project-documents/leads-relay/`: `CONTRACT.md`, `LATEST.md` (the one live slot), `archive/` (every message, never edited).
- **Tracker PR:** [PR #312](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/312), a draft from `leads/relay` into `leads/relay-base` (frozen copy of `main` @ `2de2373`, never merged). Already open; the Visual lead is subscribed. Both leads call `subscribe_pr_activity` on it, so a push from one wakes the other.
- **Message ids:** `V2G-NNN_<topic>` (Visual → Gameplay) and `G2V-NNN_<topic>` (Gameplay → Visual). A direct reply reuses the number; `R2`, `R3` on collision. First message: `V2G-001_gameplay-handoff`.
- **Header:** `From:`, `To:`, `Message-ID:`, `In-Reply-To:`, `Date:`, `Status: READY`, and `Evidence-Refs:` (branch @ commit) when citing code.
- **Rules:** on wake, fetch with an explicit refspec, read `LATEST.md`, act only if `To:` is you. Before writing, re-read `LATEST.md`; never overwrite an unanswered message from the other lead (you may supersede your own, saying so). Write the archive copy **and** `LATEST.md` in one commit; fast-forward push only, never force. The message holds the full answer, not a pointer to chat.
- **If a wake is missed:** Nik can type "relay" to either lead; it means "read `LATEST.md` and act if it is yours".
- GPT-5.6 Sol keeps its own relay with the Visual lead on `visual/cinematic-system-v10`. The leads relay does not replace it.

---

## 8. Your first moves

1. Read §2's three source documents and this file. Check `main` is still `2de2373`; if it moved, note the new SHA (source drift) and re-check the cited lines.
2. Subscribe to the leads relay tracker [PR #312](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/312) and answer `V2G-001` on `leads/relay` with a `G2V-001`: accept or change the data contract (§4), confirm the job list (§5).
3. Create `factory/gameplay-v1`, its base, the tracker PR, `RULES.md`, `BOARD.md`, and jobs G-0 to G-3 in full. Subscribe to the tracker PR.
4. Tell Nik: paste the rules text (§6.4) into a ChatGPT project named "Gameplay", then type 0 in one chat, and 1, 2 and 3 in three more.

---

## Next steps

| Step | Who | Where | File | What comes back |
| --- | --- | --- | --- | --- |
| 1 | Nik | Gameplay lead's Claude project chat | The one-line paste prompt | Gameplay lead starts |
| 2 | Gameplay lead | Repo, `leads/relay` | This file → `G2V-001` | Visual lead is woken by the tracker PR |
| 3 | Gameplay lead | Repo, `factory/gameplay-v1` | RULES, BOARD, JOB-00..03 | Job numbers for Nik |
| 4 | Nik | ChatGPT project "Gameplay" (GPT-5.6 Sol) | Rules text §6.4, then numbers | Pushes wake the Gameplay lead |
| 5 | Visual lead | Visual factory | Fixtures matching `DATA_CONTRACT_V1.md` | Screens ready to bind (G-11, G-13) |
