# Status · JOB-13 · Part 1: Trophy Room and Career Statistics on the real career model

State: DONE
Step: 7 of 7
Updated: 2026-10-04 UTC
Chat: Claude cloud session (git and node directly; browser and emulator results from GitHub CI)
Code branch: gameplay/job-13-career-screens
Head commit: 8d3a27cf9278d7ad128316444bc84b9dac62bfdc
PR: #347 into gameplay/recovery-v1 (https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/347). Not merged; the Team G lead reviews and merges.
CI run: Validate Gameplay Fast https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37221386284 · Validate POS20 https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37221390631

## Done checklist
- [x] PASS: Field map recorded (below). Model gaps: none.
- [x] PASS: Tests first. With js/careerScreensV10.js absent, `node tests/contracts/career-screens-v10-contracts.cjs` failed with `Error: Cannot find module '/home/user/fifa17-career-showdown2/js/careerScreensV10.js'`.
- [x] PASS: `node tests/contracts/career-screens-v10-contracts.cjs` gives `PASS career screens V10 contracts: 10 checks.` `npm run test:contracts` exits 0 with startup gzip 37495/37500 (unchanged; `startup 162809/37495` line unchanged). `npm run test:ops` gives `# pass 73`, `# fail 0`.
- [x] PASS: "Validate Gameplay Fast" is green on exact head 8d3a27cf (run 37221386284), including `Two-manager browser journey`, `Gameplay contracts` and both Composed Rules jobs. "Validate POS20" is green on the PR head (run 37221390631): all 12 POS20 checks succeed, including the exact-head cognitive seal.
- [x] PASS: Only the §2 files changed, plus the job's one containment-assertion update in career-screen-seam-contracts.cjs check 16 (see Notes). Team V files come from f4da9a3f with data-entry and path edits only (listed in the PR body). index.html is unchanged. RUNTIME_REVISION stays 1.9.1-r52. Legacy and Rivalry Statistics stay hidden (V8).
- [x] PASS: PR #347 is open into gameplay/recovery-v1 with the field map and the "Team V file edits" list. State: DONE. I did not merge.

## Field map (step 1): Team V frame ← model (`toV10Frame` in js/careerScreensV10.js)
- `status` ← `careerScreenSeam.careerScreenView(screen, model).status`. Invalid or missing model → `unavailable`. Ready/partial with a non-finite rendered field → `unavailable`.
- `managerOrder` ← always `["daniel","nik"]`. Daniel is left and Nik is right in every row and image.
- CS `managers.<m>.{careerPoints, seasons, seasonWins, seasonDraws, seasonLosses, championsLeagues, leagueTitles, domesticCups, totalTrophies, bestSeasonScore, averageLeaguePoints, averageLeagueGoals}` ← `model.managers.<m>.<same>`
- CS `showdowns.<m>.{completed, wins, draws, losses}` ← `model.managers.<m>.showdowns`
- CS `expectedCareerTableRows` [Daniel, Nik] `rank` ← index in `model.trophyRoom.standings` + 1 (`level` → both 1)
- `coverage.{readable, indexed}` (partial) ← `model.coverage`
- TR `managers.<m>.{championsLeagues, leagueTitles, domesticCups, totalTrophies}` ← `model.trophyRoom.cabinet.<m>`. `careerPoints` and `seasonWins` ← `model.managers.<m>`. `displayName` ← "Daniel"/"Nik".
- TR `showdowns.<m>.wins` ← `model.managers.<m>.showdowns.wins`
- TR `standings` [Daniel, Nik] `{careerPoints, seasonWins, rank:"#n"}` ← as above
- TR `records[]` `{label upper-cased, manager, value}` ← `model.trophyRoom.records` (numeric values only)
- `previewLabel` ← `model.interimLabel` only. Team V's "Preview data" is never set.
- loading / unavailable ← `{status, managerOrder}` only, with no numbers.

## Model gaps
- none. (Team V CS `leaderLabels` 5–7 are not drawn by their renderer, so they are not mapped.)

## Notes
- Online without a supplied model, both screens show Team V's honest **unavailable** state. This is the same source as the existing seam path, because the closed-Showdown loader is not yet wired to these screens. That wiring is a candidate follow-up for the lead.
- `tests/contracts/career-screen-seam-contracts.cjs` check 16 required the `#careerStatisticsButton` containment that this job lifts. It now asserts that Career Statistics is not hidden and still requires Legacy and Rivalry Statistics to be hidden. This is recorded in the PR body.
- Team V's stylesheets set page-wide rules (`html,body{overflow:hidden}`, `.screen`), so the binder enables them only while a V10 screen is showing.
- The branch picked up the lead's job-22 merge (69744080). I merged it in with merge commit acade5aa, with no force-push. Job 23 then landed on gameplay/recovery-v1 and caused a registry conflict in POS20_SUPPLEMENTAL_PRODUCT_TESTS.json and pos20-control-plane.test.mjs. I merged it in with merge commit 8d3a27cf, keeping both contracts. After that: contracts exit 0, startup gzip 37495/37500, ops 73/0, all 16 CI checks green, PR mergeable (clean).
