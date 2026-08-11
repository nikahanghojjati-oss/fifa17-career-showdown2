# Career Mode Showdown — Master Development Continuation

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Active branch: `agent/r5-smart-player-photo-rebuild`
Active PR: #11 — `r5: rebuild James, Rashford and Martial photography`
Current implementation head before this handoff update: `91780cb52ee63c32138569ba0f09f0f424517392`

## Purpose

This is the rolling developer handoff explicitly requested by the owner. Keep it updated throughout development so a future developer can continue from the exact implementation state without reconstructing prior chats. Current source code remains the implementation authority. This file records owner directives, visible conversation context, implementation decisions, actions, validation results, blockers, fixes, branch/PR state, and the immediate next action.

Do not treat CI green as owner visual acceptance. Real-device owner review remains the art-direction gate for major photography.

## Authority and continuity rules

1. Current source code is the implementation authority.
2. Later explicit owner directives supersede older planning or documentation.
3. Preserve completed gameplay, scoring, storage, routing, navigation, Reus presentation, Messi presentation, Lahm presentation, and quality gates unless the owner explicitly requests changes.
4. Do not restart planning loops or redesign unrelated systems.
5. The owner expects direct GitHub implementation, not code pasted back into chat as the primary deliverable.
6. When replacing photography, author the crop into a local derivative and show the completed derivative with `object-fit: contain`; do not rely on a second blind responsive `cover` crop.
7. Keep this handoff continuously updated with the substance of the owner/developer conversation and all important implementation actions.
8. When CI, documentation, and current source disagree, inspect actual branch history and runtime source before choosing an authority. Do not satisfy a stale test by reverting a demonstrably better owner-requested implementation.

## Baseline before r5

PR #10, r4 visual recovery, was merged to `main` at:

`45372873569920b8aaeb366926d9047aeb5a3638`

r4 corrected the earlier r3 visual regression and preserved Marco Reus behavior. r4 was technically green, but the owner later explicitly rejected the r4 James Rodríguez, Marcus Rashford, and Anthony Martial pictures and requested new pictures with intelligent crops.

Protected visuals not requested for replacement:

- Marco Reus Home/loading treatment remains unchanged.
- Lionel Messi remains `assets/football/lionel-messi-barcelona-2016-subject-r4.webp`.
- Philipp Lahm remains `assets/football/philipp-lahm-world-cup-2014-focus-r4.webp`.

Protected nonvisual systems include gameplay, scoring, Showdown state, storage, navigation, Transfer Challenge, Season Review, Statistics, Legacy, settings, diagnostics, and performance budgets.

## Current owner directive

The owner wants James Rodríguez, Marcus Rashford, and Anthony Martial replaced with new source pictures and rebuilt with intelligent crops. This is not a CSS-only adjustment to the old photographs.

The owner explicitly corrected the development interaction model: implementation must happen directly in GitHub and the developer should not stop to hand code back to the owner.

The owner additionally requires all development actions and the substance of the chat to be continuously recorded in this handoff for the next developer.

## Final r5 replacement sources and authored derivatives

### James Rodríguez

Runtime asset:

`assets/football/james-rodriguez-real-madrid-2019-smart-r5.webp`

Source file:

`James Rodríguez in 2019.jpg`

Commons source:

`https://commons.wikimedia.org/wiki/File:James_Rodríguez_in_2019.jpg`

License: CC BY 3.0

Author/source account: Real Madrid

Source dimensions: 540 × 720

Authored source-pixel crop:

`[20, 0, 540, 705]`

Output dimensions: 520 × 705

Intent: keep James's complete head, shoulders, shirt and Real Madrid crest. The browser shows the entire authored derivative with `contain` and must not crop it again.

### Marcus Rashford — final authority changed during r5 review

Final runtime asset:

`assets/football/marcus-rashford-man-utd-2017-smart-r5.webp`

Final source file:

`Manchester United v RSC Anderlecht, 20 April 2017 (29).jpg`

Commons source:

`https://commons.wikimedia.org/wiki/File:Manchester_United_v_RSC_Anderlecht,_20_April_2017_(29).jpg`

License: CC BY-SA 4.0

Author: Ardfern

Source dimensions: 3672 × 4896

Source SHA-1 from Commons:

`5fdc90dd24300c7c065eb8a0da070bc4dd83364c`

Source SHA-256:

`b8cd53aa991d817a6f3730e97863ca861eac44cb84f7d97e50d68f8adcd5a9fd`

Authored source-pixel crop:

`[1050, 300, 2350, 2200]`

Maximum derivative size: 800 × 1100

Final output dimensions: 753 × 1100

Final output bytes: 174996

Final output SHA-256:

`0913282f4c0341475d13773217e261534184043fd4da17d4c27d0763ebc20447`

Crop policy:

`hand-reviewed face-and-upper-body source-pixel crop; complete derivative shown at runtime with object-fit: contain`

Intent: make Rashford immediately recognizable at actual Transfer Challenge sizes. The crop prioritizes his face, red Manchester United shirt, club/sponsor area, and upper body while removing unused grass and full-leg area. The browser shows the complete authored derivative and must not crop it again.

#### Rejected intermediate r5 Rashford candidate

An earlier r5 candidate used:

`assets/football/marcus-rashford-man-utd-2016-smart-r5.webp`

Source:

`Man Utd v Everton, August 2016 (08).JPG`

Crop:

`[0, 400, 1800, 2600]`

Output:

900 × 1100

That image was a meaningful improvement over the rejected r4 source, but final target-viewport previews later showed that the 2017 Anderlecht image made Rashford's face and Manchester United identity substantially more dominant. The intermediate 2016 r5 derivative is rejected and the permanent validator forbids it from returning.

### Anthony Martial

Runtime asset:

`assets/football/anthony-martial-man-utd-2016-smart-r5.webp`

Source file:

`Manchester United v Zorya Luhansk, September 2016 (26).JPG`

Commons source:

`https://commons.wikimedia.org/wiki/File:Manchester_United_v_Zorya_Luhansk,_September_2016_(26).JPG`

License: CC BY-SA 4.0

Author: Ardfern

Source dimensions: 4896 × 3672

Authored source-pixel crop:

`[0, 0, 1800, 2400]`

Output dimensions: 825 × 1100

Intent: make Martial the dominant close subject and trim the adjacent player from the presentation edge as far as the source permits without cutting Martial. The browser shows the entire authored derivative with `contain`.

## Source-review decisions

The first review pass was intentionally rejected rather than forced into the UI:

- an early Rashford candidate showed him mostly from the back beside a UEFA official;
- the initial 2019 Martial match set left Martial too small inside crowded team scenes.

A focused source review then generated contact sheets and explicit crop candidate grids before the first r5 derivatives were selected.

James and Martial remained the final choices described above.

Rashford went through one additional final-quality pass. A late branch build deliberately introduced the 2017 Anderlecht crop at commit:

`f6318a4911f592c0ade32b89a8239fa4d32a59e6`

Commit message:

`Replace Rashford with subject-dominant r5 crop`

That commit was initially suspicious because it arrived from an old in-flight review workflow after PR #11 had already opened. It was not accepted merely because it was newer. Branch history, source builder, manifest, runtime data, and successful final preview artifact were inspected.

Successful final player preview workflow:

- workflow: `R5 Final Player Preview`
- run: `31486962618`
- artifact: `9099482582`

Preview evidence covered desktop, windowed and mobile Transfer Challenge and corresponding James target viewports.

The 2017 Rashford crop was visibly stronger than the intermediate 2016 candidate because his face, red Manchester United shirt, and upper body remained clear at target sizes. The 2017 selection was deliberately retained as the final art-direction choice.

## Deterministic asset generation authority

The final repository intentionally retains one deterministic builder:

`tools/build_r5_player_visuals.py`

This builder is the single reproducible authority for all three r5 player derivatives.

It was updated at commit:

`048eafb7ba06edeeb437b9079ba701db4409babf`

The builder now:

- reproduces final James 2019;
- reproduces final Rashford 2017;
- reproduces final Martial 2016;
- accepts r4, intermediate r5, or current final manifest IDs through `replace_ids`;
- does not delete its own active output;
- removes prior derivatives only when they are no longer active;
- records Commons metadata and source fingerprints;
- validates source dimensions and crop bounds;
- prevents upscaling;
- records output dimensions, bytes, and SHA-256 fingerprints;
- uses the same no-secondary-crop policy expected by runtime and CI.

The separate one-off final Rashford builder and workflow were removed after consolidation:

- `.github/workflows/r5-build-final-rashford.yml` removed at `34d7b7e564b6f5f50e868cd6aa8a1df34e767c87`
- `tools/build_r5_rashford_final.py` removed at `9d9446d9472cd2fa0a5bfc3ac98b630fd21632c3`

## Runtime wiring and browser-proven frame geometry

`data/footballVisuals.js` points to the final r5 James/Rashford/Martial assets and metadata.

Final IDs:

- `james-rodriguez-real-madrid-2019-smart-r5`
- `marcus-rashford-man-utd-2017-smart-r5`
- `anthony-martial-man-utd-2016-smart-r5`

All three preserve:

- `mode: "subject-safe"`
- `fit: "contain"`
- `maxCropFraction: 0`
- `rejectPortraitCover: true`

The final Transfer Challenge portrait stages were not guessed. They were adjusted in response to the real browser crop-quality gate and then revalidated.

Final desktop stages:

- Rashford: 43%
- Martial: 48%

Final mobile/small-phone stages:

- Rashford: 52%
- Martial: 56%

Why these are narrower than the earlier generic 61% Transfer stage: both images are tall authored portrait derivatives. Under `object-fit: contain`, their display size is height-bound, so an excessively wide frame creates empty horizontal space and makes the player read like a small inset. Narrowing the frame removes unused side space without enlarging through a crop, without cutting pixels, and without changing the authored derivative.

The balanced Rashford/Martial frame implementation was committed at:

`3d508b4b3759502d8de3d456ae11f8a5165cd0c8`

The permanent static validator was later updated to lock those exact browser-proven frame values at:

`91780cb52ee63c32138569ba0f09f0f424517392`

No required football photo uses `object-fit: cover`.

Runtime/cache identity is:

`1.0.1-r5`

across the shell and relevant lazy/runtime references.

## Provenance and notices

`assets/football/asset-manifest.json` records exact source information, source/output dimensions, authored crop boxes, byte sizes, and SHA-256 fingerprints.

`THIRD_PARTY_NOTICES.md` records source pages, attribution, licenses, authored crop behavior, and the rule that responsive CSS may not crop the finished derivative again.

The notices were updated for final 2017 Rashford at:

`66bf7df81ff07772b5a4638c1d40efd620c9bfa6`

The old r4 James, Rashford and Martial runtime files are removed. The intermediate 2016 r5 Rashford file is also removed. Messi and Lahm remain r4.

## Permanent r5 validation contracts

The normal project validators were advanced to r5 without weakening unrelated contracts:

- `.github/workflows/validate-menu-bootstrap.yml`
- `.github/workflows/validate-v1-visual-immersion.yml`
- `.github/workflows/validate-final-polish.yml`
- `.github/workflows/validate-static-app.yml`
- `.github/workflows/validate-football-visuals.yml`
- `tests/contracts/stability-contracts.cjs`

The permanent licensed-football-visual validator expects the exact final set:

- James 2019 r5
- Rashford 2017 r5
- Martial 2016 r5
- Messi r4
- Lahm r4

It enforces:

- James crop `[20,0,540,705]`
- Rashford crop `[1050,300,2350,2200]`
- Martial crop `[0,0,1800,2400]`
- Rashford output dimensions `[753,1100]`
- exact final source identities and license attribution
- Rashford `face-and-upper-body` crop policy
- source/output fingerprints
- per-image and total staged-image size ceilings
- no source upscaling
- `fit: contain`
- no required `fit: cover`
- no CSS `object-fit: cover`
- portrait-to-wide cover regression rejection
- responsive frame coverage and visible-source checks
- rejected r3 photo set cannot return
- intermediate 2016 r5 Rashford derivative cannot return
- exact browser-proven 43%/48% desktop Transfer portrait stages
- exact 52%/56% mobile Transfer portrait stages
- Messi/Lahm existing r4 protections remain intact
- Home/Reus protections remain in Home/bootstrap/visual-immersion gates.

## Validator integration permission incident

A temporary `R5 Apply Runtime Revision` workflow successfully transformed files locally but failed when it tried to push `.github/workflows/*`. The exact GitHub Actions log showed the Actions token lacked permission to create/update workflow files.

This was a publication-permission failure, not an image, crop, or runtime failure.

The integration helper was made idempotent, then the temporary workflow was converted into a read-only generator that uploaded the exact generated permanent validators as an artifact rather than pushing them.

Successful generator run:

`31485412112`

Generated validator artifact:

`r5-generated-validator-files-569034e20acc3e4b17d803ff63ea055dfee58cea`

The generated permanent workflow files were then applied through the authenticated GitHub connector. Their committed Git blob hashes were checked against the generated artifact before later targeted Rashford/frame-specific validator changes were made.

## PR #11

PR #11 was opened from `agent/r5-smart-player-photo-rebuild` into `main` with title:

`r5: rebuild James, Rashford and Martial photography`

The PR body was subsequently updated through the GitHub connector so it now records final 2017 Rashford rather than the rejected intermediate 2016 candidate.

The PR records the authored-crop/no-secondary-crop policy, r5 cache revision, provenance, preserved systems, deterministic builder, rejected intermediate Rashford asset, and requirement for final owner real-device visual review.

## Late review-workflow race after PR creation

Several old review actions/commits that had been initiated before cleanup arrived after PR #11 opened. They caused concurrency cancellation and repeatedly moved the branch.

Most late additions were review-only residue and were removed rather than silently accepted.

Removed temporary material included:

- `.github/workflows/r5-browser-only.yml`
- `.github/workflows/r5-candidate-visual-qa.yml`
- `.github/workflows/r5-apply-runtime-revision.yml`
- `.github/workflows/r5-build-player-assets.yml`
- `.github/workflows/r5-image-candidate-review.yml`
- `.github/workflows/r5-text-scan.yml`
- `.github/workflows/r5-player-preview.yml`
- `.github/workflows/r5-tune-james.yml`
- `.github/workflows/r5-rashford-source-review.yml`
- `.github/workflows/r5-rashford-crop-grid.yml`
- `.github/workflows/r5-final-player-preview.yml`
- `.github/workflows/r5-build-final-rashford.yml`
- temporary crop/source review scripts
- temporary stale-scan helper
- temporary James tuning helper
- temporary r5 player preview audits
- standalone final Rashford builder

Important correction to earlier handoff wording: not every late workflow was review-only. One late build intentionally changed the production Rashford asset to the 2017 source at commit `f6318a49...`. That mutation was traced and judged on actual preview evidence. The image itself was retained deliberately; the one-off workflow/build machinery around it was removed and its logic consolidated into the normal deterministic builder.

## PR validation incidents and fixes

### First clean r5 validation cycle

On head:

`19001259cc58dcc44be5e601e00c61c33b251cba`

nine of eleven permanent workflows passed immediately.

Two failures were isolated to stale test expectations.

### James Commons URL normalization

The photo validator originally expected the James Commons URL in percent-encoded form while the deterministic Commons metadata builder stores the equivalent canonical Unicode page URL.

The validator was corrected to normalize the URL with `decodeURI()` before asserting the filename. Source identity remains strict.

Relevant fix commit:

`2423359134a59cd7d9f2fcfc58e13aab7e31a7f0`

### Stability Lane r5 identity

`tests/contracts/stability-contracts.cjs` still hardcoded `${appVersion}-r4` even though runtime and current authority documents had coherently advanced to r5.

The contract was updated to require `${appVersion}-r5`. All storage corruption, quota rollback, runtime-provenance, CI ownership, Node-action, and browser requirements remain unchanged.

Fix commit:

`2d0a774cdece2b42dbe16beb1a32dc2fb62db5a9`

### Final Rashford authority exposed by permanent CI

After the stale James assertion was fixed, the permanent photo gate revealed that the active manifest contained `marcus-rashford-man-utd-2017-smart-r5.webp` while the validator and older handoff still expected the intermediate 2016 r5 file.

This was treated as an implementation-authority discrepancy, not as a reason to automatically revert the source. Branch history was traced to `f6318a49...`, preview evidence from run `31486962618` was reviewed, and the 2017 crop was deliberately chosen as the better final visual.

The release authority was consolidated:

- deterministic builder updated → `048eafb7...`
- one-off Rashford workflow removed → `34d7b7e5...`
- standalone Rashford builder removed → `9d9446d9...`
- CSS final selector updated → `a4cfc105...`
- notices/provenance updated → `66bf7df8...`
- permanent validator updated → `7b87b2af...`

### Browser frame-coverage failure and art-direction correction

On the first exact final-2017 Rashford browser run, the source/crop/provenance contract passed, but the Chromium crop-quality audit failed before the Transfer screenshot could be accepted.

Failure:

`Transfer · 1366 × 768 / Marcus Rashford: subject-safe image is a tiny inset inside its media frame (53.2% coverage).`

This was not a crop failure and not a bad image decode. The entire authored Rashford derivative was visible, but the dedicated 50% desktop media frame was too wide for a 753 × 1100 portrait shown with `contain`.

The solution deliberately did not use `cover`, transform scaling, or another crop. The frame itself was narrowed so the already-authored portrait owns more of the presentation area.

Rashford was first tightened to 43% desktop and 52% mobile. Before rerunning, Martial's 825 × 1100 portrait was also analyzed against the generic 61% Transfer frame and identified as vulnerable to the same empty-side-space problem. Martial therefore received a 48% desktop and 56% mobile stage.

Balanced frame commit:

`3d508b4b3759502d8de3d456ae11f8a5165cd0c8`

No image bytes, authored crop box, player source, or runtime `contain` policy changed in this correction.

## Successful browser and stability evidence for balanced frames

Exact head:

`3d508b4b3759502d8de3d456ae11f8a5165cd0c8`

All eleven permanent workflows completed successfully on that head, including:

- Validate Transfer Workstream
- Validate Statistics Workstream
- Validate V1 Visual Immersion
- Validate Final Polish
- Validate League Confirmation
- Validate Home Bootstrap
- Validate Static App
- Validate Season Review
- Validate Settings Workstream
- Validate Licensed Football Visuals
- Validate Stability Lane

Licensed Football Visuals successful run:

`31488682297`

Successful visual artifact:

`licensed-football-visual-r5-4a38bcc546803e36bbf58a4a02a7dadcc63aeffa`

Artifact ID:

`9100154016`

The artifact contains 16 rendered audit screenshots covering:

- Home Chromebook/windowed/mobile references
- Create Showdown James desktop/windowed/mobile
- Transfer Challenge Rashford/Martial desktop/windowed/mobile
- Career Statistics Messi desktop/windowed/mobile
- Trophy Room Lahm desktop/windowed/mobile

The successful screenshots were manually inspected in addition to the numerical gates.

Observed composition from those screenshots:

- James: complete head and face, shoulders, Real Madrid shirt/crest remain safely visible; no top-of-head crop.
- Rashford: complete head and red Manchester United shirt remain readable; narrower frame removes much of the empty inset behavior while retaining the whole authored crop.
- Martial: strong close portrait, face and red Manchester United shirt immediately readable; no destructive crop.
- Mobile Transfer: Rashford and Martial stack vertically with full portrait visibility and clear subject dominance.
- Reus remained protected by the Home visual audit.
- Messi and Lahm remained protected by their existing r4 contracts.

Stability Lane successful run on the same head:

`31488682582`

The Stability Lane passed its storage/release/CI contracts and two consecutive browser/provenance/Home/crop-safe-photo audit cycles.

After that empirical success, the static licensed-photo contract was updated at `91780cb52ee63c32138569ba0f09f0f424517392` so the proven 43%/48% desktop and 52%/56% mobile Transfer stages cannot silently drift.

## Current production tree status

At implementation head `91780cb52ee63c32138569ba0f09f0f424517392` before this handoff update, the repository tree contains only permanent project workflows.

No temporary r5 review/build workflow remains.

The active football asset directory contains:

- `james-rodriguez-real-madrid-2019-smart-r5.webp`
- `marcus-rashford-man-utd-2017-smart-r5.webp`
- `anthony-martial-man-utd-2016-smart-r5.webp`
- Messi r4
- focused Lahm r4

The intermediate 2016 r5 Rashford derivative is absent.

## Conversation log

The following visible owner messages and developer responses are preserved because they materially define the continuation.

### Owner

> Continue where you cut off at Career Mode Showdown — Master Development Continuation. Review the hand of documents, all relevant history and information spend time to learn the project deeply and then fix the issue the past chat was working on

### Developer response summary

The developer reconstructed the project state, identified PR #10/r4 as the true continuation point rather than an older handoff checkpoint, verified r4, merged PR #10, verified Pages/Stability Lane, and kept final visual acceptance open for real-device review.

### Owner

> I want you to change the pictures of James rodriguez , rashford and martial
> I want you to crop new pictures smartly. Rebuild those pictures

### Developer response/action

The developer committed to replacing only James/Rashford/Martial with new source photographs, authoring new derivatives around the players, preserving accepted architecture and protected systems, and rerunning visual/stability gates.

The developer searched/reviewed licensed sources, rejected poor candidates, generated contact sheets/crop candidates, built deterministic WebP derivatives, and wrote exact provenance.

### Developer crop decision update

> The crop review is now giving a clear answer rather than just “technically valid” images. James’s balanced crop keeps his full head, shoulders, shirt and Real Madrid crest. Rashford needs a tighter source-pixel crop than my first three candidates because too much dead stadium background remains above him. Martial’s Zorya touchline photo is the strongest of his candidates: he is large, sharp and immediately recognizable, so I’m using a tighter derivative of that photo and trimming the second player at the right edge as far as possible.
>
> This is the exact failure mode I wanted to avoid repeating: the crop itself is becoming the authored asset, and the website will then show 100% of that finished crop with `contain` rather than cropping again responsively.

### Owner

> Continue where you stopped

### Developer response issue

The developer described filenames and remaining work, but incorrectly shifted toward offering updated code to the owner instead of simply continuing direct GitHub implementation.

### Owner correction

> You dont give anything to me you build in GitHub
>
> I want you to continue building you worjk on change the pictures of James rodriguez , rashford and martial
> I want you to crop new pictures smartly. Rebuild those pictures
>
> Record all your actions and all of our chat continuously in handoff file for next developer

### Developer response/action after correction

The developer acknowledged the correction and resumed direct GitHub work. The developer finished runtime wiring, permanent validator integration, temporary-workflow cleanup, PR creation, failure diagnosis, final Rashford source consolidation, browser frame tuning, artifact inspection, and validation directly in GitHub while maintaining this handoff.

### Developer progress updates after the owner correction

The developer explicitly informed the owner when:

- the integration action failure was proven to be a workflow-file permission problem rather than an image-build failure;
- permanent validators were applied through the GitHub connector;
- temporary review machinery was removed;
- PR #11 was opened;
- late review jobs unexpectedly moved the branch and were investigated instead of silently accepted;
- nine of eleven permanent gates passed and the initial failures were isolated;
- the James failure was URL-encoding authority drift;
- Stability Lane still contained a stale r4 revision assertion;
- permanent photo CI uncovered a real 2017 Rashford production asset rather than the intermediate 2016 r5 candidate;
- branch history and final preview evidence were used to decide the true Rashford authority;
- the 2017 Rashford preview was judged stronger and deliberately retained;
- the 2017 Rashford build was consolidated into the single deterministic r5 builder;
- the first real browser audit found a 53.2% Rashford frame-coverage issue even though the crop itself was safe;
- the correction narrowed the media stage instead of recropping or zooming the player;
- Martial received the same proactive geometry review;
- the final browser audit and Stability Lane both passed with the balanced portrait stages;
- successful screenshots were manually inspected rather than accepting the green metric alone.

## Detailed action log — 2026-08-11 r5 continuation

1. Reopened `agent/r5-smart-player-photo-rebuild` instead of restarting from `main`.
2. Confirmed the r5 authored derivatives already existed.
3. Confirmed runtime visual data used subject-safe `contain` framing.
4. Confirmed r5 cache/runtime identity.
5. Inspected the failed temporary integration workflow.
6. Proved its transformation succeeded and only workflow-file publication failed.
7. Created this rolling handoff at the owner's request.
8. Read the exact Actions log and identified workflow-write permission as the blocker.
9. Made the integration helper idempotent.
10. Extended the generated permanent photo validator for new source/crop contracts.
11. Converted temporary integration into a read-only generated-validator artifact job.
12. Generated permanent validators in run `31485412112`.
13. Applied Home bootstrap validator through the GitHub connector.
14. Applied V1 visual immersion validator through the GitHub connector.
15. Applied Final Polish validator through the GitHub connector.
16. Applied Licensed Football Visual validator through the GitHub connector.
17. Applied Static App validator through the GitHub connector.
18. Verified generated and committed workflow blob identity before later targeted changes.
19. Removed obsolete one-off integration/review/tuning/text-scan scripts.
20. Removed branch-only temporary r5 workflows.
21. Compared full branch to `main` and focused the production diff.
22. Opened PR #11.
23. Detected a late Rashford crop-grid workflow/helper pair, proved it review-only, removed both.
24. Recompared branch and confirmed no runtime change from that residue.
25. Ran permanent PR matrix on clean head `19001259...`.
26. Observed nine successful permanent workflows and two isolated failures.
27. Read Licensed Football Visual failure log and found James URL-encoding assertion mismatch.
28. Read Stability Lane failure log and found stale hardcoded r4 revision.
29. Updated Stability Lane to r5 while preserving all other contracts.
30. Updated James source validation to normalize canonical Commons URL encoding.
31. A late final-player-preview pair arrived and cancelled long browser runs; removed its workflow/test after preserving successful artifact evidence.
32. Queried branch push workflows and reached zero queued/in-progress old review runs at that checkpoint.
33. Updated the handoff with the frozen-state history.
34. Permanent visual CI revealed the active 2017 Rashford asset differed from the intermediate 2016 handoff expectation.
35. Traced manifest history to github-actions commit `f6318a4911f592c0ade32b89a8239fa4d32a59e6` (`Replace Rashford with subject-dominant r5 crop`).
36. Traced standalone final Rashford builder/workflow introduction in branch history.
37. Located successful `R5 Final Player Preview` run `31486962618` and artifact `9099482582`.
38. Downloaded and inspected desktop, windowed, and mobile Transfer Challenge preview evidence.
39. Compared that evidence with earlier 2016 Rashford candidate material.
40. Deliberately chose the 2017 Anderlecht crop as final because Rashford's face, red shirt, and upper body were more readable.
41. Consolidated final 2017 Rashford into `tools/build_r5_player_visuals.py` at `048eafb7...`.
42. Removed one-off final Rashford build workflow at `34d7b7e5...`.
43. Removed standalone Rashford builder at `9d9446d9...`.
44. Aligned CSS selectors to final 2017 asset at `a4cfc105...`.
45. Updated third-party notices/provenance at `66bf7df8...`.
46. Updated permanent licensed-photo validator to exact 2017 source/dimensions/crop/policy and rejected-intermediate guard at `7b87b2af...`.
47. Recursively inspected branch tree and confirmed only permanent workflows remain and only final 2017 Rashford derivative is active.
48. Updated handoff so the next developer no longer sees intermediate 2016 Rashford incorrectly labeled final.
49. Updated PR #11 body to final 2017 Rashford authority through GitHub.
50. Confirmed zero queued/in-progress branch-push review workflows before the next exact-SHA cycle.
51. Ran permanent source/crop contract successfully, then reached real Chromium crop-quality audit.
52. Read the Chromium failure: Rashford desktop frame coverage was 53.2%, below the 60% subject-safe floor.
53. Determined the problem was empty frame width around a contained portrait, not bad crop bytes or lost source pixels.
54. Tightened Rashford's subject stage instead of using `cover` or transform scaling.
55. Proactively analyzed Martial's portrait against the same generic 61% frame and identified equivalent desktop underfill risk.
56. Balanced final stages to 43% Rashford / 48% Martial desktop and 52% Rashford / 56% Martial mobile at `3d508b4b...`.
57. Ran all eleven permanent workflows on `3d508b4b...`; all eleven passed.
58. Downloaded Licensed Football Visual artifact `9100154016` from successful run `31488682297`.
59. Inspected Create Showdown James desktop screenshot and confirmed complete clean head/face/upper-body composition.
60. Inspected Transfer Challenge desktop screenshot and confirmed both final players remain visible without secondary crop.
61. Inspected Transfer Challenge mobile screenshot and confirmed stacked Rashford/Martial portraits are large and readable.
62. Confirmed Stability Lane run `31488682582` passed the same balanced-frame head, including two consecutive browser/provenance/Home/crop-safe photo audit cycles.
63. Locked the proven Transfer stage geometry into the permanent static licensed-photo contract at `91780cb52ee63c32138569ba0f09f0f424517392`.
64. Updated this rolling handoff with the browser failure, frame correction, successful artifact evidence, and Stability Lane result.

## Immediate next action

Treat the branch head created by this handoff update as the final pre-merge PR authority unless a permanent gate proves otherwise.

1. Confirm no queued/in-progress branch-push workflow can mutate the head.
2. Run/observe all eleven permanent PR workflows on this one exact SHA. The geometry itself has already passed browser and Stability Lane on its parent implementation head; this final cycle additionally validates the strengthened static contract and current handoff state.
3. If every applicable workflow is green, merge PR #11 with `expected_head_sha` protection.
4. Verify the exact merged GitHub Pages deployment and all post-merge validators, especially Licensed Football Visuals and Stability Lane.
5. Preserve final aesthetic acceptance as open until the owner inspects James on Create Showdown and Rashford/Martial on Transfer Challenge on real devices.
