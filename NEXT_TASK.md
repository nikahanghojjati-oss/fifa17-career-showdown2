# NEXT TASK

## Current gate: v0.95.0-r3 browser acceptance

Stay on **v0.95 Workstream 1A** until the owner has browser-tested the deployed `0.95.0-r3` visual-consistency build.

**Application version:** v0.95.0  
**Deployed asset revision:** `0.95.0-r3`  
**Current implementation:** r3 Rule Book / optional-screen contrast polish + r2 Club Reveal geometry/motion  
**New owner-approved roadmap additions:** recorded in `ROADMAP_AMENDMENTS.md`

The owner has added several requirements to the roadmap. They are approved requirements but are **not yet implemented merely because they are documented**.

Do not jump directly to Settings after r3 acceptance. The revised order is now:

**Workstream 1A current browser gate  
→ Workstream 1B FIFA 17 presentation + Club Reveal identity polish  
→ Workstream 2 Transfer Challenge phase/data foundation  
→ Workstream 3 Settings  
→ Workstream 4 Main Menu Statistics alignment  
→ Workstream 5 Season pre-commit review  
→ Workstream 6 final v0.95 regression/polish  
→ v1.0**

---

# Current r3 acceptance checklist

Hard refresh once before testing so the browser receives `0.95.0-r3` lazy styles.

## Startup / Home

Expected:

- no red application-integrity warning;
- Home remains responsive and stable;
- Continue / New Showdown / media controls work;
- no Chromebook Home overlap regression.

## Rule Book

Expected:

- dark hero clearly separated from light rule cards;
- readable white/cyan hero hierarchy;
- dark section headings and body copy on light cards;
- scoring rows are easy to scan;
- +5 / +3 / +1 values are clearly readable;
- maximum `11` is unmistakable;
- no pale/white text disappears on light backgrounds;
- two-column desktop layout and single-column narrow layout remain clean.

## Trophy Room / Rivalry Statistics / Legacy

Expected:

- light cards use readable dark text;
- intentionally dark presentation/history panels remain readable;
- long names wrap safely;
- career standings do not expand the whole page horizontally;
- Legacy Data Management copy is readable;
- Chromebook/mobile density remains usable.

## Club Reveal r2 regression

Expected:

- both cards remain equal width/height;
- no rejected white sweep;
- no skew/jerky resizing;
- Manager 1 → Manager 2 → VS → confirmation sequence remains finite;
- same saved pair survives refresh + Continue before confirmation;
- no reroll path;
- confirmation opens Showdown Home with the same pair.

## Core smoke regression

- Transfer Challenge opens/resumes;
- transfer drafts persist;
- Season Results open after completed transfers;
- scoring remains max-11;
- Season Summary works;
- Back and Continue remain state-safe;
- optional screens return through legal navigation paths.

If r3 has a defect, fix that root cause before Workstream 1B. Do not use an r3 regression fix to mix in unrelated feature work.

---

# Workstream 1B — FIFA 17 presentation + Club Reveal identity polish

Begin immediately after r3 acceptance.

This workstream groups the new visual requirements because they affect the same Home/Club Reveal visual system and should be accepted together rather than reopening it repeatedly.

## 1. Typography / font hierarchy

Improve fonts and text styling, especially Home/Main Menu, to materially resemble the FIFA 17 era while remaining copyright-safe.

Requirements:

- do not bundle proprietary EA/FIFA font files;
- evaluate a safely licensed condensed/geometric display face and strong fallbacks;
- current research candidate: Barlow Condensed or a comparable OFL font;
- do not replace every body/form font automatically;
- use the display face where it improves menu tiles, page titles, major numbers/scores, headings and compact football-game metadata;
- tune size/weight/letter-spacing/line-height/casing together;
- verify contrast, clipping, wrapping and loading fallback on Chromebook/mobile;
- preserve startup/performance discipline and visible text during font loading.

## 2. Original per-club crest identity

Replace the current generic two-color/initials presentation with an original deterministic crest/emblem system for every club in the existing five-league Showdown pool.

Preferred direction:

- original procedural/custom crests rather than official badges;
- multiple crest geometries, patterns and original motifs;
- club-specific palettes;
- optional monogram only as a supporting detail;
- deterministic identity across Reveal, Dashboard, Transfer, Season, Summary and other club surfaces;
- CSS/inline-SVG/data-driven implementation preferred over a large image bundle;
- official club badges are not assumed safe merely because an image is publicly visible.

Acceptance: two clubs should be visually distinguishable before their names are read.

## 3. Two-pack suspense reveal

Upgrade the current sealed-card reveal into two equal Showdown packs/parcels that open sequentially.

Required sequence:

**pair saved atomically  
→ closed Pack 1 + Pack 2  
→ Pack 1 opens / Manager 1 club revealed  
→ short suspense beat  
→ Pack 2 opens / Manager 2 club revealed  
→ VS presentation  
→ explicit rivalry confirmation**

Preserve:

- pair generated only once;
- persistence before theatrical reveal;
- rollback on failed save;
- no reroll after save;
- finite/cancellable animation;
- no looping idle animation;
- no rejected white sweep;
- no skewed/resizing Chromebook geometry;
- reduced-motion path with the same information and confirmation requirement.

Target feel: a few seconds of deliberate suspense, not instant and not annoyingly long.

## Workstream 1B validation

Add deterministic checks where possible for:

- no proprietary/local FIFA font dependency;
- valid fallback typography contract;
- crest identity determinism;
- every existing top-five club has a valid custom identity;
- reveal stage order/timers remain finite;
- assignment remains persisted before reveal;
- no-reroll and confirmation recovery remain intact;
- Chromebook/mobile layout guards.

Then bump the asset revision, validate exact head, deploy Pages and require owner browser acceptance.

---

# Workstream 2 — Transfer Challenge phase + canonical FIFA 17 data foundation

This new workstream now occurs **before Settings** because it changes a core gameplay workflow and creates the correct foundation for future private/two-device entry.

Current source already stores `signings` and `guesses` separately, but the post-window UI records both together. The new flow must separate them without discarding the existing model.

## Target flow

**15-minute transfer window  
→ Opponent Guess Entry screen/phase  
→ lock/persist guesses  
→ Signing Entry screen/phase  
→ lock/persist signings  
→ evaluate release matches  
→ Transfer Results  
→ Season Results**

Guesses come **before** signings so the workflow can later be made private on two devices without redesigning the Transfer Challenge again.

Version 1.0 itself remains one-device/browser.

## Existing rules remain locked

- 15-minute transfer window;
- maximum 3 signings per manager;
- 3 opponent guesses;
- each guess is league or nationality;
- correctly guessed signing must be released.

Do not create an additional guess timer unless the owner explicitly requests a new timing rule. The existing 15-minute timer remains the transfer-window timer.

## Backward compatibility

- existing active saves must survive;
- old `recording` challenges require a safe migration/compatibility path;
- prefer an explicit transfer sub-phase over duplicate challenge objects;
- phase transitions are critical saves;
- failed critical save blocks/rolls back the transition;
- draft persistence remains debounced/deduplicated;
- canonical routing/Continue/Back must understand the new sub-phase.

## Complete former-league data

The current main Showdown league database contains only the five selectable rivalry leagues. Do **not** expand that wheel.

Add a separate Transfer Challenge league dataset covering the FIFA 17 domestic competitions represented in the historical game database, including lower divisions where FIFA 17 contained them.

Data design should include:

- canonical ID;
- FIFA-17-era display name;
- country;
- tier/division when applicable;
- grouping metadata;
- deliberate Rest of World / Other fallback where needed.

Historical reference checking must be completed before release; do not rely on memory for the final list.

## Complete player-nationality data

Do not confuse player nationalities with playable national teams.

The Transfer Challenge nationality selector must contain every nationality represented by FIFA 17 players, using a FIFA 17 player/nations database and a second historical source for cross-checking.

Canonicalize accents and naming variants so evaluation does not depend on free-text spelling.

## Smart selectors

Signing Entry:

- Player Name — text input;
- Previous League — controlled searchable dropdown;
- Nationality — controlled searchable dropdown.

Guess Entry:

- Guess Type — League or Nationality;
- Guess Value — controlled searchable dropdown from the corresponding dataset.

The selector must be built for phone and Chromebook use:

- fast filtering;
- large touch targets;
- keyboard navigation;
- visible focus;
- ARIA/screen-reader labeling;
- no viewport overflow;
- scrollable constrained menu;
- graceful fallback if enhancement fails;
- no heavy third-party UI library.

Store/compare canonical values rather than arbitrary strings.

## Workstream 2 validation

Add tests for:

- migration/resume of old transfer states;
- Guess → Signing phase order;
- critical save rollback;
- Back/Continue state safety;
- complete/canonical league and nationality options;
- dropdown type/value coupling;
- accent/spelling-safe evaluation;
- existing transfer verdict behavior;
- mobile/Chromebook overflow guards.

---

# Workstream 3 — Settings blueprint alignment

Implement the small Settings surface from the original screen plan using current architecture.

Appropriate scope:

- application information;
- animation/reduced-motion preference if useful;
- existing safe data-management access.

No accounts/cloud/online systems.

---

# Workstream 4 — Main Menu Statistics alignment

Expose cumulative Statistics appropriately from Main Menu by reusing existing analytics/Trophy Room/Rivalry Statistics engines.

Do not create a duplicate analytics engine.

---

# Workstream 5 — Season pre-commit review

Inspect Complete Season UX and add a lightweight review/confirmation before irreversible season completion if no equivalent safeguard exists.

Completed historical seasons remain read-only.

---

# Workstream 6 — final v0.95 release polish

- cross-screen typography/contrast consistency;
- accessibility and focus behavior;
- responsive Chromebook/mobile acceptance;
- feedback/transitions;
- performance/startup discipline;
- full persistence/navigation/gameplay regression;
- documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.

---

# Post-v1.0 direction

Two-device/private-manager play may build on the separated Transfer Challenge phases after v1.0.

Do not pull backend/accounts/realtime pairing into v1.0 merely because Workstream 2 prepares the UI/state boundaries for it.

---

# Permanent non-regression contracts

- top-five league pool remains the Showdown assignment pool;
- full FIFA 17 leagues are Transfer Challenge metadata, not new wheel choices;
- max-11 scoring remains locked;
- equal non-zero scores remain draws;
- only 0-0 uses league position then league points;
- one permanent same-league/different-club pair per showdown;
- no reroll after club save;
- critical persistence rollback remains;
- centralized navigation authority remains in `screens.js`;
- lazy-loading/startup limits remain first-class;
- no copied EA/FUT artwork or proprietary FIFA font files;
- official club badges are not the default identity solution;
- mobile and Chromebook support remain first-class.
