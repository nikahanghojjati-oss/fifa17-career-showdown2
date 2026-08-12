# Career Mode Showdown — Consolidated Master Developer Handoff

Date: 2026-08-12
Purpose: highest-detail historical + current-state handoff for the next ChatGPT/developer session
Research branch: `handoff/master-developer-deep-dive-2026-08-12`
Starting `main` evidence seal: `5f21bdeb5122839e4a9a1e1a1c24936d856b3da6`
Validated documentation head beneath the seal: `e25f3a326fbe2eeef9196ac8e6140bd17f217a2d`
Immutable v1.1.3 application runtime authority: `29760bbf33c974267bd1ad64d0839f73ad8051fa`
Application: `v1.1.3`
Runtime revision: `1.1.3-r1`

This document is the final synthesis produced after the owner supplied the official ChatGPT account export and requested a targeted historical reconstruction. It does not replace live source. It exists to give the next developer the causal history and owner intent that current source cannot fully express.

Read current source and current task authority first. Use this document to understand why the system is shaped the way it is, which historical ideas are superseded, what the owner actually values, and how to avoid repeating previously solved failure classes.

---

# 1. Read this first: exact current project position

## 1.1 Release state

v1.1.3 is complete, merged, deployed, twice-proven in production and protected.

Current `main` at the start of this research pass is the evidence-only seal:

`5f21bdeb5122839e4a9a1e1a1c24936d856b3da6`

Do not confuse that documentation/evidence seal with runtime authority.

The v1.1.3 application runtime is:

`29760bbf33c974267bd1ad64d0839f73ad8051fa`

Current release identity:

- app version: `v1.1.3`;
- runtime/cache revision: `1.1.3-r1`.

The current release:

- fixes the owner-reported League Wheel post-selection apparent reroll;
- keeps the selected league stable and changes no gameplay randomness semantics;
- replaces James Rodríguez, Marcus Rashford and Anthony Martial source imagery with stronger licensed/cinematic sources;
- adds seven further licensed route-scoped football visuals;
- preserves Marco Reus Home/loading authority;
- preserves Candidate A export and Candidate B import-analysis semantics;
- preserves the singleton localStorage model;
- preserves startup ceilings at 165,000 raw / 37,500 gzip;
- measures 164,965 raw / 37,006 gzip in the protected v1.1.3 release;
- passed all 13 permanent gate families twice pre-merge on a frozen candidate;
- passed all 13 permanent gate families twice again on the immutable production runtime;
- passed exact Pages byte parity, runtime provenance, Home/Reus, licensed-photo, Candidate A, Candidate B and complete public journey checks.

## 1.2 Current data-safety milestone

v1.1 Data Safety and Recovery is not finished yet.

Completed/protected:

### Candidate A — Versioned Backup Envelope + Non-Mutating Export

- versioned human-readable JSON envelope;
- SHA-256 corruption check;
- app/runtime provenance metadata;
- active Showdown + Legacy + preferences;
- warnings/recovery representation;
- malformed raw-byte preservation;
- no canonical storage mutation during export.

### Candidate B — Import Analysis + Migration Preview

- file-size ceiling;
- strict JSON/format/checksum/schema validation;
- hostile object-key/nesting guards;
- future-format/schema fail-closed behavior;
- deterministic Showdown schema 1 → 2 migration;
- deterministic preferences schema 1 → 2 migration;
- current active/Legacy/preferences comparison;
- duplicate/conflict classification using current Showdown IDs as strings;
- dry-run UI;
- zero canonical storage writes/removals;
- no network request;
- `readyForRestore: false` even when analysis status is `ready`.

Next legal substantive build:

### Candidate C — Atomic Restore + Recovery UX

Candidate C is the first stage allowed to commit imported canonical state.

Do not start PWA, profiles/save registry, cloud, accounts, QR pairing or two-device work before Candidate C closes.

## 1.3 Current product model

The project is a FIFA 17 Career Mode rivalry companion, not a browser football simulator.

Current mode:

- exactly two managers;
- one browser/device;
- one active local Showdown;
- FIFA 17 results are entered manually;
- localStorage persistence;
- static HTML/CSS/vanilla JavaScript SPA;
- GitHub Pages hosting.

The browser app creates ceremony, structure, persistence, rivalry history and visual immersion around FIFA 17 careers played outside the website.

---

# 2. Authority hierarchy

When evidence conflicts, use this order:

1. live current source on `main`;
2. later explicit owner instruction and later owner acceptance/rejection evidence;
3. `00_DEVELOPER_START_HERE.md`;
4. `NEXT_TASK.md`;
5. `PROJECT_STATE.md` for established current contracts;
6. `POST_V1_ROADMAP_EXECUTION.md` for dependency ordering;
7. `ROADMAP_AMENDMENTS.md` / stability and release records;
8. current release/handoff chronology;
9. historical ChatGPT conversations;
10. outside reviews such as Grok.

Historical chats explain intent. They are not allowed to override a later owner correction or verified current source.

Never satisfy stale documentation by reverting newer validated source. Correct the stale document.

---

# 3. Historical sources actually reviewed

The owner supplied the official ChatGPT account export created on 2026-08-10. It contains many unrelated conversations. Only exact project-relevant conversations were extracted and analyzed.

## 3.1 `Website Creation and Guide`

Conversation ID:

`6a6ba895-cb1c-83ea-b13c-d7e3d42afb25`

Recovered active path:

- 439 text messages;
- project span roughly 2026-07-30 → 2026-08-09;
- ends when the conversation reaches maximum length.

This is the primary source for original product design, scoring/club corrections, early architecture, implementation friction, the first Project Bible/handoff problem, performance/visual priorities, and the v0.95 workstream program.

## 3.2 `Career Mode Showdown Dev`

Conversation ID:

`6a78bb0e-d2ac-83ea-b092-7c9377a6dda1`

Recovered active path:

- 314 project text messages in the extracted chronology;
- span roughly 2026-08-09 → 2026-08-10.

This is the primary source for browser-first/release-engineering discipline, r10-r13, v1 seal/stability planning, Reus/loading owner requirements, direct push/PR/deploy expectations and outside-review integration.

## 3.3 `Career Mode Showdown — Master Development Continuation`

Conversation ID:

`6a79ea21-093c-83ea-b00d-055524fb259a`

Recovered active path:

- 30 project text messages;
- span 2026-08-10.

This conversation is important because the owner explicitly asked for full recovery of the two older maximum-length chats. The assistant correctly refused to pretend it could read them by title and instructed the owner to obtain the official ChatGPT account export.

This 2026-08-12 research pass completes that deferred task.

## 3.4 `Project r4 Visual Fixes`

The exact later raw conversation is not present in the Aug 10 export. The export predates it.

Do not claim otherwise.

r4/r5 history was reconstructed from repository-native evidence produced by that work, including:

- `AI_DEVELOPER_AUDIT_2026-08-10_VISUAL_REGRESSION.md`;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION.md`;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_POST_MERGE.md`;
- roadmap-deepening handoffs;
- v1.0.2 maintenance/final/post-merge handoffs;
- release records;
- current `PROJECT_STATE.md` and asset/source authority.

Repository evidence is preferable to inventing missing transcript detail.

---

# 4. Original product intent recovered from `Website Creation and Guide`

## 4.1 The site was always about one rivalry between two real people

The owner’s first product description is unusually clear:

- only two people are involved;
- both play their own FIFA 17 Career Mode saves;
- the website tracks and dramatizes that rivalry;
- it is not a generic public competition platform;
- FIFA 17 nostalgia is a core experience goal.

This is why many later features should remain private/local by default even when cloud capability becomes technically possible.

## 4.2 The original six-wheel idea evolved, but its intent survived

The earliest concept requested:

- one top-five-league wheel;
- one team wheel per top-five league.

The architecture later simplified this into reusable engines and a more suspenseful club-assignment experience instead of maintaining six duplicate wheel components.

Do not recreate six independent wheel implementations just because the first chat mentions them.

The surviving intent is:

- random league selection;
- same selected league for both managers;
- suspenseful/deterministic two-club assignment;
- FIFA-era presentation.

## 4.3 Locked scoring came from explicit owner corrections

Current canonical score per manager/Season:

- Champions League: +5;
- Domestic League title: +3;
- Main domestic Cup: +1;
- 100 league points and/or 100 league goals: shared maximum +1;
- Top Scorer and/or Top Assist: shared maximum +1;
- maximum: 11.

Winner logic:

1. higher Season score wins;
2. equal non-zero scores stay Draw;
3. only 0–0 uses league position;
4. if equal, league points;
5. if still equal, Draw.

Older assistant text that implies +2 for both 100-point/100-goal achievements or +2 for Top Scorer/Assist is superseded.

## 4.4 Permanent club pairing was an explicit owner correction

Early planning briefly drifted toward clubs changing between rounds.

The owner corrected it:

- one league selected for the Showdown;
- two different clubs assigned once;
- those clubs remain permanent for every Season in that Showdown;
- club reuse is allowed in a separate future Showdown.

Owner example:

Chelsea vs Liverpool for a 10-Season Showdown means Chelsea vs Liverpool for all 10 Seasons.

This is why club reveal must visualize a committed assignment rather than act as a rerollable animation.

## 4.5 Transfer Challenge is an intentional privacy sequence

Original rule core:

- up to three signings each;
- 15-minute window;
- opponent has three guesses;
- a guess targets former League or Nationality;
- correctly guessed signing must be released.

Later owner refinement:

`Guess Entry → lock guesses → Signing Entry → lock signings → verdicts`.

The owner explicitly said this separation matters for eventual two-device play.

Important architectural lesson:

The current one-device state machine can prepare clean privacy boundaries for future networking without implementing networking early.

## 4.6 Showdown Home was chosen deliberately

The owner selected a Showdown Home/hub instead of chaining every action immediately into the next form.

It gives the rivalry identity, context and a return point between Seasons.

Therefore direct-routing simplifications that remove this hub can reduce product quality even if they reduce clicks.

## 4.7 Legacy was valued early

The owner immediately liked the proposed Legacy page.

Historical value is a core product pillar:

- completed rivalry archive;
- trophies;
- season history;
- head-to-head context;
- later analytics/achievements.

This is why data safety comes before expanding the history model: long-lived rivalry history must become safer before it becomes more structurally complex.

## 4.8 The owner rejected screenshot/match-note bloat

Early brainstorming included screenshot uploads/match notes.

The owner explicitly declined them and said the project was ready to build.

Do not casually add heavy user-media capture because it sounds like a natural football-tracker feature. It was considered and rejected in the original product definition.

---

# 5. Why the current engineering workflow exists

## 5.1 Partial manual source edits caused real early failures

The first chat depended on owner copy/paste into GitHub. Incremental instructions caused:

- confusion about whether “append” meant add;
- incomplete `index.html` replacements;
- missing script references;
- inconsistent file state;
- broken Start Showdown behavior;
- repeated need to ask for the full updated file.

The owner explicitly requested complete updated files to avoid bugs.

Later, direct GitHub implementation became the natural evolution.

Current lesson:

If repository access is available, implement directly in GitHub. Do not send the owner fragile multi-file splice instructions as the normal workflow.

## 5.2 Architecture modularity is a response to growth, not framework fashion

The project moved from page/script prototypes to explicit authorities because duplicate logic was becoming unsafe.

Current ownership map:

- `js/screens.js`: route/history/Smart Back authority;
- `js/storage.js`: persistence authority;
- `js/showdown.js`: canonical Showdown model;
- `js/scoring.js`: scoring/tiebreak authority;
- `js/analytics.js`: derived analytics authority;
- optional modules: lazy feature loading;
- visual modules/data/styles: licensed football presentation;
- Settings remains modal/lazy, not a second router.

Do not rewrite into React/Vue/Svelte merely to look modern. The current modular vanilla design is aligned with the product and hosting model.

## 5.3 The anti-loop rule came from an actual context failure

The original chat reached maximum length after repeated planning/implementation cycles.

The owner saw that a new chat using a giant handoff could still lose design nuance and asked for a comprehensive Project Bible plus anti-loop instructions.

This history directly produced today’s permanent handoff policy.

`00_HANDOFF_GOLDEN_RULE.md` is therefore an operational reliability mechanism, not optional documentation ceremony.

Every future developer must maintain the public handoff while working, because interruption/context limits are a known project risk.

---

# 6. Performance is a product requirement, not merely a CI metric

During Aug 8–9 the owner repeatedly paused feature development and requested performance-only or bug-fix-only builds.

Repeated themes:

- eliminate lag in data entry;
- preserve every existing feature;
- reduce unnecessary weight;
- clean duplicate/dead logic;
- fix routing/Back behavior instead of adding more features;
- keep soundtrack/trailer capabilities light;
- do not let visual fidelity create a choppy Chromebook experience.

This explains today’s startup budgets and lazy loading.

The correct product stance is not “visuals versus speed.”

It is:

**cinematic route-specific presentation on top of a small immediate shell.**

Do not make all football imagery eager merely because it is important presentation.

v1.1.3 deliberately uses route-scoped visual loading.

---

# 7. Chromebook/windowed desktop is a first-class acceptance target

The owner repeatedly reported versions that looked acceptable on phone but poor on Chromebook/windowed Chrome.

Observed historical failures included:

- overlapping sections;
- media selector placement problems;
- bad club reveal card geometry;
- Reus crop/sharpness differences between DPR1 desktop and DPR2 mobile;
- low-height layout problems.

Therefore “responsive” must include:

- standard desktop/Chromebook;
- lower-height/windowed laptop;
- mobile;
- mobile DPR2;
- reduced motion.

Do not validate only 1440-wide desktop + iPhone.

---

# 8. v0.95 workstream logic recovered from the first environment

The mature pre-v1 plan became a workstream sequence rather than continuous feature accretion.

Owner additions were inserted into the roadmap deliberately instead of all being implemented immediately.

Important evolution:

### Workstream 1 — Club Reveal / FIFA 17 visual identity

- explicit League selected checkpoint;
- no automatic jump before Continue;
- procedural/original club visual identity rather than proprietary official crests;
- two sealed club packs with suspense;
- persisted clubs before reveal;
- no animation reroll.

### Workstream 2 — Transfer Challenge redesign

Moved earlier than Settings because it changed the state-machine/privacy boundary.

### Workstream 3 — Settings

Centralized motion/feedback/data-management entry.

### Workstream 4 — Main Menu Statistics alignment

Reused one analytics engine rather than building parallel statistics logic.

### Workstream 5 — Season pre-commit review

Review before permanent Season write; final confirmation is the persistence boundary.

### Workstream 6 — final visual/accessibility/performance/regression polish

Includes smooth route presentation and original short menu-feedback cue only if quality remains high.

This workstream model is a strong precedent for Candidate C: one bounded change class, explicit exclusions, browser acceptance before advancing.

---

# 9. Release engineering matured in `Career Mode Showdown Dev`

## 9.1 Browser-first became explicit owner policy

The owner asked for live/browser module testing before shipment and asked for an alternative browser/virtual browser if Chrome access failed.

That pressure evolved into:

- repository-owned Playwright/Chromium tests;
- mobile/Chromebook journeys;
- accessibility scanning;
- repeated stability cycles;
- public Pages smoke after merge.

## 9.2 Push → PR → checks → merge → deploy → verify became the normal release transaction

The owner repeatedly requested that exact process during r12/r13.

The project should no longer treat a local commit or generated code as a released build.

## 9.3 External critique became a risk-discovery tool

The owner brought Grok criticism into the project and explicitly asked for useful lessons plus pushback against shallow advice.

The correct response was the v1.0.1 Stability Lane, not a framework rewrite.

Generic concerns were translated into reproducible failure models:

- corrupt storage;
- quota rejection/rollback;
- rapid actions;
- reload/Back/Forward;
- accessibility;
- duplicate IDs;
- deployed byte parity;
- public browser journey.

Project pattern:

**convert criticism into finite evidence, not vague refactoring.**

---

# 10. Visual history: the most important lessons from r3 → r4 → r5 → v1.0.2 → v1.1.3

## 10.1 Green technical gates can still approve unacceptable art direction

PR #9/r3 ran real browser/deployed tests and was still visually rejected by the owner’s real iPhone screenshots.

James and Rashford were badly cropped; Martial had weak competing-subject composition.

The failure was not that browser tests were skipped.

The failure was:

- wrong visual contract;
- `object-fit: cover` forced portrait sources into wide banners;
- physical-pixel resolution checks did not understand subject framing;
- developer manual review was too permissive;
- CI success was incorrectly conflated with owner art-direction acceptance.

This distinction is permanent.

## 10.2 High resolution is not high visual quality

A source can have sufficient native pixels and still be a poor UI source because:

- subject is too small;
- aspect ratio is wrong for destination;
- another player competes with the subject;
- face/club identity is weak at actual rendered size;
- a responsive `cover` crop removes the important content.

## 10.3 The authored-derivative rule

Mature rule established through r4/r5:

1. choose a reuse-licensed source;
2. evaluate actual destination proportions;
3. author the crop intentionally in source pixels;
4. generate a local derivative;
5. record source/license/crop/dimensions/fingerprints;
6. render the completed derivative with `object-fit: contain` when the asset is subject-safe;
7. do not apply a second destructive responsive crop;
8. tune the media stage around the derivative.

## 10.4 r4 was recovery, not final player-photo authority

PR #10 r4 recovery merged at:

`45372873569920b8aaeb366926d9047aeb5a3638`

It repaired r3’s structural problem and remained technically green, but the owner later rejected r4 James/Rashford/Martial sources and requested genuinely different sources with smarter crops.

Never restore r4 photography because “r4 passed.”

## 10.5 r5 source review established that candidate rejection is part of quality work

The r5 handoff records rejected Rashford/Martial candidates before final selection.

A 2017 Rashford Anderlecht crop replaced an intermediate 2016 candidate because the face, red Manchester United shirt and subject identity read better at actual Transfer sizes.

A future developer should feel free to reject a technically valid source before implementation.

## 10.6 v1.0.2 established clean-anchor composition

Owner Chromebook evidence showed:

- James washed by a light overlay;
- Rashford diagonal geometry crossing his face;
- Home Reus diagonal integration cutting awkwardly around head/neck;
- loading Reus explicitly liked.

Visual rule changed from:

`graphics over photograph`

to:

`photograph as clean anchor; graphical energy behind/beside the subject`.

FIFA-style diagonal energy is still desired, but not over important facial geometry.

## 10.7 Do not lower quality thresholds to get green

In v1.0.2 James near-breakpoint occupancy initially failed.

The composition was retuned instead of lowering the quality floor.

That is a general project rule.

## 10.8 v1.1.3 deepens source-selection criteria

The owner later said the James interview image lacked cinematic/dramatic impact and explicitly asked that replacements be judged on:

- quality;
- photogenic strength;
- historic value;
- emotional/dramatic feeling;
- actual screen harmony.

v1.1.3 therefore uses stronger action/historic imagery and adds seven more bounded route visuals without turning every screen into a photo collage.

---

# 11. Supersession map

| Historical idea or statement | Current rule | Why |
| --- | --- | --- |
| Club/league may change every round | One league + two different permanent clubs for entire Showdown | explicit owner correction |
| 100 points and 100 goals can produce +2 | shared maximum +1 | current max-11 rule |
| Top Scorer and Top Assist can produce +2 | shared maximum +1 | current max-11 rule |
| Unlimited Showdown length | 1 / 3 / 5 / 10 only | current product contract |
| Six independent wheel implementations | reusable League Wheel + committed club assignment/reveal | duplicate architecture rejected |
| Guess and Signing combined | Guess Entry → lock → Signing Entry → lock → verdict | privacy/two-device preparation |
| Free-text League/Nationality entry | canonical selectors/datasets | prevent spelling/accent ambiguity |
| Official club crests should be bundled | original/procedural identity by default | rights-safe project boundary |
| Screenshot uploads/match notes should be added | not part of current product | owner explicitly declined |
| QR/two-device should be built early | v2.0 after local recovery/identity/cloud-readiness | owner explicitly deferred |
| r3/r4 images are safe because CI passed | current v1.1.3 manifest/source authority only | owner rejection supersedes CI |
| Portrait hero can rely on blind `cover` | authored derivative + subject-safe presentation | visual incident history |
| Framework rewrite = professionalization | no rewrite without measured need | current vanilla JS architecture is fit-for-purpose |
| Candidate B preview permits restore | Candidate C must freshly revalidate and collect explicit choices | preview is read-only/stale-able |
| Runtime/cache revision is schema authority | backup format/schema versions are migration authority | cache revision is diagnostic only |

---

# 12. Grok review: accepted lessons and explicit pushback

The owner supplied an external Grok conversation reviewing the current site and roadmap. It is useful critique, but it is not source authority.

## 12.1 Valuable observations to keep

### A. Planning quality is materially affecting implementation quality

Grok correctly recognized that the post-v1 document is not a casual ideas list. The strongest part is dependency ordering and explicit exclusions.

This matches repository evidence.

The roadmap’s real value is preventing expensive sequencing mistakes, especially:

- recovery before storage migration;
- stable identity before cloud conflict resolution;
- cloud readiness before cloud backup;
- remote reliability before two-device shared state;
- verification/moderation decision before public rankings.

### B. Vanilla JavaScript remains a strong architectural fit

Grok’s reasoning is broadly sound:

- browser-native product;
- localStorage/file APIs/timers/history/DOM are direct;
- GitHub Pages requires no server runtime;
- no build framework is necessary for current scope;
- lazy modular JS keeps the shell lean;
- future PWA remains naturally JavaScript-based.

This supports the project’s existing rejection of a framework rewrite without evidence.

### C. The biggest current technical maturity gain is data safety

Grok correctly noticed that Candidate A/B are more important than flashy visual polish from an engineering maturity perspective.

Backup envelope/checksum/import analysis are foundational because later migrations/profiles/cloud need an escape hatch and deterministic historical-data handling.

### D. The word “Stable” is not the reason the project is mature

Grok explicitly said the build itself, not the label, was impressive.

That aligns with project doctrine: release labels never replace reproducible evidence.

## 12.2 Pushback / corrections

### A. Grok’s project-size estimate is not a reliable current metric

Grok described the whole project as roughly 0.66 MB and treated the Reus image as the only significant media asset.

That is materially incomplete for current v1.1.3.

The current repository contains many local football derivatives; the football images visible in the current tree alone exceed 2 MB before counting the rest of the project.

Do not use Grok’s size figure for performance planning.

Use the project’s measured **eager startup** budgets instead. That is the metric relevant to user-perceived startup and the one the repository actually protects.

### B. “No backend / no game engine” is true but can understate the hard part

The project is technically a static frontend, but its difficulty is increasingly in:

- transaction semantics;
- storage migration;
- rollback;
- conflict classification;
- state-machine integrity;
- accessibility;
- responsive visual quality;
- release provenance.

A future developer should not infer “simple static site” means Candidate C is low-risk.

### C. TypeScript is a possible future tool, not an approved next milestone

Grok suggested TypeScript might become useful as the model grows.

That is reasonable as a future evidence-triggered option, but it is not currently justified as a migration project.

Candidate C should not be expanded into a TypeScript conversion. The roadmap already has higher-priority data-safety work and rejects modernization rewrites without measured need.

### D. AI speed does not excuse residual technical debt

The Grok conversation discussed how quickly AI helped build the first version.

The correct project lesson is not “AI makes professional process unnecessary.”

The history shows the opposite:

- fast early generation produced partial-edit problems and architecture drift;
- mature quality arrived as the project added owner acceptance gates, source authority, browser evidence, rollback tests and handoffs.

AI accelerated implementation; disciplined product ownership and validation stabilized it.

---

# 13. Current source seams Candidate C must use

## 13.1 Settings → Legacy/Data Management is already the correct UX path

`js/settings.js`:

- Settings remains a modal/lazy experience;
- its Data Management action closes Settings and opens optional module `legacy`;
- text already describes backup export and centralized destructive actions.

Do not create a new top-level restore route without evidence.

## 13.2 `js/legacy.js` is the existing Data Management host

Legacy already owns:

- archived Showdown deletion;
- delete-all history;
- reset all Showdown data;
- destructive confirmation language;
- transactional rollback examples when active completed + Legacy state must stay coherent;
- Candidate A Export Backup UI;
- Candidate B mount point.

Candidate C belongs in this Data Management surface unless usability testing disproves it.

## 13.3 `js/optionalModules.js` already provides safe lazy load ordering

For Legacy/Data Management it loads:

1. `js/backup.js`;
2. `js/importAnalysis.js`;
3. `js/legacy.js`;
4. Legacy CSS.

Candidate C should extend this chain with a restore module only if separation materially improves safety/testability.

Do not make Candidate C eager.

## 13.4 Candidate B is intentionally read-only

`js/importAnalysis.js` explicitly states:

`Read-only. No restore writes are legal in this module.`

It already performs:

- 5 MiB ceiling;
- migration registry;
- current-local comparison;
- same-ID conflict classification;
- checksum verification;
- migration preview;
- read-only UI;
- `readyForRestore: false`.

Do not mutate Candidate B into the persistence owner.

## 13.5 `js/storage.js` must remain the restore authority

Candidate C needs storage-owned APIs for:

- flush pending writes;
- exact raw snapshot;
- atomic multi-key application;
- post-write verification;
- complete rollback;
- rollback verification;
- cache invalidation only after success.

A UI module should submit a validated restore plan to storage authority. It should not call localStorage directly.

---

# 14. Candidate C — recommended implementation architecture

This is a deepened operating protocol, not permission to skip design review against live source.

## 14.1 Recommended module boundary

Preferred shape:

- `js/importAnalysis.js` stays read-only analysis/migration authority;
- a new lazy `js/restore.js` may own Candidate C orchestration/UI state if separation keeps responsibilities clearer;
- `js/legacy.js` remains Data Management host/mount point;
- `js/storage.js` owns all canonical writes, rollback and cache invalidation primitives;
- `js/screens.js` remains navigation/history authority.

If Candidate C can remain small and clean inside Legacy without creating duplicated logic, a separate module is not mandatory. Separation is preferred only if it reduces coupling and is measured against startup/lazy boundaries.

## 14.2 Restore must use a plan, not ad-hoc button side effects

Before first write build an immutable/in-memory restore plan containing:

- analyzed source identity/fingerprint;
- freshly revalidated envelope/checksum;
- migrated payload;
- active Showdown choice;
- Legacy merge/conflict choices;
- preference choice;
- exact keys affected;
- expected final raw bytes for every affected key;
- exact pre-restore raw bytes;
- user confirmation metadata needed for UX/audit.

Then storage applies the plan as one transaction.

## 14.3 Stale-preview protection

Candidate B preview can become stale because:

- selected file can change;
- local storage can change;
- current Showdown can advance;
- Legacy can change;
- preferences can change.

At Apply:

1. flush pending writes;
2. re-read/revalidate file/envelope;
3. recompute migration/conflict analysis against current local state;
4. compare to the preview the user approved;
5. if materially different, block Apply and require a fresh preview/choice review.

Never treat an old `PREVIEW READY` result as a write token.

## 14.4 Active Showdown choice

No silent overwrite.

UX should clearly distinguish:

- no imported active Showdown;
- imported active Showdown would add to empty slot;
- exact duplicate/no change;
- same ID but changed revision/content;
- different active Showdown requiring explicit replacement;
- current active raw bytes corrupt/unreadable.

If replacement is destructive, show backup/recovery guidance before final confirmation.

## 14.5 Legacy merge choice

Minimum rules:

- preserve existing IDs;
- exact duplicate does not multiply;
- new records can be added;
- same-ID/different-content needs explicit resolution;
- completed active also present in Legacy must not create accidental duplicate history;
- re-import same backup after successful restore is idempotent.

Avoid a hidden “best effort latest wins” policy.

## 14.6 Preferences choice

Preferences restoration is independent of active/Legacy restore.

The user must be able to understand whether preferences:

- remain unchanged;
- are added;
- are replaced;
- cannot be safely compared because current raw bytes are corrupt.

Do not silently change motion/menu-feedback preferences merely because a backup contains them.

## 14.7 Raw snapshot rule

Rollback authority is exact raw bytes, not re-serialized parsed objects.

Before first mutation capture exact raw values for every affected canonical key.

If a key was absent, snapshot absence explicitly.

Rollback must restore:

- exact prior string bytes for existing keys;
- exact absence for previously absent keys.

This preserves malformed raw evidence and avoids normalization during recovery.

## 14.8 Commit order and failure handling

The precise write order can be selected during implementation, but tests must inject failure at:

- first affected key;
- middle key after at least one successful change;
- final key;
- verification after apparent success.

On any failure:

- stop forward writes;
- restore every affected key to the exact snapshot;
- verify every rollback result;
- if rollback fails, surface critical recovery state and raw guidance;
- do not navigate away as if restore succeeded.

## 14.9 Success handling

Only after complete commit + verification:

- invalidate/update active presence cache;
- invalidate/update Legacy cache/revision;
- refresh preference cache/motion state where appropriate;
- refresh `currentShowdown` from canonical persisted state;
- refresh menu/status presentation;
- rerender Data Management or move via `screens.js` only through an explicitly chosen legal UX flow.

Do not partially refresh after key 1 or key 2.

## 14.10 Concurrency / double Apply

Candidate C needs one restore transaction lock.

Rapid click/touch/keyboard activation must not create two competing restore transactions.

Button states should expose `aria-busy` and remain recoverable after failure.

## 14.11 Page lifecycle interruption

Pure localStorage writes are synchronous, but the Candidate C workflow can include async checksum/file revalidation/UI steps.

Where reproducible, test interruption/backgrounding/navigation around the pre-commit boundary.

The safest design is to make the actual canonical write/verification/rollback transaction short, synchronous at the storage boundary, and preceded by all expensive async analysis.

---

# 15. Candidate C required test matrix

A happy-path restore test is insufficient.

## 15.1 Deterministic contract fixtures

At minimum:

- empty local state + full valid backup;
- active-only backup;
- Legacy-only backup;
- preferences-only backup;
- all three records;
- schema-1 Showdown migration;
- schema-1 preferences migration;
- future format;
- future Showdown schema;
- malformed JSON;
- checksum mismatch;
- hostile object keys;
- oversized file;
- duplicate Legacy IDs;
- same ID / same content;
- same ID / same effective revision;
- same ID / different revision/content;
- corrupt current active raw bytes;
- corrupt current Legacy raw bytes;
- corrupt current preferences raw bytes;
- completed active also represented in Legacy;
- repeat same restore/idempotence.

## 15.2 Failure injection

Required by current `NEXT_TASK.md`:

- first-key write failure;
- middle-key write failure;
- final-key write failure;
- quota/storage exception;
- post-write verification mismatch;
- rollback write failure;
- rapid/double Apply;
- stale analysis/file changed between Preview and Apply;
- lifecycle interruption where technically reproducible.

## 15.3 Browser/UX

Test:

- Chromebook standard viewport;
- 940-ish windowed/low-height Chromebook class;
- mobile DPR2;
- normal motion;
- reduced motion;
- keyboard only;
- mouse;
- touch;
- focus restoration;
- minimum targets;
- overflow;
- axe;
- critical alerts/status messages;
- long/conflict-heavy Legacy preview.

## 15.4 Regression

All protected gameplay/release families remain green:

- Home;
- League confirmation;
- Club assignment;
- Transfer;
- Season Review;
- Statistics;
- Settings;
- visual immersion;
- football visuals;
- static app/release coherence;
- Stability;
- Burn-In;
- Candidate A;
- Candidate B.

Do not reduce startup budget or change unrelated visual sources to make Candidate C pass.

---

# 16. Roadmap from Candidate C forward, and why the order matters

## v1.1 — finish Data Safety and Recovery

Candidate C closes the missing restore half.

Why first:

Every structural future migration needs a safe escape hatch.

## v1.2.0 — Installable Offline App

Add manifest/service worker/update-ready/offline behavior only after recovery exists.

Risk:

A stale service worker can mix incompatible runtime revisions. Upgrade/rollback must be tested.

## v1.3.0 — Local Profiles and Save Library

This is where stable opaque manager/Showdown/Season identities and multi-save registry belong.

Do not retrofit current Date.now Showdown IDs early inside Candidate C.

Historical manager-name ambiguity requires explicit mapping, not silent equality-by-name.

## v1.4.0 — Legacy 2.0 and Achievements

Requires stable identities.

Achievements are recognition only; they never change max-11 scoring.

## v1.5.0 — Analytics 2.0

Requires stable history/identity.

Analytics remain derived; no parallel persistent statistics database unless profiling proves a need.

## v1.6.0 — Optional Content Packs

The current five-league default remains canonical.

Packs are opt-in/versioned/validated and rights-safe.

## v1.7.0 — Challenge Studio

Optional objectives/rulesets with stable IDs/versions.

Do not alter canonical scoring.

## v1.8.0 — Cloud Readiness

No cloud UI yet.

Introduce async repository boundary behind storage authority, revisions/tombstones/merge rules, threat/privacy model and local sync simulation.

## v1.9.0 — Opt-In Cloud Backup Beta

Only after provider/budget/privacy decision.

First remote value is backup/restore, not realtime rivalry.

## v2.0.0 — Private QR Paired Two-Device Alpha

Only after remote reliability/security.

Current separated Guess/Signing phases become role-private screens.

## v2.1.0 — Connected Rivalry

Shared canonical state, reconnect, deterministic conflict handling, multi-party checkpoint behavior.

## v2.2.0 — Private Sharing and Groups

Private/revocable read-only sharing first. No public feed by default.

## Conditional v3 community/rankings gate

Not an approved implementation milestone.

Manual FIFA result entry prevents trustworthy global competitive ranking without a separate verification model.

Proceed only if usage, verification, moderation, privacy and operating budget justify it.

---

# 17. What the historical review changed in our understanding

The current source was already technically well documented, but the historical review adds several deeper causal insights:

## 17.1 Immersion is functional value

Loading screen, FIFA-era menu rhythm, club reveal suspense and route photography are not disposable decoration. They help the owner perceive the app as a game companion rather than an admin form.

## 17.2 Performance and immersion are not opposing objectives

The owner repeatedly demanded both. The architecture answer is lazy/route-scoped richness, not deleting presentation or making it eager.

## 17.3 Planning is a risk-control system

The detailed roadmap is valuable primarily because it sequences dependencies and exclusions. It should not be replaced by spontaneous feature accumulation.

## 17.4 Owner evidence is a separate authority from CI

Especially for visuals, a technically green build can still be rejected.

Automated gates protect measurable properties. Owner review protects art direction and actual feel.

## 17.5 Repeated failures should become permanent structure

Project examples:

- partial edits → complete-file/direct GitHub workflow;
- context loss → public continuous handoff;
- wheel auto-advance/reroll classes → explicit selection checkpoint + settled transition rules;
- route collisions → centralized router;
- persistence drift → storage authority;
- bad photo crops → authored derivatives;
- face-overlay defects → clean-anchor layering;
- generic maintainability concern → Stability Lane;
- future migration risk → Candidate A/B/C staging.

This is perhaps the strongest engineering principle in the project.

---

# 18. Operating protocol for the next developer

Before changing code:

1. fetch current `main` and record the exact SHA;
2. read `00_HANDOFF_GOLDEN_RULE.md`;
3. read `00_DEVELOPER_START_HERE.md`;
4. read `NEXT_TASK.md` completely;
5. read the Candidate C sections of `POST_V1_ROADMAP_EXECUTION.md`;
6. read this master handoff when historical intent/constraints matter;
7. inspect live `js/storage.js`, `js/backup.js`, `js/importAnalysis.js`, `js/legacy.js`, `js/settings.js`, `js/optionalModules.js` and relevant tests;
8. create/update the public Candidate C handoff **before** substantial implementation;
9. write scope + exclusions before coding;
10. do not ask the owner to repeat information already recorded here.

During work:

- report root cause, not only symptoms;
- record failed experiments/tests publicly;
- do not lower quality/performance thresholds merely to turn CI green;
- distinguish stale tests/docs from real product defects;
- keep candidate SHA frozen during official proof;
- keep owner acceptance separate from developer/automated acceptance;
- use expected-head merge protection;
- verify Pages exact deployment/runtime;
- update handoff continuously.

Candidate C must finish before the next roadmap milestone.

---

# 19. Historical files a developer should use only when deeper evidence is needed

Current bootstrap should stay short. Do not force every session to reread every chronology.

Use these when the current master handoff points to a historical dispute:

- `AI_DEVELOPER_AUDIT_2026-08-10_VISUAL_REGRESSION.md` — r3 visual failure and gate-design lesson;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION.md` — r5 source/crop/release chronology;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_ROADMAP_DEEPENING.md` — source-grounded roadmap recovery;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_ROADMAP_DEEPENING_FINAL.md` — handoff/discoverability cleanup;
- v1.0.2 maintenance/final/post-merge handoffs — clean-anchor visual architecture;
- Candidate A/B handoffs — data-safety staging/failures;
- v1.1.3 handoffs — wheel race + cinematic visual expansion + double-gate release proof.

The official ChatGPT export was used for this research, but it does not need to become part of the runtime repository. This document records the durable findings.

---

# 20. Final continuation sentence

A correctly oriented next developer should be able to state this before coding:

> I am starting from the protected v1.1.3 production baseline. Candidate A export and Candidate B read-only import analysis are complete. Candidate C Atomic Restore + Recovery UX is the only current substantive roadmap task. I will implement restore through `js/storage.js` authority inside the existing lazy Data Management architecture, freshly revalidate before Apply, snapshot exact raw bytes, guarantee whole-transaction rollback and rollback verification, preserve gameplay/visual/performance contracts, continuously record failures and decisions in a public handoff, and will not jump to PWA/profiles/cloud/two-device work until Candidate C is merged, deployed and proven.

If a future developer cannot confidently make that statement after reading current source and authority documents, they are not ready to begin implementation.