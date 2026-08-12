# Career Mode Showdown v1.1.3 — Post-Merge / Production Handoff

## Status

**v1.1.3 is COMPLETE, MERGED, DEPLOYED, TWICE-PROVEN IN PRODUCTION, and PROTECTED.**

- Application: `v1.1.3`
- Runtime asset revision: `1.1.3-r1`
- Frozen official pre-merge candidate: `49fa0496453b3235de0cd87350945fbaedc4291a`
- PR: #19 — `v1.1.3: fix League Wheel reroll and expand cinematic football visuals`
- Immutable production runtime authority: `29760bbf33c974267bd1ad64d0839f73ad8051fa`
- Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
- Next legal substantive build: Candidate C — Atomic Restore + Recovery UX.

This handoff supplements the continuous v1.1.3 diagnostic log/addenda and the frozen official-candidate record. Do not replace those records; use them for the full failure/correction chronology.

## Owner-requested scope completed

The maintenance release implements the August 11 owner request without widening gameplay or persistence scope:

1. fix the League Wheel visual reroll that could occur after a league stopped/selected but before Continue;
2. replace the active James Rodríguez photograph and never reuse the previously rejected James sources;
3. replace Marcus Rashford and Anthony Martial source photographs;
4. favor high-quality, photogenic, dramatic/historic football imagery rather than flat interview presentation;
5. add at least seven additional licensed photographs to appropriate screens with controlled UI/UX placement;
6. preserve protected gameplay/scoring/storage/Candidate A/B behavior and the owner-liked loading screen.

## League Wheel root cause and correction

The defect was not a second random league draw. The wheel's CSS transform transition remained active after the intentional spin. The spin target contained five full rotations plus the selected angle; later render normalization moved the transform to the mathematically equivalent selected-only angle. Because the transition was still active, the browser could animate that normalization and visually appear to reroll before landing on the same league.

v1.1.3 makes the transition operation-scoped:

- transition is armed only for an explicit real spin;
- cancel and stale-operation paths disarm it;
- the operation is guarded by an operation ID, timer and busy state;
- after persistence succeeds, transition is disarmed before selected-angle normalization;
- the selected league remains confirmation-pending until explicit Continue;
- random selection and gameplay semantics are unchanged.

The permanent League Confirmation family now contains the settled-wheel no-reroll regression check. It remained green through diagnostic, both official pre-merge proofs and both production proofs.

## Final licensed football visual set

The active route-scoped licensed visual system now contains twelve local derivatives across eleven destination screens:

- Create Showdown — James Rodríguez, 2014 FIFA World Cup action/historic source;
- Transfer Challenge — Marcus Rashford, Manchester United vs Chelsea, April 2017;
- Transfer Challenge — Anthony Martial, Manchester United / Champions League 2017 source;
- League Wheel — Cristiano Ronaldo, Euro 2016;
- Club Assignment — Paul Pogba, Manchester United 2016;
- Showdown Home — Zlatan Ibrahimović, Manchester United 2016;
- Season Results — Antoine Griezmann, Champions League 2016;
- Season Summary — Neymar, Rio 2016 Olympic gold final;
- Legacy — Radamel Falcao, 2012 Europa League title celebration;
- Rule Book — Mario Balotelli, Euro 2012 semifinal celebration;
- Career Statistics — protected Lionel Messi derivative;
- Trophy Room — protected Philipp Lahm derivative.

The rejected prior James/Rashford/Martial derivatives required by the forbidden-archive validator are absent. The earlier James interview/Real Madrid derivative and previously rejected 2019 James derivative are not active or reused.

The archive remains route-scoped and lazy: Home startup does not preload the football-photo archive. The protected Marco Reus loading/Home binary remains unchanged apart from the release cache identity alignment required to keep one cached portrait entry.

## Visual acceptance evidence

The permanent Licensed Football Visuals browser family covers 11 destination screens at desktop, compact desktop/windowed Chromebook size, reduced-motion windowed size, and mobile DPR2. That produces 44 screenshots per execution.

Before merge, both official visual executions produced the same accepted 44-image evidence. Production Pass 1 and Production Pass 2 also produced 44 images each, and every Production Pass 2 screenshot was byte-for-byte identical to Production Pass 1. Production evidence also matched the previously accepted official compositions, so no deployment crop/layout drift was introduced.

Production Licensed artifact IDs:

- Pass 1: `9127430321`
- Pass 2: `9127621274`

## Performance protection

The original startup budgets were never raised:

- raw eager ceiling: 165,000 bytes;
- gzip eager ceiling: 37,500 bytes.

Final guarded v1.1.3 measurement:

- **164,965 raw bytes**;
- **37,006 gzip bytes**.

The first diagnostic Final Polish run measured 165,213 raw bytes and correctly failed by 213 bytes. An initial attempt to compact lazy League Wheel comments did not change eager size and was explicitly rejected as ineffective. The actual eager growth was traced to visual routing/loading logic and compacted without removing behavior or weakening the threshold.

## Important diagnostic/failure closure

The permanent public diagnostic trail records all failures. Load the diagnostic log plus Addenda 1–5 for exact details. Important classes include:

- startup raw-budget failure at 165,213 > 165,000;
- protected Reus cache-revision mismatch between Home/startup references;
- stale current-release documentation authority;
- superseded James/Rashford/Martial derivative binaries still tracked in the archive;
- Candidate A provenance fallback still stamped 1.1.2;
- visual evidence harness missing an explicit two-paint-frame settlement;
- reduced-motion audit false-positive caused by Chromium serializing `transition-property:none` as `none 1e-06s`;
- contradictory Static App/Stability wording for the canonical owner-priority maintenance label.

All were corrected without gameplay/persistence redesign or threshold weakening.

## Official pre-merge proof — 2× on one immutable candidate

Frozen candidate: `49fa0496453b3235de0cd87350945fbaedc4291a`.

Official Pass 1 completed all 13 permanent families green:

- Home `31559311684`
- League `31559311683`
- Transfer `31559311686`
- Season Review `31559311693`
- Statistics `31559311681`
- Settings `31559311692`
- V1 Visual `31559311704`
- Licensed Visuals `31559311701`
- Final Polish `31559311688`
- Static App `31559311710`
- Candidate B `31559311709`
- Stability `31559311685`
- Burn-In `31559311699`

Pass 2 independently reran the permanent jobs on the same frozen SHA, including both dependent jobs for Licensed Visuals and Candidate B, Stability contracts + two-cycle Chromium, and all five Burn-In matrix jobs. All completed green. The 44 Pass-2 licensed screenshots were pixel/byte-identical to Pass 1.

PR #19 then merged with expected-head protection against exactly `49fa0496453b3235de0cd87350945fbaedc4291a`.

## Production runtime and GitHub Pages

Expected-head merge produced immutable runtime authority:

`29760bbf33c974267bd1ad64d0839f73ad8051fa`

GitHub Pages run `31560129029` failed on its first attempt while `jekyll-github-metadata` called GitHub and encountered an SSL certificate verification error (`self-signed certificate in certificate chain`). The repository/Jekyll content had not failed validation; this was treated as an external Pages runner/network failure.

The failed Pages job was rerun on the **same immutable runtime SHA**, with no repository correction. The retry succeeded:

- build `94000940973` — SUCCESS
- reporting `94001024880` — SUCCESS
- deploy `94001024974` — SUCCESS

This same-SHA successful retry is the deployment authority for v1.1.3.

## Production Pass 1 — 13/13 GREEN

All permanent families passed on `29760bbf33c974267bd1ad64d0839f73ad8051fa`:

- Home `31560129514`
- League `31560129478`
- Transfer `31560129499`
- Season Review `31560129461`
- Statistics `31560129526`
- Settings `31560129448`
- V1 Visual `31560129497`
- Licensed Visuals `31560129446`
- Final Polish `31560129509`
- Static App `31560129492`
- Candidate B `31560129579`
- Release Burn-In `31560129498`
- Stability `31560129577`

Stability Pass 1 jobs:

- contracts `94000566792` — SUCCESS
- two-cycle Chromium `94000603405` — SUCCESS
- deployed-site smoke `94001319819` — SUCCESS

The public smoke passed exact runtime bytes, error provenance, Home/Reus, licensed photos, Candidate A export, Candidate B import analysis and the complete public gameplay/navigation journey.

## Production Pass 2 — 13/13 GREEN

The same production workflow runs were rerun as attempt 2 without changing repository bytes. Every single-job family reran; dependent/matrix families regenerated fresh jobs.

Fresh Burn-In jobs:

- pass 1 `94002300911` — SUCCESS
- pass 2 `94002301333` — SUCCESS
- pass 3 `94002301585` — SUCCESS
- pass 4 `94002323587` — SUCCESS
- pass 5 `94002319765` — SUCCESS

Fresh Licensed Visual jobs:

- contracts `94002257256` — SUCCESS
- browser `94002256569` — SUCCESS

Fresh Candidate B jobs regenerated and passed under the same production attempt.

Fresh Stability jobs:

- contracts `94002320365` — SUCCESS
- two-cycle Chromium `94002320233` — SUCCESS
- deployed-site smoke `94003033921` — SUCCESS

The second public smoke again passed exact public bytes, provenance, Home/Reus, all football photos, Candidate A, Candidate B and the complete public journey.

After Production Pass 2, the immutable runtime SHA had zero failed workflow runs and zero in-progress workflow runs.

## Documentation closure helper diagnostic

The first branch-only documentation helper definition at commit `4bd243ac99a25414be39b6a5a84649ea6dca300c` produced workflow run `31561336864` with no jobs because the YAML definition was invalid: a long embedded Python triple-quoted handoff body was not indented as part of the YAML block scalar. The helper therefore published **zero authority-document changes**. `main` and the proven runtime were untouched. The handoff was then created directly on the documentation branch, and the helper was simplified to guarded exact text replacements only.

## Protected subsystem confirmation

v1.1.3 does not alter:

- max-11 scoring or 0–0-only tiebreak logic;
- exactly-two-manager model;
- same-league/different-permanent-club rules;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- `js/screens.js` route/history authority;
- exactly three canonical storage keys;
- `js/storage.js` sole persistence ownership;
- Candidate A backup format/checksum/non-mutating export semantics;
- Candidate B read-only import analysis/no-write semantics;
- owner-liked loading composition/timing;
- v1.2.0 reservation for Installable Offline App.

Candidate A's fallback application provenance stamp is aligned to 1.1.3; this is not a backup-format change.

## Next task

Candidate C — Atomic Restore + Recovery UX — is now the first legal stage allowed to commit imported canonical state.

It must build on Candidate A export and Candidate B analysis, revalidate immediately before apply, snapshot exact raw bytes, compute final values in memory, write only through `js/storage.js`, verify the full multi-key transaction, roll back every affected key byte-for-byte on any write/verification failure, verify rollback, and surface rollback failure as a critical recovery state.

Read `NEXT_TASK.md` before implementation for the complete mandatory sequence and failure-injection matrix. Create the Candidate C public handoff at the beginning of implementation, not at the end.
