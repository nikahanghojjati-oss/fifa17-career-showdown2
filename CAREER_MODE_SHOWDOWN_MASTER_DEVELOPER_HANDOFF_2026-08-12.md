# Career Mode Showdown — Master Developer Handoff Deep-Dive

Date opened: 2026-08-12
Research branch: `handoff/master-developer-deep-dive-2026-08-12`
Starting repository `main`: `5f21bdeb5122839e4a9a1e1a1c24936d856b3da6`
Validated documentation head beneath the evidence seal: `e25f3a326fbe2eeef9196ac8e6140bd17f217a2d`
Immutable v1.1.3 application runtime authority: `29760bbf33c974267bd1ad64d0839f73ad8051fa`
Application version: `v1.1.3`
Runtime asset revision: `1.1.3-r1`

> This document is the public, continuously updated handoff requested by the owner on 2026-08-12. It is being written before and during the historical review rather than reconstructed only at the end. Historical conclusions are not considered final until cross-checked against the current repository authority and the relevant exported conversation records.

## 0. Authority and method

When sources disagree, use this order:

1. current source code on `main`;
2. current `PROJECT_STATE.md` / `NEXT_TASK.md` and current authoritative handoffs;
3. current architecture/data/roadmap documents;
4. historical repository handoffs and release evidence;
5. historical ChatGPT conversation records;
6. external commentary/reviews (including Grok), used as critique only and never as implementation authority.

The purpose of the historical review is not to resurrect superseded code or old plans. It is to recover product intent, owner preferences, causal history, rejected approaches, and the reasons behind protected decisions so a future developer does not accidentally regress the project while technically following only the latest code.

## 1. Exact project state before the deep-dive

### 1.1 Current shipped state

v1.1.3 is COMPLETE / PROTECTED.

The owner-priority v1.1.3 maintenance release:

- fixed the League Wheel post-selection visual reroll without changing the selected league or gameplay semantics;
- preserved the one-league / two-different-permanent-clubs Showdown model;
- replaced and expanded licensed football photography without reviving rejected player-image sources;
- preserved the accepted FIFA 17-inspired visual language and Reus loading/Home treatment;
- retained Candidate A backup export and Candidate B import-analysis semantics;
- retained the singleton local-storage product model for the current release;
- stayed under unchanged eager-startup limits at **164,965 raw / 37,006 gzip** against protected ceilings of **165,000 / 37,500**;
- passed all 13 permanent gate families twice on one frozen pre-merge candidate;
- merged through expected-head protection;
- passed all 13 permanent gate families twice again on the immutable production runtime;
- passed deployed-site byte parity, provenance, Home/Reus, licensed-photo, Candidate A, Candidate B and complete public journey audits;
- completed a final documentation-only closure matrix and Pages deployment;
- ended with an evidence-only `[skip ci]` seal at current `main`.

The evidence-only seal is not the application runtime authority. Runtime behavior remains represented by `29760bbf33c974267bd1ad64d0839f73ad8051fa`.

### 1.2 Current persistence and data-safety position

Canonical localStorage authority remains `js/storage.js`.

The current three canonical keys are:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A is COMPLETE / PROTECTED:

- versioned backup envelope;
- non-mutating export;
- exact raw snapshot capture;
- checksum/corruption detection;
- corrupt raw-data preservation;
- no canonical write during export.

Candidate B is COMPLETE / PROTECTED:

- local file analysis only;
- strict JSON / format / checksum / schema checks;
- hostile-structure and future-schema fail-closed behavior;
- deterministic migration preview;
- deterministic conflict classification;
- active / Legacy / preferences impact preview;
- zero canonical storage writes/removals during analysis;
- no network request;
- explicit preview-only UX.

Candidate B `PREVIEW READY` is not permission to write.

### 1.3 Next legal substantive build

**Candidate C — Atomic Restore + Recovery UX** is the next legal v1.1.x task.

Candidate C is the first stage allowed to write imported canonical state. It must build on Candidate A + Candidate B and must not bypass either one.

Mandatory transaction sequence currently protected in `NEXT_TASK.md`:

1. flush pending canonical application writes;
2. revalidate the selected/analyzed backup immediately before apply;
3. snapshot exact raw bytes for every affected canonical key before first mutation;
4. require explicit user choices for active replacement, Legacy merge/conflicts and preferences;
5. compute the entire final candidate state in memory before first write;
6. write only through `js/storage.js`;
7. treat the multi-key restore as one transaction boundary;
8. verify every committed key/value after writing;
9. on any write or verification failure, restore every affected key to exact pre-restore raw bytes;
10. verify rollback byte-for-byte;
11. surface rollback failure as critical recovery state, never false success;
12. invalidate caches / route-derived state / navigation only after total success;
13. keep re-import deterministic and idempotent;
14. preserve corrupt raw-data recovery semantics;
15. keep recovery/export guidance before destructive active replacement;
16. do not create a second persistence owner.

Required failure-injection evidence includes first/middle/final-key failure, quota exception, post-write verification mismatch, rollback-write failure, corrupt pre-existing raw data, same-ID conflicts, rapid/double Apply, lifecycle interruption where reproducible, stale preview vs apply, and repeat import of an already-restored backup.

### 1.4 Protected systems Candidate C must not casually change

- max-11 scoring;
- 0–0-only tiebreak rule;
- exactly two managers;
- one browser/device product model for the present release;
- same league + different permanent clubs;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics / Legacy / Trophy derivations;
- `js/screens.js` route/history authority;
- `js/storage.js` persistence authority;
- football-photo source authority and accepted presentation;
- Candidate A export semantics;
- Candidate B read-only analysis semantics;
- v1.2.0 reservation for Installable Offline App.

### 1.5 Roadmap from here

The dependency order remains intentional and must not be collapsed into a feature wishlist:

1. **v1.1 Data Safety and Recovery** — finish Candidate C and close atomic restore/recovery.
2. **v1.2.0 Installable Offline App** — PWA/offline capability after restore safety exists.
3. **v1.3.0 Local Profiles and Save Library** — move beyond singleton active save only after safe backup/import/restore foundations exist.
4. **v1.4.0 Legacy 2.0 and Achievements** — richer long-term local history on top of stable save identity/library.
5. **v1.5.0 Analytics 2.0** — deeper derived insight without turning analytics into persistence authority.
6. **v1.6.0 Optional Content Packs** — expand optional content without bloating the initial shell or violating rights constraints.
7. **v1.7.0 Challenge Studio** — richer user-configurable challenge systems after core data identity and history are mature.
8. **v1.8.0 Cloud Readiness** — adapters, IDs, conflict/migration preparation; not yet opt-in cloud sync.
9. **v1.9.0 Opt-In Cloud Backup Beta** — conditional, cost/privacy-aware cloud backup only after readiness gates.
10. **v2.0.0 Private QR Paired Two-Device Alpha** — first two-device work only after cloud/readiness foundations.
11. **v2.1.0 Connected Rivalry** — deeper paired-device experience.
12. **v2.2.0 Private Sharing and Groups** — private social layer after identity/sync safety exists.
13. **Conditional v3** — only after explicit future decision gates; not a currently authorized implementation target.

The importance of this ordering is architectural, not cosmetic. Profiles, cloud and two-device work would be dangerous if built directly on the current singleton storage model before atomic restore, migrations, stable IDs and a save registry are proven.

## 2. Historical research scope opened by the owner

The owner asked this deep-dive to focus only on relevant project discussions and artifacts, especially:

1. **Website Creation and Guide** — earliest build environment / product formation;
2. **Career Mode Showdown Dev** — second major development environment and visual/product refinement;
3. **Career Mode Showdown — Master Development Continuation** — recover from exported ChatGPT history plus repository records produced by that chat;
4. **Project r4 Visual Fixes** — recover visual-source/crop decisions, rebuild work, and continuity practices;
5. current repository handoffs / release evidence;
6. the newly supplied Grok review as outside critique.

The uploaded ChatGPT history is searched by exact conversation title and project-specific phrases rather than reviewed indiscriminately. Irrelevant personal/non-project conversations are intentionally excluded.

## 3. ChatGPT export source inventory and limitation

The owner supplied an official ChatGPT account export generated on 2026-08-10. It contains 41 `conversations-###.json` files and thousands of unrelated conversations, so the review was narrowed to exact project titles.

The export contains these exact target conversations:

### 3.1 Website Creation and Guide

Conversation ID: `6a6ba895-cb1c-83ea-b13c-d7e3d42afb25`

Relevant active conversation path recovered: 439 text messages, including 176 user messages and 263 assistant messages.

Approximate project span in the export: 2026-07-30 through the maximum-length interruption on 2026-08-09.

### 3.2 Career Mode Showdown Dev

Conversation ID: `6a78bb0e-d2ac-83ea-b092-7c9377a6dda1`

Relevant active conversation path recovered: 314 text messages, including 19 user messages and 295 assistant/tool-progress messages.

Approximate span: 2026-08-09 through 2026-08-10.

### 3.3 Career Mode Showdown — Master Development Continuation

Conversation ID: `6a79ea21-093c-83ea-b00d-055524fb259a`

Relevant active conversation path recovered: 30 text messages, including 11 user messages and 19 assistant messages.

Approximate span: 2026-08-10.

### 3.4 Project r4 Visual Fixes source limitation

The exact later conversation **Project r4 Visual Fixes** is not present in the 2026-08-10 ChatGPT export. This is temporally consistent: that export snapshot predates the later r4/r5 continuation work.

Do not claim a raw Project r4 transcript was recovered from the ZIP.

For that environment, this handoff instead uses higher-value repository evidence produced by the development itself, especially:

- `AI_DEVELOPER_AUDIT_2026-08-10_VISUAL_REGRESSION.md`;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION.md`;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_POST_MERGE.md`;
- v1.0.2 maintenance/final/post-merge handoffs;
- current `PROJECT_STATE.md` visual history;
- current asset manifest/source authority.

This limitation is deliberate and transparent rather than filled with guessed chat content.

## 4. Website Creation and Guide — recovered product formation

This first environment matters because it contains the **why** behind many current contracts.

### 4.1 Original product identity

The project began as a free-hosted companion for a two-person FIFA 17 Career Mode competition. The owner was not asking for a football simulator. The site was to organize and ritualize a rivalry played manually in FIFA 17.

The earliest concept included:

- a league wheel over the FIFA 17-era top five leagues;
- league-specific club selection;
- tables tracking score/statistics;
- persistent history;
- FIFA 17-inspired presentation;
- two human managers playing their own FIFA 17 saves.

The core product therefore has always been **a rivalry companion and ceremony layer around a real FIFA 17 career**, not an attempt to reproduce FIFA gameplay in-browser.

### 4.2 Early implementation friction explains later full-file/direct-GitHub discipline

The first chat used owner copy/paste into GitHub and incremental instructions such as “append this” or “add this line.” That quickly produced confusion:

- the owner reasonably asked whether “append” meant add;
- a partial `<main>` replacement was mistaken for a complete `index.html`;
- script path / filename mismatch (`League.js` vs `leagues.js`) broke expected behavior;
- partial edits made it unclear which code belonged where;
- the owner then explicitly requested complete updated files rather than fragments.

The assistant itself eventually recommended complete-file replacement to stop partial-edit drift.

Historical lesson:

**Today’s direct GitHub implementation rule is not an arbitrary preference. It is the mature answer to a real early failure mode.** A future developer should not regress the workflow back to asking the owner to manually splice partial source edits unless direct repository access is genuinely unavailable.

### 4.3 Architecture matured from visible early failure

The early implementation began closer to a small page/script bundle. As the scope expanded, both owner and assistant recognized that wheels, scoring, storage, transfer state, statistics and navigation needed separation.

That produced the lineage that eventually became the current authority map:

- navigation separated from features;
- persistence separated from UI;
- scoring centralized;
- reusable screens/components replaced duplicated pages;
- one reusable league-wheel concept replaced six independently maintained wheel pages;
- lazy modules were later introduced to keep the shell light.

A future developer should understand the project’s modularity as **complexity containment**, not stylistic abstraction.

### 4.4 The permanent club-pair rule was an owner correction, not an assistant invention

An early assistant idea allowed club/league selection to vary between rounds/Seasons. The owner explicitly corrected this.

The authoritative model became:

- select one league for the Showdown;
- assign two different clubs from that league once;
- those two clubs remain the managers’ clubs for every Season in that Showdown;
- club reuse in a separate future Showdown is allowed;
- no reroll after the assignment transaction.

Example used during the design discussion: if the Showdown is Chelsea vs Liverpool for 10 Seasons, it remains Chelsea vs Liverpool across all 10 Seasons.

This correction is foundational. Do not let an old transcript passage about per-round rerolls override current source.

### 4.5 Scoring intent was also sharpened by explicit owner correction

The owner’s scoring philosophy is intentionally compact:

- Champions League: +5;
- Domestic League: +3;
- Main domestic Cup: +1;
- 100 League Points and/or 100 League Goals: **shared maximum +1**;
- Top Scorer and/or Top Assist: **shared maximum +1**;
- maximum Season score: 11.

Some old assistant summaries incorrectly described those paired bonus groups as potentially +2 each. Those passages are stale and rejected by later owner clarification and current `js/scoring.js` authority.

### 4.6 Transfer Challenge was designed as a privacy/ritual system before two-device play existed

Historical transfer design:

- each manager may make at most three signings;
- a 15-minute transfer period;
- opponent gets three guesses;
- each guess can target previous League or Nationality;
- correctly guessed signing must be released before the Season;
- later the owner explicitly requested **Guess Entry before Signing Entry**, on separate screens;
- the owner requested searchable/dropdown league and nationality inputs rather than fragile free text.

Crucially, the owner explained that separating Guess and Signing screens was important because future two-device play would need those privacy boundaries.

This is a strong example of roadmap discipline: **future compatibility influenced current state-machine boundaries without prematurely implementing networking.**

### 4.7 Showdown Home is a product hub, not merely navigation

When offered a direct jump into Season data entry versus a dedicated Showdown Home after club reveal, the owner chose the dedicated hub.

The reason is experiential:

- give the rivalry an identity;
- show club pairing / current Season / current score;
- provide a ceremonial return point between Seasons;
- make the site feel like a game companion rather than a spreadsheet wizard.

This supports a deeper product conclusion used later in this handoff: **immersion is functional value in this project.**

### 4.8 Current one-device mode and future QR mode were intentionally separated from the beginning

The owner explicitly selected:

- current Version 1-style mode: two managers together on one browser/device;
- future direction: QR-assisted second-device participation.

The owner did not authorize dragging backend/sync complexity into the original one-device version.

That early decision is still visible in the current roadmap: QR/two-device work remains far downstream after local recovery, profiles/identity, cloud readiness and remote reliability.

### 4.9 FUT-style club reveal is not random visual garnish

The owner repeatedly rejected a basic club selection presentation and wanted sealed packs/opening suspense.

The accepted concept matured toward:

- chosen league already persisted;
- Pack 1 reveal for Manager 1;
- suspense;
- Pack 2 reveal for Manager 2;
- rivalry confirmation;
- no re-randomization caused by replaying animation.

The critical invariant is that the ceremony visualizes an already committed assignment; animation is not itself the randomness authority.

### 4.10 Performance discipline became an owner priority before v1

During August 8–9 the owner repeatedly paused feature growth to request:

- bug-fix-only builds;
- lower lag during data entry;
- lighter runtime without sacrificing existing features;
- cleanup of duplicated/dead code;
- preservation of soundtrack/media features without making them eager/heavy;
- repeated performance re-evaluation before adding more roadmap work.

Therefore current raw/gzip budgets and lazy-media rules are not arbitrary test trivia. They implement an owner-level product expectation: **the application should feel immediate even as it becomes richer.**

### 4.11 Chromebook/windowed desktop became a first-class target through owner evidence

The owner explicitly observed that some versions looked good on mobile but poor on Chromebook Chrome, with overlap and weak media/menu placement.

This is why “responsive” in this project must never mean “phone and wide desktop only.” Windowed laptop/Chromebook widths and low-height viewports are first-class acceptance surfaces.

### 4.12 The anti-loop / handoff philosophy originated in this environment

As the first conversation approached maximum length, the owner had already experienced:

- repeated planning loops;
- risk of new chats misunderstanding the accumulated design;
- loss of continuity when only a giant ad-hoc Project Bible was transferred;
- the need to preserve accepted decisions while continuing implementation rather than restarting architecture.

The owner repeatedly asked for a Project Bible / consolidated handoff and later praised the assistant for returning to the original roadmap instead of staying trapped in temporary patch loops.

This is the direct historical lineage of today’s `00_HANDOFF_GOLDEN_RULE.md`.

The golden rule should therefore be understood as **a reliability mechanism born from actual context-loss incidents**, not documentation overhead.

## 5. Career Mode Showdown Dev — recovered maturation into release engineering

The second major environment starts with an explicit continuation command: inspect current GitHub `main`, use `NEXT_TASK.md`, preserve accepted decisions, and continue in the same style.

### 5.1 Browser-first became a standing acceptance principle

The owner repeatedly instructed the developer to:

- live-test the website;
- test in a real browser before shipping;
- troubleshoot routes and modules rather than relying only on static reasoning;
- use a virtual/other browser if the normal browser connection was unavailable;
- merge/deploy only after checks passed.

This evolved into current Playwright/Chromium and deployed-site smoke architecture.

### 5.2 The owner explicitly authorized repository execution rather than chat-only delivery

During r12/r13 work, the owner repeatedly asked for push → PR → checks → merge → deploy → live verification.

This reinforced the shift from “assistant produces code for owner to paste” to “developer owns the GitHub implementation/release transaction.”

Do not confuse that standing workflow preference with permission to bypass GitHub’s actual authentication/branch-protection boundaries. Tool access still has to be genuinely available and expected-head protections still matter.

### 5.3 The post-v1 roadmap was deliberately planned as a dependency chain

The owner asked for a highly detailed planning phase that blended already proposed and potential post-v1 work in the **correct order**.

The important insight from the historical chat is that the long roadmap is not a pile of aspirational features. Its primary job is **dependency control**.

That is why the eventual sequence puts:

local recovery → installability → local identities/save registry → richer history/analytics/content → cloud readiness → cloud backup → paired devices → connected rivalry → private sharing → conditional public community.

### 5.4 Reus/loading request establishes that ceremonial presentation is protected product value

The owner supplied a Chromebook screenshot and requested two v1-stable-release priorities:

- materially improve Main Menu scale/layout/classiness;
- restore a cinematic pre-menu loading presentation inspired by FIFA 17 but implemented with original/licensed material and a large Marco Reus image.

Later the owner asked to hold the loading screen slightly longer because the immersion effect was worth preserving.

This is why a future developer must not dismiss startup presentation as expendable “decoration” when optimizing bytes. It is a deliberately accepted part of the product experience; optimize its implementation, not its existence.

### 5.5 External critique was welcomed but required pushback

The owner brought an earlier Grok critique into this chat and explicitly asked the developer to extract valid criticism, reject shallow assumptions, refine the development plan, and continue building.

This established an important review culture:

- outside critique is useful for discovering risk categories;
- it does not become source authority;
- generic advice such as “rewrite in a framework” must be tested against current architecture and evidence;
- valid risk categories should be converted into finite, measurable gates rather than vague rewrites.

That process led to the v1.0.1 Stability Lane rather than an unnecessary framework migration.

### 5.6 Stability work converted generic concerns into repository-owned evidence

The mature response to maintainability/accessibility/edge-case criticism was not to announce “more robust code.” It was to create repeatable evidence:

- deterministic contracts;
- pinned browser tooling;
- consecutive browser cycles;
- corrupt-storage fixtures;
- quota rollback;
- rapid activation / double-submit checks;
- route/back/reload coverage;
- accessibility scans;
- exact deployed-byte verification;
- public-site journey.

This is a central project pattern worth preserving:

**Turn criticism into a concrete failure model and a permanent gate.**

### 5.7 Reus regression proved that “opacity” can be the wrong failure model

The historical visual debugging went through multiple hypotheses:

- disabled tile state washed the full tile;
- pale pseudo-element overlays simulated transparency despite image opacity 1;
- owner screenshots then showed that later Reus problems were actually sharpness/crop/responsive composition issues, especially windowed DPR1 versus mobile DPR2.

The owner explicitly pushed back when an opacity-only diagnosis made the image worse.

Lesson:

**Do not keep optimizing the first diagnosis after owner evidence contradicts it. Reclassify the defect.**

## 6. Master Development Continuation — recovered context-repair intent

This conversation began because Work usage/context continuity had been interrupted.

### 6.1 Owner expectation: same project quality across environment changes

The owner’s concern was not merely whether another chat technically had access. The concern was whether project quality would materially degrade when leaving the previous Work environment.

That matters because the correct response is not reassurance alone; it is stronger source-grounded continuation discipline.

### 6.2 Reus screenshots forced a broader root-cause rethink

The owner first requested continuation of the Reus/Main Menu/loading repair, then supplied screenshots and explicitly said the current route had made Reus more pixelated, unnatural and poorly blended.

The owner also reminded the developer that the previous environment’s request was broader than Reus: licensed Rashford, Martial, James, Messi and trophy imagery were part of the same visual-immersion direction.

The assistant correctly changed the failure model from “opacity” to source/crop/physical-pixel/responsive-composition analysis.

### 6.3 The owner explicitly required roadmap recovery before more feature work

The owner asked for the latest roadmap from the prior Work environment to be studied and integrated before continuing.

The repository roadmap was recovered and the visual correction lane was kept finite so it would not displace the long-term dependency chain.

### 6.4 This 2026-08-12 deep-dive completes a task that conversation could not finish

Near the end of Master Development Continuation, the owner explicitly asked the assistant to study from start to finish every relevant message in:

- `Website Creation and Guide`;
- `Career Mode Showdown Dev`.

The assistant correctly refused to pretend it had full title-based access to locked chats and instead advised obtaining the official ChatGPT account export.

The owner then asked how to retrieve those maximum-length conversations.

**The present 2026-08-12 research pass is the completion of that deferred context-recovery task.**

That is one reason this new master handoff should be preserved permanently: the owner invested effort specifically to repair a historical context gap that repository summaries alone could not fully explain.

## 7. Project r4 Visual Fixes — reconstruction from repository evidence

Because the raw r4 chat is absent from the Aug 10 export, this section relies on repository evidence rather than invented transcript chronology.

### 7.1 r3 taught the project that automated image metrics can still approve bad art direction

`AI_DEVELOPER_AUDIT_2026-08-10_VISUAL_REGRESSION.md` records a major incident: PR #9 was technically green, including real browser/deployed checks, yet owner iPhone screenshots showed unacceptable James/Rashford/Martial crops.

The critical conclusion in that incident record is explicit:

- the browser jobs genuinely ran;
- the problem was not “CI was skipped”;
- the visual acceptance contract was inadequate;
- developer/manual review had been too permissive;
- owner visual acceptance must remain separate from automated QA.

This distinction is now permanent project doctrine.

### 7.2 r4 was a recovery build, not the final player-photo authority

The later master continuation handoff records:

- PR #10 r4 visual recovery merged at `45372873569920b8aaeb366926d9047aeb5a3638`;
- r4 corrected the r3 regression and preserved Marco Reus;
- r4 was technically green;
- the owner nevertheless later rejected the r4 James Rodríguez, Marcus Rashford and Anthony Martial pictures and asked for **new source pictures with intelligent crops**.

Therefore do not interpret “r4 green” as “r4 owner-approved photography.”

### 7.3 r4/r5 created the authored-derivative rule

The mature image pipeline became:

1. select an appropriately licensed source;
2. inspect the subject at actual destination proportions;
3. author the crop in source pixels into a local derivative;
4. record source/license/crop/dimensions/fingerprints;
5. render the entire finished derivative with `object-fit: contain`;
6. do **not** apply a second blind responsive `cover` crop;
7. tune the media-stage geometry around the derivative instead of cutting it again.

This rule is one of the strongest concrete lessons from the r3 → r4 → r5 sequence.

### 7.4 Source selection itself is an art-direction task

The r5 handoff records that early Rashford/Martial candidate sources were deliberately rejected before being forced into the UI. Contact sheets/crop candidates were reviewed, and a later 2017 Rashford source replaced an intermediate 2016 candidate because his face and Manchester United identity read more strongly at actual Transfer Challenge sizes.

Lesson:

A high-resolution, correctly licensed image is not automatically a good UI source. Subject dominance, era/context, competing people, facial readability and target-screen scale all matter.

### 7.5 Clean-anchor architecture came from owner Chromebook evidence

v1.0.2 later converted another set of owner screenshots into a durable visual rule:

- James was washed by a light overlay;
- Rashford had diagonal geometry crossing his face;
- desktop Reus had an unattractive diagonal head/neck integration;
- loading screen was explicitly liked and protected.

The architecture moved from:

`graphics over photograph`

to:

`photograph as clean anchor; graphics behind/beside it`.

This is not generic design fashion. It is a direct response to reproduced owner defects and a supplied FIFA 17 reference principle.

### 7.6 Never weaken a visual threshold to make a candidate pass

The v1.0.2 handoff records a concrete example: first clean-anchor James near-breakpoint occupancy was only 54.6%. The gate failed. The threshold was **not** reduced; the composition itself was retuned.

That is the correct project behavior:

- classify whether the failure is real or stale authority;
- if real, improve product composition;
- if stale, update the stale assertion without changing unrelated behavior;
- never lower a meaningful quality floor simply to get green CI.

## 8. Supersession map — historical ideas a new developer must not revive

| Historical statement/idea | Current authority | Status / reason |
| --- | --- | --- |
| Clubs/league could change each round/Season | One selected league + two different permanent clubs for entire Showdown | Explicit owner correction; locked in current model |
| 100 points + 100 goals could award two points | The pair has shared maximum +1 | Old assistant error; current max-11 scoring wins |
| Top Scorer + Top Assist could award two points | The pair has shared maximum +1 | Old assistant error; current max-11 scoring wins |
| “Unlimited” Showdown length | 1 / 3 / 5 / 10 only | Old brainstorm, not current product |
| Six separate wheel pages/components | One reusable League Wheel flow + deterministic club assignment/reveal | Architecture simplified; do not recreate duplication |
| Guess + Signing on one form | Ordered Guess Entry → lock → Signing Entry → lock → verdict | Explicit owner future-privacy requirement |
| Free-text league/nationality guesses | Canonical selectors/datasets | Reduces spelling/accent mismatch; supports future privacy flow |
| Generic initials/two-color club identity as final UI | Procedural/original club identity direction | Generic system was interim; proprietary crests remain excluded by default |
| QR/two-device should arrive early | v2.0 only after recovery/identity/cloud-readiness gates | Explicitly deferred from current one-device product |
| Old r3/r4 player images are acceptable because CI passed | Current manifest/source authority only | Owner rejected earlier art direction; CI != owner acceptance |
| Responsive `cover` can finish portrait crops | Authored local derivative + runtime `contain` | r3/r4/r5 evidence rejects secondary blind crop |
| A framework rewrite is the natural “professional” next step | No framework rewrite without evidence | Current modular vanilla JS fits product/deployment model |
| Candidate B preview can be treated as restore authorization | Candidate C must revalidate immediately before apply | Preview is explicitly read-only and potentially stale |

## 9. Deepened product understanding from the historical evidence

### 9.1 The product is a ritualized rivalry companion, not a CRUD tracker

Its value is not only storing numbers. It deliberately turns a two-player FIFA 17 competition into a sequence of moments:

loading atmosphere → entering the rivalry → League Wheel → explicit selection checkpoint → sealed club reveal → rivalry confirmation → Showdown Home → private Transfer Challenge ritual → Season Review → summary/history.

Removing those moments because they are “not strictly required for data entry” would misunderstand the product.

### 9.2 Immersion and performance are simultaneous requirements

The owner wants:

- cinematic presentation;
- football photography;
- music/media options;
- FIFA 17-era visual rhythm;

**and**

- a light initial shell;
- low data-entry lag;
- no unnecessary eager media;
- no duplicate/dead logic;
- strong Chromebook performance.

The engineering answer is not to choose one side. It is route-scoped/lazy presentation, bounded startup bytes, and explicit performance gates.

### 9.3 Planning is an implementation accelerator in this project

Historical work shows the owner’s detailed planning prevents expensive dependency mistakes:

- privacy-aware Transfer phases before networking;
- recovery before save-registry migration;
- stable identity before cloud conflict handling;
- cloud readiness before remote backup;
- remote reliability before two-device rivalry;
- verification/moderation decision before public rankings.

The roadmap should therefore be used as a dependency graph, not as ceremony or a frozen feature wishlist.

### 9.4 The project’s strongest pattern is converting failure into permanent structure

Examples:

- partial-edit confusion → complete-file/direct-GitHub implementation;
- context-limit loss → public continuous handoff;
- auto-advance after wheel → explicit persisted League confirmation checkpoint;
- state/route bugs → centralized `screens.js` authority;
- localStorage drift → centralized `storage.js` authority;
- bad responsive crops → authored derivative + `contain`;
- image overlays across faces → clean-anchor layering;
- generic external maintainability critique → finite Stability Lane with reproducible tests;
- future migration risk → Candidate A/B/C separation.

A future developer should keep using this pattern: reproduce, classify, fix the root, then encode the lesson into a bounded contract/gate when justified.

## 10. Current-source implications for Candidate C discovered during this deep-dive

The current live source reinforces the roadmap rather than contradicting it.

### 10.1 `js/storage.js` already exposes the right starting primitives

Current storage authority includes:

- raw-value read/write/remove wrappers;
- `captureCareerModeRawBackupInputs()` for exact current raw inputs;
- `flushPendingApplicationWrites()` covering Transfer draft flush + scheduled active-save flush;
- active-save presence cache;
- Legacy cache/revision tracking;
- application-preferences cache;
- current transactional rollback examples in destructive Legacy/data-reset operations;
- malformed bytes preserved by failing parse rather than silently erasing storage.

Candidate C should extend this authority with a purpose-built atomic restore transaction rather than reimplementing localStorage calls inside `legacy.js` or a new restore module.

### 10.2 Candidate A envelope semantics are intentionally independent of migration authority

`js/backup.js` currently defines:

- `formatId: "career-mode-showdown-backup"`;
- format version 1;
- SHA-256 deterministic checksum;
- app/runtime provenance metadata;
- payload + counts + relationships + storage state + warnings + recovery;
- corrupt raw records preserved in recovery metadata;
- canonicalization hardened with null-prototype accumulator;
- export/download path with no canonical storage mutation.

Candidate C must consume this format through the Candidate B validation path; it should not invent a second looser parser.

### 10.3 Candidate B already contains the migration/validation registry Candidate C should reuse

`js/importAnalysis.js` currently owns:

- 5 MiB file ceiling;
- forbidden hostile keys;
- maximum nesting/structure limits;
- Showdown schema 1 → 2 migration;
- preferences schema 1 → 2 migration;
- migration non-mutation and ordered-step checks;
- future-schema fail-closed behavior;
- current schema validation;
- string Showdown IDs for conflict comparison;
- local-current comparison state;
- envelope/text/file analysis entrypoints.

It deliberately returns `readyForRestore: false` even when analysis status is `ready`.

Candidate C therefore needs a **new apply-readiness layer after fresh revalidation and explicit user choices**. It must not simply flip Candidate B’s flag or mutate Candidate B into a writer.

## 11. Deep-dive log — checkpoint after historical recovery

Completed by this checkpoint:

- current `main` and v1.1.3 runtime authority frozen in this handoff;
- public research branch created before analysis;
- exact three relevant conversations recovered from official ChatGPT export;
- raw-export limitation for later Project r4 conversation explicitly recorded;
- early product/scoring/club/Transfer/navigation/performance decisions recovered;
- anti-loop/handoff lineage recovered;
- browser-first/release-engineering lineage recovered;
- Master Development Continuation’s deferred export-study task identified and now completed in substance;
- r3/r4/r5/v1.0.2 visual failure chain reconstructed from repository records;
- historical contradictions converted into a supersession map;
- live `storage.js`, `backup.js`, and `importAnalysis.js` inspected against Candidate C roadmap assumptions.

Still pending before this handoff is final:

- deeper review of post-v1 roadmap continuation records and release handoffs to sharpen future milestone operating constraints;
- Grok critique synthesis with explicit accepted lessons and pushback;
- current Legacy/Data Management/optional-module/route integration review for Candidate C UI placement;
- final next-developer Candidate C operating protocol;
- add this master handoff to canonical developer discoverability docs without bloating the normal 60-second bootstrap;
- docs-only PR validation/merge and final continuity seal.
