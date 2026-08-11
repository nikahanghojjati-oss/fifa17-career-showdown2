# Career Mode Showdown — Master Development Continuation — Post-Merge Addendum

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Read this file immediately after `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION.md`.

## Purpose

This file is the append-only post-merge continuation of the owner-requested rolling developer handoff. The main handoff records the complete r5 image rebuild investigation, source selection, crop work, review-workflow race, final 2017 Rashford authority, browser frame correction, conversation history, and actions through the final pre-merge checkpoint.

This addendum records every material action after that checkpoint so the next developer does not mistake the pre-merge `Immediate next action` section in the original handoff for the current project state.

Current source code remains the implementation authority. Final owner real-device visual acceptance remains separate from CI success.

## Owner directive still in force

The owner explicitly instructed the developer to build directly in GitHub rather than hand code back in chat, to replace and intelligently crop new pictures for James Rodríguez, Marcus Rashford, and Anthony Martial, and to continuously record the development actions and substantive conversation in the handoff for the next developer.

That directive remained in force through merge and deployment verification.

## Final r5 implementation authority

Final pre-merge PR head:

`1f5977e8d175c2baa2ae9f657fc5ff47b2f2ffa6`

PR:

`#11 — r5: rebuild James, Rashford and Martial photography`

PR #11 was merged using expected-head-SHA protection, so GitHub would have rejected the merge if the branch had moved after the final validation.

Merge commit on `main`:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

Merge title:

`Merge r5 smart-crop player photography rebuild`

Merge message:

`Deploy owner-requested rebuilt James Rodríguez, Marcus Rashford, and Anthony Martial photography with authored smart crops, final 2017 Rashford source, contain-only presentation, browser-proven Transfer frame geometry, provenance, and permanent validation contracts.`

## Final player assets now merged

### James Rodríguez

- runtime asset: `assets/football/james-rodriguez-real-madrid-2019-smart-r5.webp`
- source: `James Rodríguez in 2019.jpg`
- author/source: Real Madrid
- license: CC BY 3.0
- source crop: `[20, 0, 540, 705]`
- output: 520 × 705
- complete head, face, shoulders, Real Madrid shirt and crest protected
- runtime presentation: complete authored derivative with `object-fit: contain`

### Marcus Rashford

- final runtime asset: `assets/football/marcus-rashford-man-utd-2017-smart-r5.webp`
- source: `Manchester United v RSC Anderlecht, 20 April 2017 (29).jpg`
- author: Ardfern
- license: CC BY-SA 4.0
- source dimensions: 3672 × 4896
- authored crop: `[1050, 300, 2350, 2200]`
- output: 753 × 1100
- final crop is the reviewed face-and-upper-body 2017 crop, not the rejected intermediate 2016 r5 candidate
- runtime presentation: complete authored derivative with `object-fit: contain`

### Anthony Martial

- runtime asset: `assets/football/anthony-martial-man-utd-2016-smart-r5.webp`
- source: `Manchester United v Zorya Luhansk, September 2016 (26).JPG`
- author: Ardfern
- license: CC BY-SA 4.0
- source crop: `[0, 0, 1800, 2400]`
- output: 825 × 1100
- close subject-dominant crop with adjacent player trimmed as far as possible without cutting Martial
- runtime presentation: complete authored derivative with `object-fit: contain`

## Final browser-proven Transfer geometry

The final authored Rashford and Martial images remain full portrait derivatives under `contain`. The browser crop-quality gate demonstrated that the prior generic/wider Transfer media frame created too much empty side space around the contained portraits.

The final browser-proven geometry is therefore:

Desktop:

- Rashford media stage: 43%
- Martial media stage: 48%

Mobile and small-phone:

- Rashford media stage: 52%
- Martial media stage: 56%

This improves subject dominance by removing unused frame space. It does not zoom, transform-scale, or crop the runtime image. `object-fit: cover` remains forbidden for required football photography.

## Final pre-merge validation evidence

Exact validated PR head:

`1f5977e8d175c2baa2ae9f657fc5ff47b2f2ffa6`

All eleven permanent project workflows passed on this exact head before merge:

1. Validate Transfer Workstream
2. Validate Statistics Workstream
3. Validate V1 Visual Immersion
4. Validate Final Polish
5. Validate League Confirmation
6. Validate Home Bootstrap
7. Validate Static App
8. Validate Season Review
9. Validate Settings Workstream
10. Validate Licensed Football Visuals
11. Validate Stability Lane

The Licensed Football Visuals workflow included the final source/crop/provenance contract and real Chromium visual audits.

The Stability Lane included storage/release/CI contracts and two consecutive browser/provenance/Home/crop-safe-photo audit cycles.

## Merge action

The developer fetched PR #11 immediately before merge and verified the expected head was still:

`1f5977e8d175c2baa2ae9f657fc5ff47b2f2ffa6`

The merge was then performed with `expected_head_sha` protection.

GitHub returned a successful merge and created:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

No unvalidated branch movement was accepted between final CI and merge.

## Post-merge GitHub Pages deployment

The exact merge commit produced a GitHub Pages deployment.

Deployment ID:

`5850071239`

Environment:

`github-pages`

Deployment status:

`success`

Deployment environment URL:

`https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The deployment payload identified the exact merge SHA:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

This confirms the r5 merge was published rather than merely present in repository history.

## Post-merge Licensed Football Visuals verification

The permanent Licensed Football Visuals workflow ran again on the exact merge commit after merge.

Post-merge run:

`31489631203`

Head SHA:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

Conclusion:

`success`

This proves the merged r5 source/crop/provenance contracts and real browser visual checks passed again after merge.

## Post-merge Stability Lane verification

Post-merge Stability Lane run:

`31489631204`

Head SHA:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

Final conclusion:

`success`

The post-merge Stability Lane passed all three jobs:

### 1. storage-release-ci-contracts

Conclusion: `success`

Protected release identity, storage recovery, CI ownership and related stability contracts passed.

### 2. two-consecutive-browser-audits

Conclusion: `success`

The following complete sequence passed twice consecutively:

- real browser gameplay/navigation audit
- runtime error provenance audit
- Home/Marco Reus visual audit
- crop-safe required football-photo audit

### 3. deployed-site-smoke

Conclusion: `success`

This is the most important post-merge proof because it exercised the public GitHub Pages build rather than only checked-out source.

The deployed-site smoke successfully completed:

- exact deployed tree/runtime-byte verification against merged source
- deployed runtime error provenance audit
- deployed Home / Marco Reus visual audit
- deployed James/Rashford/Martial/Messi/Lahm crop-safe football visual audit
- complete deployed gameplay/navigation journey

All steps passed on the public GitHub Pages URL.

## Post-merge workflow state check

After Stability Lane completed, GitHub Actions was queried for failures attached to merge SHA:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

Failure count:

`0`

GitHub Actions was also queried for in-progress runs attached to the same merge SHA.

In-progress count:

`0`

Therefore the exact r5 merge commit has no remaining failed or active workflow runs at the end of this implementation verification.

## Protected systems confirmed during r5 validation

The r5 work intentionally did not redesign or alter the accepted core systems. Permanent CI continued to protect:

- Marco Reus startup/Home behavior
- Lionel Messi r4 Statistics visual
- Philipp Lahm r4 Trophy Room visual
- Showdown creation and navigation
- League confirmation
- Club assignment
- Transfer Challenge behavior
- Season entry and Season Review
- maximum-11 scoring and existing tiebreak behavior
- Statistics
- Legacy
- Settings
- local persistence and recovery behavior
- diagnostics and runtime error provenance
- initial shell/runtime budget
- reduced-motion behavior
- centralized Smart Back behavior

## Final visual acceptance status

Technical status:

`MERGED, DEPLOYED, AND POST-MERGE GREEN`

Owner art-direction status:

`OPEN UNTIL REAL-DEVICE OWNER REVIEW`

Do not tell a future developer that the owner has visually accepted r5 simply because all automated and browser gates passed.

The owner should inspect the deployed build on the real devices they care about, especially:

- Create Showdown — James Rodríguez
- Transfer Challenge — Marcus Rashford
- Transfer Challenge — Anthony Martial
- Home/loading — Marco Reus regression check

If the owner rejects a composition on a real device, treat that evidence as a release-quality visual blocker and correct the presentation from the current r5 implementation. Do not revert to the rejected r3/r4 images or the intermediate 2016 r5 Rashford candidate merely because those states exist in Git history.

## Conversation continuation recorded after original handoff checkpoint

After the original handoff's `Immediate next action` section, the developer continued to tell the owner that implementation was still happening directly in GitHub and did not switch back to handing code over in chat.

The developer reported that:

- the final pre-merge SHA was fully green across all eleven permanent workflows;
- PR #11 would be merged only with expected-head-SHA protection;
- PR #11 merged successfully;
- post-merge verification would continue instead of stopping at the merge;
- the exact GitHub Pages deployment succeeded;
- the post-merge Licensed Football Visuals browser audit succeeded;
- post-merge Stability Lane passed its storage/release contracts and two consecutive Chromium cycles;
- deployed-site verification was allowed to finish through exact deployed bytes, runtime provenance, Home/Reus, crop-safe player photography, and the complete deployed gameplay journey;
- the deployed-site smoke ultimately passed all of those steps.

No additional owner instruction superseded the image-rebuild or continuous-handoff directive during this final verification period.

## Post-original-handoff action log

65. Froze exact pre-merge PR head `1f5977e8d175c2baa2ae9f657fc5ff47b2f2ffa6` after the strengthened static crop/frame contract and rolling handoff update.
66. Confirmed no queued or in-progress branch-push review workflow could mutate the head.
67. Observed all eleven permanent PR workflows reach `success` on exact head `1f5977e8...`.
68. Fetched PR #11 immediately before merge and confirmed the same exact head.
69. Merged PR #11 with `expected_head_sha=1f5977e8d175c2baa2ae9f657fc5ff47b2f2ffa6`.
70. GitHub created merge commit `8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e` on `main`.
71. Confirmed `main` points to the r5 merge commit before beginning deployment validation.
72. Confirmed GitHub Pages created deployment ID `5850071239` for the exact merge SHA.
73. Confirmed Pages deployment status `success` and environment URL `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`.
74. Confirmed post-merge Licensed Football Visuals run `31489631203` completed `success` on exact merge SHA.
75. Followed post-merge Stability Lane run `31489631204` rather than assuming pre-merge green status was sufficient.
76. Confirmed Stability Lane `storage-release-ci-contracts` job completed `success`.
77. Confirmed Stability Lane `two-consecutive-browser-audits` job completed `success` after two complete browser/provenance/Home/crop-safe visual cycles.
78. Followed `deployed-site-smoke` through exact deployed tree verification.
79. Confirmed deployed runtime error provenance audit passed.
80. Confirmed deployed Home/Marco Reus visual audit passed.
81. Confirmed deployed crop-safe football-photo audit passed for the rebuilt player visual system.
82. Confirmed complete deployed gameplay/navigation journey passed.
83. Confirmed post-merge Stability Lane final conclusion `success`.
84. Queried Actions for failures on exact merge SHA and confirmed failure count `0`.
85. Queried Actions for in-progress runs on exact merge SHA and confirmed in-progress count `0`.
86. Created this post-merge continuation addendum on `main` so the next developer has the actual merged/deployed final state rather than stopping at the pre-merge `Immediate next action` in the original handoff.

## Current state for the next developer

The owner-requested James Rodríguez, Marcus Rashford, and Anthony Martial image rebuild is technically complete, merged, deployed, and verified against the public site.

Implementation release authority:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

Runtime revision:

`1.0.1-r5`

Do not resume this work by rebuilding the same three images again unless the owner supplies new real-device rejection evidence or explicitly requests another art-direction change.

The next normal roadmap work remains downstream of owner visual acceptance/deferral. The prior project roadmap identifies v1.1.0 Data Safety and Recovery as the next substantive milestone after the visual recovery/rebuild work is accepted or explicitly deferred.

Final technical r5 status:

`COMPLETE`

Final owner visual acceptance:

`PENDING REAL-DEVICE REVIEW`
