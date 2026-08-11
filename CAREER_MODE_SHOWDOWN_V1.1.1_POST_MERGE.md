# Career Mode Showdown — v1.1.1 Post-Merge Production Continuation

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Runtime release: `v1.1.1 / 1.1.1-r1`
Runtime merge authority: `29caae874bf00deba89bdb1ffcfc0654ead3928f`
PR: `#16 — v1.1.1: refresh James Rodríguez Real Madrid source`

Read this file after `CAREER_MODE_SHOWDOWN_V1.1.1_JAMES_SOURCE_REFRESH_HANDOFF.md`. The earlier handoff records source selection, deterministic asset construction, gate deepening, diagnostic failures, cleanup, and the path to the frozen PR candidate. This continuation records the final twice-run release proof, exact merge/deployment state, the production transport-noise incident, and the next legal roadmap step.

## 1. Owner directive carried through release

The owner required the next build to replace the James Rodríguez picture source while keeping the replacement specifically from his Real Madrid period. The owner also required development to remain roadmap-aware, deepen the analytical quality of the gates, and execute each permanent gate family twice for this build.

Standing project rules remained active:

- build directly in GitHub;
- preserve established gameplay/storage/routing/state-machine authority;
- preserve the clean-anchor football-photo architecture;
- keep FIFA-style diagonal energy while protecting faces;
- protect the owner-liked Marco Reus loading presentation;
- preserve Rashford, Martial, Messi and Lahm source authority;
- keep Candidate A backup/export intact;
- do not pull Candidate B or Candidate C into a finite visual maintenance patch;
- record meaningful actions and evidence publicly for the next developer.

## 2. Final James source and runtime asset

Selected licensed source:

`James Rodríguez in September 2016 - 02.jpg`

Wikimedia Commons page:

`https://commons.wikimedia.org/wiki/File:James_Rodríguez_in_September_2016_-_02.jpg`

Verified release provenance:

- subject: James Rodríguez;
- date: 28 September 2016;
- context: Real Madrid post-match interview after Borussia Dortmund vs Real Madrid;
- author/source account: Real Madrid;
- license: Creative Commons Attribution 3.0 Unported;
- source dimensions: 863 × 1080;
- source frame used: `[0, 0, 863, 1080]`;
- semantic crop: none;
- upscaling: none.

Final runtime asset:

`assets/football/james-rodriguez-real-madrid-2016-smart-v111.webp`

Manifest ID:

`james-rodriguez-real-madrid-2016-smart-v111`

Output:

- dimensions: 863 × 1080;
- WebP quality: 92;
- bytes: 85,228;
- runtime fit: `contain`;
- secondary responsive crop: forbidden.

Fingerprints:

- Commons SHA-1: `8f1b085518ab1b36e25cda150afb3ae6900622d7`;
- source SHA-256: `bd29eb5b69468bf7a542f10f3a5c3aebc5d7b5d66beaacc2980c3b987c0b659c`;
- output SHA-256: `0ed0f578a12f42b19b071488a51fde6b6faac1554ff81b4ffa7a5d810ce73be8`.

The replaced `james-rodriguez-real-madrid-2019-smart-r5.webp` is absent from the active runtime and is rejected by permanent source/runtime-request contracts.

## 3. Visual architecture preserved

v1.1.1 changes the James source, not the approved presentation philosophy.

The final James panel retains:

- clean-anchor treatment;
- complete derivative visibility;
- no CSS colour filter;
- no destructive `cover` crop;
- separate identity/copy zone;
- face-safe foreground accent rail only in the lower image zone;
- decode plus paint-frame settlement before visual evidence is captured.

Protected visuals remain:

- Marco Reus Home/loading treatment;
- Marcus Rashford final 2017 source;
- Anthony Martial final 2016 source;
- Lionel Messi protected r4 source;
- Philipp Lahm protected r4 source.

## 4. Final frozen PR candidate

Frozen pre-merge PR head:

`eb564a0bb5a5c864a3c42e71d0ceae2008ee0508`

The branch was not changed during the official final proof.

The permanent release matrix contains twelve families:

1. Validate Home Bootstrap
2. Validate League Confirmation
3. Validate Transfer Workstream
4. Validate Season Review
5. Validate Statistics Workstream
6. Validate Settings Workstream
7. Validate V1 Visual Immersion
8. Validate Licensed Football Visuals
9. Validate Final Polish
10. Validate Static App
11. Validate Stability Lane
12. Validate v1.1.1 Release Burn-In

Owner release rule:

Each family must have two independent successful executions on the same frozen candidate. A source/runtime change resets proof.

Final pre-merge result:

`12/12 families × 2 successful executions`

The second Licensed Football Visual execution produced screenshot artifact:

`9120108179`

The second visual artifact was manually inspected in addition to machine assertions. James retained complete head/face visibility and readable Real Madrid-era context at:

- 1366 × 768 desktop;
- 1100 × 720 compact desktop;
- 940 × 700 near-breakpoint/windowed;
- 390 × 844 DPR2 mobile.

The identity plate remained separate from the face and the diagonal accent remained below protected facial features. No threshold was weakened and no additional crop was justified by the evidence.

## 5. Exact protected merge

PR #16 was marked ready only after the frozen candidate earned the required pre-merge `2/2` proof.

Merge used expected-head protection against:

`eb564a0bb5a5c864a3c42e71d0ceae2008ee0508`

Runtime merge commit:

`29caae874bf00deba89bdb1ffcfc0654ead3928f`

Merge title:

`Merge v1.1.1 James Real Madrid source refresh`

No unvalidated branch movement was accepted between final PR proof and merge.

## 6. GitHub Pages production deployment

GitHub Pages deployment ID:

`5859266218`

Deployment SHA:

`29caae874bf00deba89bdb1ffcfc0654ead3928f`

Deployment result:

`SUCCESS`

Public application:

`https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The first production Stability smoke verified the public site rather than only checked-out source.

## 7. Production permanent gate runs

The production workflow IDs attached to the exact runtime merge are:

- Home Bootstrap: `31539874236`;
- League Confirmation: `31539874351`;
- Transfer Workstream: `31539874211`;
- Season Review: `31539874241`;
- Statistics Workstream: `31539874311`;
- Settings Workstream: `31539874361`;
- V1 Visual Immersion: `31539874207`;
- Licensed Football Visuals: `31539874256`;
- Final Polish: `31539874253`;
- Static App: `31539874250`;
- Stability Lane: `31539874244`;
- v1.1.1 Release Burn-In: `31539874249`.

The first production execution completed successfully across all twelve families.

Release Burn-In executed five independent complete release-gate journeys and all five passed.

Licensed Football Visuals passed both provenance/source contracts and the real Chromium browser audit.

Stability passed:

- storage/backup/release/CI contracts;
- two consecutive complete Chromium browser/backup/provenance/Home/photo cycles;
- deployed-site smoke.

The first deployed-site smoke passed:

1. exact runtime-byte parity against public Pages;
2. runtime-error provenance;
3. Home / Marco Reus visual audit;
4. crop-safe licensed football-photo audit, including the new James asset;
5. Candidate A non-mutating backup/export audit;
6. complete public gameplay/navigation journey.

## 8. Second production execution

The owner required every family twice, so the production matrix itself was also executed a second time on the unchanged runtime merge SHA.

The simple/workstream families completed their second attempt successfully.

Release Burn-In attempt 2 completed successfully with all five independent gate jobs green.

Licensed Football Visuals attempt 2 completed successfully:

- exact source/provenance contracts: success;
- real browser visual audit: success.

Second production Licensed Visual screenshot artifact:

`9120561993`

The second production artifact was downloaded and manually reviewed. James remained visually safe at the audited desktop/compact/windowed/mobile Create Showdown sizes. The visual evidence remained consistent with the pre-merge result; no recrop, frame relaxation or overlay removal was required.

## 9. Rejected second Stability transport-noise attempt

During Stability attempt 2, the storage/release contracts and repeated Chromium cycles passed. The final deployed-site smoke then failed at its first step.

This attempt is deliberately not counted as the second successful Stability execution.

Exact failure:

`assets/football/asset-manifest.json — fetch failed`

Important classification:

`TRANSIENT DEPLOYMENT-VERIFIER TRANSPORT FAILURE — NOT A BYTE MISMATCH`

The verifier did not report a different hash, byte length, runtime revision, James asset, manifest content, or application behavior. The GitHub-hosted Node runner failed a single network fetch for the manifest after successfully reading the expected revision.

The first production deployed-site smoke had already fetched and verified the same manifest and complete runtime successfully.

The failure was retained as evidence rather than hidden or averaged into a pass.

Gate-quality observation:

`scripts/verify-deployment.mjs` retries initial `index.html` revision availability, but individual runtime-file fetches are currently single-attempt operations. A transient transport failure therefore fails the byte-parity gate immediately even when no mismatched bytes were observed. This is a validation-reliability observation, not justification to weaken byte-parity requirements. If the condition recurs, bounded transport retry around individual runtime-file reads is an appropriate maintenance hardening candidate while retaining exact hash/length equality as the final authority.

## 10. Full Stability replacement execution

Instead of rerunning only the failed deployed-site job, the entire Stability family was restarted from its root so the second successful Stability proof would remain independent and complete.

Stability run:

`31539874244`

Final successful run attempt:

`3`

Jobs:

- stability contracts `93943486067` — SUCCESS;
- two consecutive Chromium stability cycles `93943532962` — SUCCESS;
- deployed-site smoke `93944514987` — SUCCESS.

The final deployed-site smoke again passed, in order:

1. exact public runtime-byte parity — SUCCESS;
2. deployed runtime-error provenance — SUCCESS;
3. deployed Home / Marco Reus audit — SUCCESS;
4. deployed licensed football-photo audit — SUCCESS;
5. deployed Candidate A backup/export audit — SUCCESS;
6. complete deployed gameplay/navigation journey — SUCCESS.

Therefore the release has two successful complete production Stability executions on the same immutable runtime merge: production attempt 1 and the full replacement attempt 3. The transport-only failed attempt 2 is not counted.

## 11. Final double-gate release result

Final pre-merge proof:

`12/12 permanent families × 2 successful executions on frozen PR head`

Final production proof:

`12/12 permanent families × 2 successful executions on exact merge SHA`

Additional depth inside those families includes:

- two five-way Release Burn-In executions;
- repeated Chromium cycles inside Stability;
- two successful public deployed-site Stability smokes;
- two production Licensed Football Visual browser executions;
- manual inspection of independent pre-merge and production visual artifacts;
- exact source/output provenance and fingerprints;
- compact-desktop plus standard desktop/windowed/mobile viewport coverage;
- old-James runtime-request rejection;
- unchanged startup/performance thresholds.

At the close of runtime validation there are zero failed and zero in-progress workflow runs attached to the current merge attempt state.

## 12. Protected systems confirmed unchanged

No intentional v1.1.1 behavior change was made to:

- maximum-11 scoring;
- 0–0-only league-position/league-points tiebreak;
- exactly-two-manager contract;
- League Wheel confirmation;
- Club Assignment save/reveal semantics;
- Transfer Challenge state machine;
- Season Review transaction boundary;
- Statistics calculations;
- Legacy/Trophy semantics;
- Settings preference semantics;
- `js/screens.js` navigation authority;
- `js/storage.js` persistence authority;
- current localStorage keys/schema;
- Candidate A backup/export semantics.

Candidate B import analysis and Candidate C restore remain unimplemented.

## 13. Current release status

Technical v1.1.1 status:

`COMPLETE, MERGED, DEPLOYED, TWICE-VALIDATED PRE-MERGE AND PRODUCTION`

Runtime authority:

`29caae874bf00deba89bdb1ffcfc0654ead3928f`

Application/runtime identity:

`v1.1.1 / 1.1.1-r1`

Owner real-device visual acceptance of the new James source:

`PENDING`

Automated gates, developer visual inspection and public-site validation do not substitute for the owner's subjective art-direction acceptance.

## 14. Next legal roadmap step

If the owner rejects a reproduced v1.1.1 James composition/detail:

- stay in the finite maintenance lane;
- reproduce the exact device/public failure;
- change only evidence-driven presentation/source behavior;
- preserve every protected system;
- rerun the strengthened visual/release matrix.

If the owner accepts v1.1.1 or explicitly defers further visual review, the next substantive roadmap task is:

`v1.1.0 Data Safety and Recovery — Candidate B: Import Analysis + Migration Preview`

Candidate B remains read-only. It must not mutate canonical local storage.

Its boundary remains:

- file/input-size ceiling;
- JSON/format/checksum/schema validation;
- future-format rejection;
- ordered non-mutating migrations;
- duplicate/conflict analysis;
- active/Legacy/preferences dry-run preview;
- zero canonical `localStorage.setItem()` / `removeItem()` writes.

Candidate C alone later owns atomic restore writes and rollback. PWA, profiles/save registry, cloud and two-device work remain downstream of their documented dependencies.

## 15. Continuation rule for the next developer

Do not restart from r4/r5 visual branches.

Do not restore the replaced James 2019 runtime derivative.

Do not reinterpret the rejected Stability transport failure as a product mismatch; its log explicitly reported `fetch failed`, not differing bytes, and a complete root-to-public Stability rerun passed afterward.

Do not begin Candidate C or later roadmap work before Candidate B.

Start from current `main`, read `00_DEVELOPER_START_HERE.md`, `NEXT_TASK.md`, the v1.1.1 source-refresh handoff, and this post-merge continuation, then inspect live source before coding.
