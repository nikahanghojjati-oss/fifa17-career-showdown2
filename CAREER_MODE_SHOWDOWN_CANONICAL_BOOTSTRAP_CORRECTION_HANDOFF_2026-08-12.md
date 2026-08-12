# Career Mode Showdown — Canonical Bootstrap Correction Handoff

Date: 2026-08-12
Status: ACTIVE — documentation-only correction
Branch: `agent/fix-canonical-bootstrap-handoff`
Base `main`: `97d4a0391987ad765c19e019e544f6f95126dfb3`
Immutable application runtime authority: `29760bbf33c974267bd1ad64d0839f73ad8051fa`
Application: `v1.1.3`
Runtime revision: `1.1.3-r1`
Next substantive roadmap task: Candidate C — Atomic Restore + Recovery UX

## Owner instruction being continued

Continue the interrupted `Project r4 Review Completion` handoff work by deeply studying the relevant development history, current repository authority, roadmap, lessons and external Grok review; preserve the exact current project position and roadmap; record all meaningful actions and findings continuously in the repository; prepare the next developer for Candidate C without restarting planning or reviving superseded work.

This branch does not implement Candidate C and does not change runtime behavior.

## Source review completed before this correction

The existing 2026-08-12 master historical handoff package was audited against:

- current `main` and current repository authority documents;
- the owner-supplied official ChatGPT export created on 2026-08-10;
- `Website Creation and Guide`, conversation `6a6ba895-cb1c-83ea-b13c-d7e3d42afb25`;
- `Career Mode Showdown Dev`, conversation `6a78bb0e-d2ac-83ea-b092-7c9377a6dda1`;
- `Career Mode Showdown — Master Development Continuation`, conversation `6a79ea21-093c-83ea-b00d-055524fb259a`;
- repository-native r3/r4/r5 visual incident, handoff and release evidence because `Project r4 Visual Fixes` post-dates the Aug 10 export and is not present in it;
- v1.1.3 release/post-merge evidence;
- the owner-supplied Grok transcript/review.

The export inventory and relevant-conversation counts in the existing research-completion record were independently rechecked. The counts are consistent when user `multimodal_text` turns are included as text-bearing owner turns:

- `Website Creation and Guide`: 439 active-path text-bearing messages / 176 owner turns;
- `Career Mode Showdown Dev`: 314 active-path text-bearing messages / 19 owner turns;
- `Career Mode Showdown — Master Development Continuation`: 30 active-path text-bearing messages / 11 owner turns.

The existing consolidated master handoff is therefore retained as valid deep historical context.

## Important new audit finding

The canonical fast bootstrap file, `00_DEVELOPER_START_HERE.md`, is internally stale even though its opening section correctly identifies v1.1.3 and Candidate C.

Examples of stale current-facing content found in that canonical file:

1. its section titled `Current football visual authority` still describes the v1.1.1 James Real Madrid asset plus r5 Rashford/Martial assets, while v1.1.3 replaced all three source photographs;
2. it contains an obsolete `Current owner gate` decision tree that routes either to r5 visual rejection or v1.1 Candidate A, even though r5, Candidate A, Candidate B and v1.1.3 are already complete;
3. it says eleven permanent workflow families protect the application, while the v1.1.3/research closure uses thirteen permanent families;
4. its final `Exact continuation sentence` still claims `v1.0.1 / 1.0.1-r5` and says Candidate A is next;
5. it still says the official ChatGPT export may be supplied later, even though the owner supplied it and the master historical package was completed and merged on 2026-08-12.

This is a documentation-coherence defect because `README.md`, `00_HANDOFF_GOLDEN_RULE.md` and the normal session bootstrap all direct a fresh developer to `00_DEVELOPER_START_HERE.md` before deep historical files.

The repository's own authority rule says stale documentation must be corrected rather than used to revert current verified source.

## Current v1.1.3 visual authority used for correction

`CAREER_MODE_SHOWDOWN_V1.1.3_POST_MERGE.md` and `assets/football/asset-manifest.json` establish the active route-scoped visual set:

- Create Showdown — James Rodríguez, 2014 FIFA World Cup source, `assets/football/james-rodriguez-world-cup-2014-v113.webp`;
- Transfer Challenge — Marcus Rashford vs Chelsea 2017, `assets/football/marcus-rashford-chelsea-2017-v113.webp`;
- Transfer Challenge — Anthony Martial / CSKA 2017, `assets/football/anthony-martial-cska-2017-v113.webp`;
- League Wheel — Cristiano Ronaldo, Euro 2016;
- Club Assignment — Paul Pogba, Manchester United 2016;
- Showdown Home — Zlatan Ibrahimović, Manchester United 2016;
- Season Results — Antoine Griezmann, Champions League 2016;
- Season Summary — Neymar, Rio 2016 Olympic final;
- Legacy — Radamel Falcao, Europa League 2012 celebration;
- Rule Book — Mario Balotelli, Euro 2012 semifinal celebration;
- Career Statistics — protected Lionel Messi derivative;
- Trophy Room — protected Philipp Lahm derivative.

The rejected earlier James/Rashford/Martial derivatives are not authority and must not be revived merely because older handoffs mention them.

Marco Reus Home/loading remains separately protected.

## Scope of this correction branch

Allowed:

- rewrite `00_DEVELOPER_START_HERE.md` so every current-facing section reflects v1.1.3 + Candidate C;
- preserve locked product, scoring, routing, persistence, rights, visual, performance and roadmap contracts;
- keep historical release archaeology available through the dedicated chronology/release files rather than embedding stale decision trees into the canonical bootstrap;
- add this rolling handoff and final validation evidence.

Excluded:

- no HTML/CSS/JavaScript changes;
- no image/data/package/test/workflow changes unless a documentation-validation defect proves strictly necessary;
- no Candidate C implementation;
- no version/revision change;
- no performance-budget change;
- no scoring/gameplay/routing/storage change;
- no PWA/profile/cloud/two-device work;
- no framework/TypeScript modernization.

## Target corrected bootstrap

A fresh developer reading only the normal source-first bootstrap must understand, without historical archaeology:

1. `main` is documentation head while application runtime authority remains `29760bbf33c974267bd1ad64d0839f73ad8051fa`;
2. v1.1.3 is complete/protected;
3. Candidate A export is complete/protected;
4. Candidate B analysis is complete/protected and read-only;
5. Candidate C Atomic Restore + Recovery UX is the only legal substantive next build;
6. Candidate C must freshly revalidate, snapshot exact raw bytes, write only through `js/storage.js`, verify complete multi-key commit, rollback every affected key byte-for-byte on any failure and verify rollback;
7. v1.2 remains PWA and later roadmap milestones remain dependency-blocked;
8. the current twelve-image route-scoped visual authority and protected Reus presentation are current, while rejected older sources are not;
9. all thirteen permanent gate families and the v1.1.3 startup budgets remain protected;
10. the official ChatGPT-export deep-dive is already complete and discoverable through `00_MASTER_DEVELOPER_CONTEXT.md`.

## Next actions on this branch

1. replace stale current-facing sections in `00_DEVELOPER_START_HERE.md` with a coherent v1.1.3/Candidate C bootstrap;
2. compare branch scope against base and confirm documentation-only diff;
3. open a documentation-only PR;
4. let the repository's permanent PR gates run without weakening any runtime threshold;
5. correct only genuine documentation/coherence failures;
6. merge only from the exact validated PR head;
7. record merge/gate/deployment state here without creating a recursive CI loop.
