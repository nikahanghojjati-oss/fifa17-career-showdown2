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

## Selected source direction

The first source review rejected non-licensed editorial/Getty material even when visually attractive. The build will use a Wikimedia Commons source with explicit reuse rights and Real Madrid provenance.

Current selected source candidate:

`James Rodríguez in September 2016 - 02.jpg`

Wikimedia Commons page:

`https://commons.wikimedia.org/wiki/File:James_Rodríguez_in_September_2016_-_02.jpg`

Source facts verified before implementation:

- depicts James Rodríguez;
- date: 28 September 2016;
- context: interview after Borussia Dortmund vs Real Madrid;
- author/source account: Real Madrid;
- source dimensions: 863 × 1080;
- license: Creative Commons Attribution 3.0 Unported;
- Commons license review records the Real Madrid YouTube source as valid for reuse.

Reason for selection:

- different source from the current 2019 image;
- materially stronger native resolution than the January 2017 384 × 480 alternative;
- direct Real Madrid provenance;
- portrait geometry compatible with the existing clean-anchor/contain architecture;
- no need to reintroduce destructive responsive cover cropping.

## Planned release identity

Because this build changes a runtime football asset and associated runtime/provenance data, it is a real maintenance patch rather than another documentation-only clean seal.

Target identity:

- application: `v1.1.1`;
- runtime revision: `1.1.1-r1`.

Candidate B is not bundled into this patch.

## Gate-deepening contract for this build

The existing twelve permanent gate families remain authoritative. This build must not weaken any existing threshold.

Additional analytical depth will be added around the changed failure surface:

1. exact source identity and license assertion for the new James source;
2. exact source dimensions and fingerprint evidence;
3. explicit proof that the old 2019 James source/runtime asset cannot silently remain active;
4. full-source visibility/crop-budget analysis for James at desktop, 940px windowed and DPR2 mobile;
5. physical-pixel scale analysis so the new source is not materially upscaled;
6. photo occupancy analysis so a technically complete image cannot become a tiny inset;
7. face-safe accent geometry separation from the image/head protection zone;
8. decode plus paint-settlement evidence before screenshots are accepted;
9. startup/runtime byte-budget comparison before/after the asset change;
10. source/provenance/runtime manifest consistency cross-check;
11. public Pages byte-parity verification after merge;
12. exact changed-surface regression check for Reus loading/Home, Rashford, Martial, Messi and Lahm.

The owner requested every gate twice. The final frozen candidate therefore must produce two independent successful executions of every permanent gate family on the same exact SHA. A dedicated double-gate release harness may be added if necessary to make the two-pass evidence explicit and auditable; it may not replace or weaken the normal permanent workflows.

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
- Home/loading Reus composition except cache identity propagation;
- Candidate B/C roadmap boundaries.

## Action log

1. Fetched current `main` and confirmed latest head `a4045e891989dc5649cd65c78dace9e4ac192434`.
2. Read the exact current-stop handoff and confirmed Candidate B is next substantive work unless new owner defect/visual evidence takes priority.
3. Created branch `agent/v1.1.1-james-real-madrid-source-refresh` directly from current main.
4. Searched licensed source options and rejected attractive Getty/editorial results because they do not satisfy repository reuse requirements.
5. Compared Real Madrid-sourced Commons alternatives and selected `James Rodríguez in September 2016 - 02.jpg` because it has direct Real Madrid provenance, CC BY 3.0 licensing and 863 × 1080 native resolution.
6. Created this rolling handoff before runtime mutation so the next developer can recover the exact intent and starting state.

## Immediate next action

Inspect current r5 asset builder, manifest, visual data, notices, release/version authority and permanent visual/static/stability workflows. Then implement the new James derivative and v1.1.1 release/gate changes without touching unrelated gameplay or Candidate B.
