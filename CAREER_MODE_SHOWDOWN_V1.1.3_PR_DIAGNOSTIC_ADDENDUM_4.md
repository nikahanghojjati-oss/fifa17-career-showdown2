# Career Mode Showdown v1.1.3 — PR Diagnostic Addendum 4

This file continues the public v1.1.3 handoff trail and closes the diagnostic root-correction cycle that followed `CAREER_MODE_SHOWDOWN_V1.1.3_PR_DIAGNOSTIC_ADDENDUM_3.md`.

## Clean diagnostic head `ffa780793e07ba9fa42977ac5a7e05e48b629c6b`

The 13 permanent PR families ran on this clean user-authored head.

Green families included Static App, Home Bootstrap, League Confirmation, Settings, V1 Visual Immersion, Transfer Workstream, Final Polish, Season Review, Statistics Workstream, and Candidate B Import Analysis.

The three failing families were:

1. `Validate v1.1.3 Release Burn-In` — run `31557855457`.
2. `Validate Stability Lane` — run `31557855436`.
3. `Validate Licensed Football Visuals` — run `31557855367`.

These failures were diagnostic only and are not counted toward official release proof.

## Stability / Burn-In root: stale current-release authority text

`tests/contracts/stability-contracts.cjs` correctly requires the current release authority string:

`**Application version:** v1.1.3 — Maintenance Candidate`

`PROJECT_STATE.md` and `README.md` still used the older wording `v1.1.3 — Owner-Priority Maintenance Candidate`. Burn-In inherited the same contract failure.

Correction: align the two current authority documents to the exact `v1.1.3 — Maintenance Candidate` release label. No runtime or threshold behavior is changed by this correction.

## Candidate A provenance root disclosed during correction

Guarded root-correction run `31558138282` reached the deterministic suite after the documentation fix and exposed a second stale release identity: `js/backup.js` still used `1.1.2` as its fallback application version.

This is not a backup-format migration. Candidate A remains backup format/version 1 with the same checksum and non-mutating export semantics. Only the application provenance fallback is aligned to `1.1.3`.

The next guarded run confirmed Candidate A backup/storage contracts green after the provenance alignment.

## Licensed visual archive root: rejected binaries still tracked

The permanent visual validator correctly rejects superseded source derivatives from the active repository archive. Three obsolete binaries were still physically tracked even though none was part of the active v1.1.3 manifest:

- `assets/football/james-rodriguez-real-madrid-2016-smart-v111.webp`
- `assets/football/marcus-rashford-man-utd-2017-smart-r5.webp`
- `assets/football/anthony-martial-man-utd-2016-smart-r5.webp`

The remaining four names in the permanent forbidden list were already absent.

Correction: remove the three tracked rejected derivatives. The new James/Rashford/Martial v1.1.3 derivatives remain the only active versions for those roles. The previously rejected James image is not reused.

## Visual evidence settlement root disclosed during correction

Guarded run `31558204473`, job `93994835012`, passed Stability, Candidate A and Candidate B contracts, then the final hardening contract correctly rejected the newer visual audit because screenshot evidence no longer explicitly waited across two paint frames.

Correction: `tests/browser/football-visual-audit.cjs` now waits through two `requestAnimationFrame` callbacks after decoded/settled visual state before inspecting/capturing evidence. This strengthens evidence stability and changes no runtime UI behavior.

## Reduced-motion failure — diagnosis corrected

Guarded run `31558277542`, job `93995052525`, passed the complete deterministic contract suite and passed the permanent visual audit at desktop and compact desktop. It then failed the reduced-motion windowed case on James because the audit expected the computed `transitionDuration` string to equal exactly `0s` or `0ms`.

At first this was classified as a possible CSS transition leak. That classification was not accepted without browser-level evidence.

A separate read-only diagnostic workflow was therefore created and run:

- workflow run `31558480965`
- job `93995672628`
- conclusion SUCCESS

The diagnostic loaded James under Playwright Chromium reduced-motion emulation and measured the actual cascade. It proved:

- `matchMedia('(prefers-reduced-motion: reduce)').matches === true`
- root application reduced-motion state was `true`
- both `css/footballVisuals.css?v=1.1.3-r1` and `css/footballVisuals-v113.css?v=1.1.3-r1` were loaded
- computed `transitionProperty` was exactly `none`
- Chromium serialized the computed transition as `none 1e-06s`
- computed `transitionDuration` was `1e-06s`

The base football visual stylesheet already globally suppresses `.footballVisualMedia` transitions under both application and device reduced-motion conditions. Therefore the product was not actively animating the image; Chromium was serializing a transition with property `none` using a one-microsecond normalized duration.

**Corrected classification:** the reduced-motion failure was a browser-test serialization/interpretation defect, not an active runtime animation leak.

## Reduced-motion test correction without weakening protection

The permanent browser audit was changed to inspect both transition property and duration. In reduced-motion mode it now requires:

1. computed `transitionProperty === "none"`; and
2. every computed transition duration is finite and no greater than one microsecond.

This is stricter semantically than accepting duration text alone: a real image fade such as `opacity 180ms` still fails immediately, while Chromium's normalized `none 1e-06s` is correctly recognized as no active transition.

The v1.1.3 visual stylesheet also retains an explicit all-licensed-visual reduced-motion `transition:none` guard as defense in depth.

## Guarded root-correction history

The fail-closed temporary root-correction workflow intentionally published nothing until all local correction checks passed.

1. Run `31558079716` failed safely because the first helper version assumed all seven historical forbidden binaries still existed. No product changes were pushed.
2. Run `31558138282` corrected that assumption and exposed the stale Candidate A `1.1.2` provenance fallback. No product changes were pushed.
3. Run `31558204473` aligned Candidate A provenance and exposed the missing two-frame visual evidence settlement. No product changes were pushed.
4. Run `31558277542` passed the complete deterministic suite but exposed the false-positive reduced-motion duration interpretation. No product changes were pushed.
5. Read-only diagnostic `31558480965` / `93995672628` proved transition property `none` with Chromium's `1e-06s` duration serialization.
6. Final guarded correction run `31558618344`, job `93996101293`, completed SUCCESS end to end.

The final successful guarded run proved:

- exact expected changed-file envelope only;
- all forbidden replaced derivatives absent;
- current release docs coherent;
- Candidate A provenance coherent with v1.1.3 while backup format semantics remain unchanged;
- explicit two-paint-frame visual evidence settlement retained;
- semantic reduced-motion assertion retained;
- Stability contracts GREEN;
- Candidate A backup contracts GREEN;
- Candidate B import-analysis contracts GREEN;
- final hardening contracts GREEN;
- permanent licensed visual browser audit GREEN at desktop, compact desktop, reduced-motion windowed, and mobile DPR2;
- eager startup payload remains **164,965 raw / 37,006 gzip** under the unchanged **165,000 / 37,500** ceilings.

After all checks passed, the guarded workflow published runtime/test/doc cleanup commit:

`83d0b2341712f7ecfce9b7fec677364b5c29ac51` — `Fix v1.1.3 diagnostic release roots`

The commit changed eight files, including deletion of the three stale rejected image binaries.

## Temporary workflow cleanup

Temporary diagnostic machinery has been removed from the candidate:

- root-correction workflow removed by `97a45c7ecc1a2f56f1ce56aef3dce72e0d368998`;
- reduced-motion diagnostic workflow removed by `720bd5483f96c3a8859e1044bd84ddc05dee1b25`.

No temporary build/audit workflow is part of the release candidate.

## Protected release state after diagnostic closure

The v1.1.3 owner-requested product behavior remains intact:

- League Wheel transition is armed only for a real spin and disarmed before settled normalization, preventing the post-selection same-league visual reroll;
- James uses the new 2014 World Cup source and neither prior rejected James source is active;
- Rashford and Martial use the new stronger licensed sources;
- seven additional licensed screen-purpose football visuals remain integrated;
- Messi/Statistics and Lahm/Trophy Room protected derivatives remain unchanged;
- Marco Reus loading/Home image binary and loading composition remain protected;
- football archive does not preload at Home;
- scoring, tiebreak, exactly-two-manager rules, club/league semantics, storage ownership and canonical keys, Candidate A export semantics, Candidate B read-only analysis, Transfer state machine and Season Review state machine are unchanged.

## Next gate

This normal user-authorized handoff commit is intended to trigger a new clean 13-family diagnostic PR matrix. Require **13/13 green on one clean head**. Only after that may an exact handoff-inclusive candidate SHA be frozen and used for the two independent official pre-merge proof passes. Diagnostic runs above are never counted as official proof.