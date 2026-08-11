# Career Mode Showdown — v1.1.1 James Real Madrid Source Refresh Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/v1.1.1-james-real-madrid-source-refresh`
Base `main`: `a4045e891989dc5649cd65c78dace9e4ac192434`

## Owner instruction

The owner instructed this session to start from the latest build and deliver a new build that changes the James Rodríguez picture source. The replacement must still depict James Rodríguez during his Real Madrid period. The owner also instructed the developer to fully respect the roadmap, increase the depth and analytical quality of every release gate, and run the build through each gate twice.

Standing project rules remain active:

- work directly in GitHub;
- preserve current architecture/gameplay decisions;
- do not restart completed work;
- protect the owner-liked Marco Reus loading screen;
- preserve the clean-anchor visual system and face-safe diagonal language;
- record meaningful actions and decisions continuously for the next developer.

## Starting authority

Current application baseline before this build:

- application: `v1.1.0`;
- runtime revision: `1.1.0-r1`;
- latest `main`: `a4045e891989dc5649cd65c78dace9e4ac192434`;
- Candidate A backup/export: complete and deployed;
- Candidate B import analysis: not started;
- Candidate C restore: not started.

This owner-requested visual source replacement takes precedence as a finite maintenance build before Candidate B. Candidate B remains the next substantive roadmap feature after this maintenance build is accepted/closed.

## Selected source authority

The first source review rejected non-licensed editorial/Getty material even when visually attractive. The build uses a Wikimedia Commons source with explicit reuse rights and Real Madrid provenance:

`James Rodríguez in September 2016 - 02.jpg`

Wikimedia Commons page:

`https://commons.wikimedia.org/wiki/File:James_Rodríguez_in_September_2016_-_02.jpg`

Verified source facts:

- subject: James Rodríguez;
- date: 28 September 2016;
- context: Real Madrid post-match interview after Borussia Dortmund vs Real Madrid;
- author/source account: Real Madrid;
- source dimensions: 863 × 1080;
- license: Creative Commons Attribution 3.0 Unported;
- Commons license review records the Real Madrid YouTube source as valid for reuse.

Reason for selection:

- genuinely different source from the replaced 2019 image;
- materially stronger native resolution than the January 2017 384 × 480 alternative reviewed during this pass;
- direct Real Madrid provenance;
- portrait geometry compatible with the existing clean-anchor/contain architecture;
- no need to reintroduce destructive responsive cover cropping.

## Built James derivative

Runtime asset:

`assets/football/james-rodriguez-real-madrid-2016-smart-v111.webp`

Manifest ID:

`james-rodriguez-real-madrid-2016-smart-v111`

Authored transformation:

- source-pixel frame: `[0, 0, 863, 1080]`;
- no semantic source crop;
- output: 863 × 1080;
- quality: WebP 92;
- output bytes: 85,228;
- no upscaling;
- complete derivative shown at runtime with `object-fit: contain`.

Fingerprints:

- Commons SHA-1: `8f1b085518ab1b36e25cda150afb3ae6900622d7`;
- downloaded source SHA-256: `bd29eb5b69468bf7a542f10f3a5c3aebc5d7b5d66beaacc2980c3b987c0b659c`;
- output SHA-256: `0ed0f578a12f42b19b071488a51fde6b6faac1554ff81b4ffa7a5d810ce73be8`.

The replaced `assets/football/james-rodriguez-real-madrid-2019-smart-r5.webp` has been removed from the active asset directory and is explicitly rejected by the new release contracts/browser warmup checks.

## Deterministic build authority

`tools/build_r5_player_visuals.py` remains the permanent reproducible player-photo builder rather than introducing another lasting builder.

For v1.1.1 it now:

- reproduces the new James 2016 source derivative;
- retains final Rashford 2017 and Martial 2016 definitions unchanged;
- accepts old James IDs only as replacement-history inputs;
- supports `--only james` so future source verification can rebuild James without unnecessarily re-encoding protected Rashford/Martial binaries;
- validates source bounds/license/dimensions;
- prevents upscaling;
- records source/output fingerprints and bytes;
- removes replaced derivatives only when they are no longer active.

The one-shot build workflow used the permanent builder with `--only james`, then was scheduled for removal before final candidate freeze.

## Runtime/release identity

Because this build changes a runtime football asset and associated runtime/provenance data, it is a real maintenance patch rather than a documentation-only seal.

Current candidate identity:

- application: `v1.1.1`;
- runtime revision: `1.1.1-r1`.

The following current runtime authorities were promoted coherently:

- shell meta/footer and every eager cache reference;
- `APP_VERSION`;
- Reus thumbnail cache identity;
- football visual/lazy-module revision fallbacks;
- Candidate A backup fallback/version assertions;
- Settings fallback/version display;
- package and package-lock root identity only;
- release burn-in naming.

Dependency package versions and historical release records were deliberately not rewritten.

Candidate B is not bundled into this patch.

## Gate-deepening contract implemented

The existing permanent gate families remain authoritative and no existing quality/performance threshold was lowered.

Changed-surface depth now includes:

1. exact source filename/page/author/license for James;
2. exact Commons/source/output fingerprints;
3. exact source/output dimensions and full-frame source policy;
4. explicit absence of the replaced 2019 James runtime file/ID;
5. manifest/runtime-data/notices/builder cross-authority consistency;
6. complete derivative visibility under `contain` with zero secondary crop;
7. physical-pixel scale analysis to reject material upscaling;
8. minimum subject-safe frame occupancy so a valid image cannot pass as a tiny inset;
9. face-safe accent rail placement and copy/photo separation;
10. image decode plus paint-settlement evidence before screenshots;
11. startup/runtime byte budgets unchanged rather than raised;
12. protected Reus/Rashford/Martial/Messi/Lahm regression coverage;
13. an additional 1100 × 720 compact-desktop James/football-photo viewport, alongside 1366 × 768, 940 × 700 and 390 × 844 DPR2 mobile;
14. a runtime-request assertion that fails if the replaced 2019 James file is requested even accidentally.

The owner requested every permanent gate twice. Final proof therefore requires two independent successful executions of every permanent gate family on the same frozen SHA. Any source/runtime change resets the two-pass count.

## Workflow integration permission incident

A one-shot integration workflow successfully generated the v1.1.1 current-authority documents, browser audit and permanent workflow changes locally. Its first publication attempt failed only when pushing `.github/workflows/*` because the GitHub Actions token is not permitted to create/update permanent workflow files.

Failure classification:

`PUBLICATION PERMISSION FAILURE — GENERATED OUTPUTS/SYNTAX CHECKS PASSED`

This repeats the known GitHub workflow-file permission boundary encountered during r5. The gate changes were not abandoned or weakened.

Recovery used the established repository-safe pattern:

1. rerun the guarded integration locally in Actions;
2. commit ordinary docs/browser outputs normally;
3. copy generated permanent workflow files into a non-workflow staging directory;
4. verify syntax/source exclusion;
5. apply the exact generated workflow blob identities through the authenticated GitHub connector using a Git tree/commit update.

Generated permanent workflow blobs applied through the connector include:

- Final Polish;
- Licensed Football Visuals;
- Home Bootstrap;
- Season Review;
- Static App;
- Statistics Workstream;
- V1 Visual Immersion;
- v1.1.1 Release Burn-In.

No manually reconstructed workflow body was substituted for the generated validator output.

## Protected systems

This build must not intentionally change:

- scoring/tiebreak rules;
- exactly-two-manager model;
- League/Club assignment semantics;
- Transfer Challenge state machine;
- Season Review transaction boundary;
- Statistics/Legacy/Trophy calculations;
- Candidate A backup/export semantics;
- storage keys or schemas;
- `js/screens.js` route authority;
- `js/storage.js` persistence authority;
- Rashford/Martial source derivatives;
- Messi/Lahm source derivatives;
- Home/loading Reus composition except coherent cache identity propagation;
- Candidate B/C roadmap boundaries.

## Action log

1. Fetched current `main` and confirmed latest head `a4045e891989dc5649cd65c78dace9e4ac192434`.
2. Read the exact current-stop handoff and confirmed Candidate B is next substantive work unless new owner visual evidence takes priority.
3. Created branch `agent/v1.1.1-james-real-madrid-source-refresh` directly from current main.
4. Searched licensed source options and rejected attractive Getty/editorial results because they do not satisfy repository reuse requirements.
5. Compared Real Madrid-sourced Commons alternatives and selected `James Rodríguez in September 2016 - 02.jpg` because it has direct Real Madrid provenance, CC BY 3.0 licensing and 863 × 1080 native resolution.
6. Created this rolling handoff before runtime mutation.
7. Updated the permanent player builder to the new James source and added targeted `--only` rebuild support.
8. Built only James in GitHub Actions; run `31536571639` succeeded.
9. Generated exact new manifest/output fingerprints and removed the old 2019 runtime derivative.
10. Activated the new James ID/source in `data/footballVisuals.js` while leaving all other player sources unchanged.
11. Ran a release-authority scan to separate active v1.1.0 references from immutable historical records.
12. Promoted shell/runtime/package/current Candidate A assertions to `v1.1.1 / 1.1.1-r1` without changing dependency package versions.
13. Rewrote `NEXT_TASK.md` to make v1.1.1 the finite maintenance candidate and preserve Candidate B as the next substantive milestone.
14. Added `RELEASE_V1.1.1.md` with exact source/crop/fingerprint/double-gate authority.
15. Updated third-party notices with the new James source, transformation and fingerprints.
16. Generated current README/Project State/Start Here/Post-v1 roadmap/Changelog alignment and deeper permanent gate changes through a guarded integration helper.
17. The first integration push failed only at workflow-file publication because Actions lacks workflow-edit permission; ordinary generated output and syntax checks had passed.
18. Converted integration publication to the proven staged-blob pattern.
19. Successfully committed current documentation/browser-audit outputs and generated validator copies.
20. Applied the exact generated permanent validator blobs through the GitHub connector in commit `5c9757e5489ea8231e33fd35f884e93a4420fcf6`.
21. Next: remove every temporary workflow/helper/staging file, open a focused PR, run the complete permanent matrix, inspect new James screenshots, fix only real failures, then freeze the exact final SHA and execute every gate family twice.

## Current status

`SOURCE BUILT + RUNTIME/PROVENANCE/DEEPER GATES INTEGRATED — TEMPORARY TOOL CLEANUP AND PR VALIDATION NEXT`

No claim of release merge/deployment or owner visual acceptance has been made yet.
