# Codex r87 red team C2 + E: verdicts

Checked by the red-team thread on 1 Nov 2026 against gameplay/r87 51f2e515 (Codex audited b2ba864e). Fixes are in PR #1148 (claude-gameplay/r87-redteam-fixes).

| ID | Sev | Verdict | Fix / reason |
|---|---|---|---|
| R87-E-04 | P0 | **ACCEPTED, fixed (#1148)** | Reproduced on the emulator: three signings with the r87 overall and position fields hit the 1,000-expression limit, so `lockSignings` was denied. The private signing lock now uses `ssjrActorWriteAuthorityValid` (account, device, ACTIVE session). The pair envelope still runs on the linked public ledger write in the same transaction (`public.updatedAt == request.time`, same session and device, actor role). The lifecycle test now uses 3 full r87 rows per phone and fails before the fix. |
| R87-E-01 | P0 (app-bug) | **ACCEPTED, fixed (#1148)** | A window START for season N > 1 now needs `seasonCommits/season_(N-1)` to be ACKNOWLEDGED. Cost: +1 lookup per START for seasons 2 to 10, none on later writes or deliveries. The lifecycle test tries season 2 first and fails before the fix. |
| R87-E-02 | P0 if old Rules | **ACCEPTED as a release prerequisite, no code** | Correct: with the r86 Rules, the spins gate fails closed and does not fail open as #1101 claimed. The release deploys Rules first (rules-first job), so the r87 client never meets old Rules on a correct release. The lead keeps this as a hard release step. #1101's wording was wrong. |
| R87-E-03 | P3 | **DEFERRED r88** | The estimate charges a spins mark like a full transfer write (about +12 per season in the estimate, 0 real reads). It is a conservative overestimate and costs no real reads. Pricing the mark separately needs per-operation pricing in the budget layer. |
| R87-E-05 | P2 | **DEFERRED r88** | Valid: an own-role private read also fetches the public phase (−1 real read per own delivery if moved). Deferred because it is a Rules change to two read helpers plus the build-script anchors and the lookup model, the per-season saving is small and not yet measured, and 2.0.0 is already taking two Rules changes. First item for r88 reads. |
| R87-C2-03 | P2 | **ACCEPTED, fixed (#1148)** | The scene's error listener now ignores a failed `<link>` (the optional Google title/stamp fonts). Script, WebGL and setup failures still post cms-rr-error. Contract L1e fails before the fix. |
| R87-C2-01 | P1 | **ACCEPTED, routed to the #1105 owner** | The release panel names only "Manu García". Show the shirt number and overall (and position) in every release line, and carry the shirt in the scene payload. The fix belongs in js/rosterRouletteStep.js, which #1105 owns. |
| R87-C2-02 | P2 | **ACCEPTED, routed to the #1105 owner** | The non-coordinator never sees that his own spin mark was refused. Show the own-mark refusal or retry line for either manager. The fix belongs in js/productionSharedTransferChallenge.js (#1105 / #1118). |
| R87-C2-04 | P1 | **Already in #1105 (F2-03)** | Stale history-retry card above the scene. |
| R87-C2-05 | P1 | **Already in #1105 (F2-01)** | Result panel left mounted when the transfer page fails to load. |
| R87-C2-06 | P1 | **Already in #1105 (F2-06)** | Own Special Player accepted as a signing after a locally done roulette with no draw loaded. |
| Round 1 R87-C-01..06, SQ-1/2/4 | | FIXED (confirmed by Codex) | |
