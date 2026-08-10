# ROADMAP AMENDMENTS — Owner-Approved v0.95 / Post-v1.0 Direction

This document records explicit owner-requested additions made after `v0.95.0-r3`.

These are **approved roadmap requirements**, not proof that the features are already implemented. Current source remains the authority for implemented behavior.

The additions must be integrated into the existing finite `v0.95 → v1.0` roadmap without restarting architecture or creating planning loops.

The deployed r12 maintenance build preserves that finite roadmap. The owner subsequently made the visual requirements below mandatory before v1.0.0; r13 implements them without adding gameplay scope, persistence schema or routes.

---

# 0. V1 Home + startup visual immersion — mandatory r13 gate

## Owner request

The deployed r12 Home/Main Menu looked too small, flat and unappealing in the owner's 1920 × 1080 Chromebook screenshot. The owner also required the earlier pre-menu loading presentation to return as a much stronger, football-game-style startup with a large Marco Reus image.

These are not post-v1 ideas. They are explicit v1 stable-release blockers.

## Home requirements

- materially increase useful desktop scale and height while remaining responsive on other devices;
- use a classy original metallic palette influenced by FIFA 17-era menus without copying the reference byte-for-byte;
- strengthen tile hierarchy, type scale, spacing, bevel/detail and active/hover/focus feedback;
- optimize for the supplied Chromebook viewport without introducing device-specific breakage;
- preserve every existing tile, route, lazy module, media choice and persistence behavior;
- reject horizontal overflow, clipped labels and unreadable low-contrast metallic text.

## Startup requirements

- restore a cosmetic loading presentation before Home;
- use a large, correctly cropped, royalty-compatible Marco Reus photograph;
- create an original project mark/title and composition heavily influenced by the reference's cinematic balance but not its official logos, artwork or exact layout;
- require no user action and introduce no gameplay function;
- remain brief, finite, accessible and substantially shortened under reduced motion;
- keep the application inert and out of the accessibility tree until the presentation exits;
- license, attribute and locally optimize the photo so startup does not depend on a remote image service.

## Implemented r13 interpretation

- 1510 px proportional desktop canvas with low-height, tablet, mobile and small-mobile breakpoints;
- metallic blue / brushed silver / graphite Home hierarchy with original yellow/cyan project accents;
- 1900 ms normal-motion and 220 ms reduced-motion startup minimums, plus a bounded 240 ms exit;
- original `CM17` roundel and Career Mode Showdown title treatment;
- locally bundled 900 × 1520 WebP derived from Tim Reckmann's CC BY 2.0 Wikimedia Commons photograph;
- same cached portrait reused on the Home career tile;
- exact r13 static, full-flow, accessibility and four-viewport browser gates.

## Acceptance

The owner must inspect the deployed exact candidate on the target Chromebook. If accepted, seal the same behavior as v1.0.0 without opening another pre-v1 feature branch.

---

# 1. FIFA 17 typography and text styling — v0.95 Workstream 1B

## Goal

Make the interface, especially Home/Main Menu, feel materially closer to FIFA 17 through typography, spacing, weight, casing and text hierarchy while preserving readability and copyright safety.

## Requirements

- Do **not** use or bundle a proprietary EA/FIFA typeface without clear permission.
- Prefer an open-source or otherwise safely licensed condensed/geometric sans that produces a similar mid-2010s football-game feel.
- Current research candidates include Barlow Condensed / comparable OFL alternatives; final selection must be visually tested before being locked.
- Do not mechanically replace every font in the application.
- Use the FIFA-like display face where it improves:
  - Main Menu tile labels;
  - page/screen titles;
  - major scores and numeric values;
  - navigation labels;
  - reveal/competition headings;
  - compact metadata/eyebrows where legible.
- Keep highly readable UI/body/form typography where a condensed display face would hurt comprehension.
- Tune font weight, letter spacing, line height and casing together rather than changing only `font-family`.
- Re-check contrast after every typography change because different weights/widths materially change perceived contrast.
- No clipped labels, overflowing names, unreadable tiny text or font-dependent layout jumps on Chromebook or mobile.
- Font loading must not destroy the current startup/performance contract; use fallback-first behavior and avoid a blank-text flash.
- Reduced-motion behavior is unaffected.

## Acceptance

Typography should feel closer to FIFA 17 at a glance while remaining cleaner and more readable than a literal imitation.

---

# 2. Original club crest/identity system — v0.95 Workstream 1B

## Goal

Replace the current generic two-color / initials treatment with a materially more individual identity for every club in the existing Showdown pool.

Current implementation generates a palette and initials from the club name. That was an acceptable copyright-safe placeholder, but it is no longer the final visual target.

## Chosen direction

Default implementation direction is **original custom club emblems**, not copied official badges.

Do not assume that an official club badge is safe merely because an image is visible on Wikimedia or another public site. Club crests may carry copyright and trademark restrictions.

## Requirements

- Every club in the current five-league FIFA-17-era Showdown pool receives a deterministic, recognizable custom identity.
- The identity should include more than two colors plus letters.
- Prefer a lightweight procedural/original crest system using combinations of:
  - shield/roundel/diamond geometry;
  - stripe/half/chevron/quadrant patterns;
  - original abstract football symbols;
  - stars/crowns/wings/towers/animals or other generic motifs only when rendered as original artwork;
  - club-specific palette information;
  - optional short monogram as a supporting detail rather than the whole badge.
- The same club must always render the same crest across Club Reveal, Showdown Home, Transfer Challenge, Season screens, Summary and history/statistics surfaces where club identity is shown.
- Crest generation must remain deterministic, fast and dependency-free.
- Avoid dozens of downloaded image assets if the same result can be created with CSS/inline SVG data.
- If separately licensed public-domain/Creative-Commons artwork is ever used, record attribution/license requirements explicitly and do not mix it silently with proprietary official badges.

## Acceptance

Two randomly selected clubs should look visually distinct even before reading their names.

---

# 3. Two-pack suspenseful Club Reveal — v0.95 Workstream 1B

## Goal

Upgrade Club Assignment from sealed cards into two visually convincing packs/parcels that open sequentially and reveal the permanent clubs with suspense.

## Locked integrity rules

The visual upgrade must **not** change the existing assignment transaction:

1. choose one valid same-league/different-club pair once;
2. set the confirmation-pending state;
3. persist the pair before theatrical reveal;
4. roll back if persistence fails;
5. never reroll because an animation is replayed or interrupted;
6. explicit rivalry confirmation remains mandatory.

## Presentation requirements

- Present two closed Showdown packs/parcels of equal visual importance.
- Manager 1 pack opens first.
- Club identity/name is revealed.
- Brief suspense beat.
- Manager 2 pack opens second.
- Club identity/name is revealed.
- Then transition into the central VS / rivalry confirmation tableau.
- Target total reveal should feel deliberate — roughly a few seconds, not instant and not frustratingly long.
- Use finite CSS/DOM animation; no canvas/WebGL/video dependency is required.
- No looping animation while idle.
- No white sweep effect from the rejected r1 reveal.
- No card-size jumping or skewed Chromebook geometry.
- A reduced-motion path must reveal the exact same information without theatrical delay.
- Leaving/resetting/replacing the showdown invalidates stale reveal callbacks exactly as today.

---

# 4. Transfer Challenge phase separation — v0.95 Workstream 2

## Why this moves ahead of Settings

The current engine stores signings and guesses separately, but presents them together on one post-window recording screen. That is acceptable for the original one-device prototype but is poor separation for future private two-device entry.

The owner has explicitly required the workflow to become separate screens/phases **before** any later two-device architecture.

This is therefore a v0.95 core UX/state-machine refinement, not a post-v1.0 afterthought.

## Target flow

Transfer Challenge  
→ 15-minute transfer window  
→ **Opponent Guess Entry**  
→ lock/persist guesses  
→ **Signing Entry**  
→ lock/persist signings  
→ evaluate matches/release verdicts  
→ Transfer Results  
→ Season Results

The 15-minute rule itself remains unchanged unless the owner later explicitly changes it.

## Privacy/future-device principle

Guess data and signing data must be separable at the UI/state level so a future two-device implementation can show only the appropriate private phase to each manager without redesigning the transfer model again.

Version 1.0 remains one-device/browser. This work is only the architectural UX foundation.

## Backward compatibility

- Existing saves using the current `recording` state must continue safely.
- Do not invalidate active showdowns simply because a new entry phase is introduced.
- Prefer a small explicit phase field/state extension over duplicating Transfer Challenge objects.
- Critical phase transitions must save immediately and roll back/block navigation on failure.
- Draft persistence remains debounced/deduplicated.
- Back/Continue canonical routing must understand the active transfer sub-phase.

---

# 5. Complete FIFA 17 transfer league + nationality datasets — v0.95 Workstream 2

## Scope distinction

This requirement does **not** expand the Showdown League Wheel beyond its locked top-five-league pool.

The full historical dataset is specifically for Transfer Challenge metadata and guesses:

- signing's **former league**;
- signing's **nationality**;
- opponent guess values.

## League dataset

Research identifies the FIFA 17 club database as containing the full domestic competition set across Argentina, Australia, Austria, Belgium, Brazil, Chile, Colombia, Denmark, England, France, Germany, Netherlands, Italy, Japan, Korea, Mexico, Norway, Poland, Portugal, Republic of Ireland, Russia, Saudi Arabia, Scotland, Spain, Sweden, Switzerland, Turkey and MLS, including the lower divisions represented in England, France, Germany, Italy and Spain.

Implementation target:

- canonical FIFA-17-era league IDs;
- FIFA-17-era display names;
- country grouping;
- division/tier metadata where applicable;
- all actual domestic league competitions represented by FIFA 17;
- a deliberate `Rest of World / Other` fallback only where a player's club was outside a normal league category.

The dataset must be cross-checked against at least two historical FIFA 17 references before release.

## Nationality dataset

Do **not** use only the list of playable men's national teams. FIFA 17 contains players from many more nationalities than the national-team selection screen.

Implementation target is every nationality represented by FIFA 17 players, using a FIFA 17 player/nation database as the canonical research source and a second historical source for cross-checking.

Canonical values must handle accents and naming variants consistently so guess evaluation does not fail because of spelling differences.

---

# 6. Smart responsive league/nationality selectors — v0.95 Workstream 2

## Goal

Replace free-typed previous-league and nationality metadata with fast, controlled selection.

## Signing Entry

For every recorded signing:

- player name remains text entry;
- previous league becomes a controlled FIFA 17 league selector;
- nationality becomes a controlled FIFA 17 nationality selector.

## Guess Entry

Each guess remains one of two types:

- League
- Nationality

After the type is chosen, the value control must show the corresponding canonical dataset rather than a free-text field.

## UX contract

Because the lists are long, a basic giant desktop `<select>` is not sufficient as the only design consideration.

The selector should be a lightweight accessible searchable dropdown/combobox with:

- fast filtering as the user types;
- large touch targets;
- keyboard navigation;
- visible focus;
- screen-reader labels/ARIA behavior;
- no viewport overflow;
- menu constrained to the visible mobile/Chromebook screen;
- country grouping for leagues where useful;
- deterministic canonical value stored separately from display text;
- graceful native/select fallback if enhanced behavior fails.

No heavy third-party component library should be introduced for this feature.

## Evaluation integrity

Guess matching should compare canonical IDs/normalized values rather than arbitrary strings. This removes spelling/accent mismatches from the gameplay result.

---

# 7. FIFA-era navigation transition + micro click feedback — v0.95 Workstream 6

## Goal

Make navigation between menu destinations feel like a polished football-game UI rather than an abrupt web-page swap, while preserving the project's speed, reliability and clean presentation.

This is an **owner-requested, quality-gated polish requirement**. It should ship only if the implementation feels exceptionally smooth on the real Chromebook and mobile browsers. If testing shows visible lag, layout jank, delayed controls, audio annoyance or reduced clarity, the feature must be simplified or omitted rather than lowering overall quality.

## Screen transition requirements

- Use the established FIFA-17-era-inspired visual language rather than copying proprietary EA transition assets.
- Keep `js/screens.js` as the sole route/history authority; transition presentation must wrap the existing navigation transaction, not create a second router or parallel screen state.
- Prefer compositor-friendly `transform` and `opacity` animation. Avoid layout-heavy animation of width/height/top/left where it could cause reflow or Chromebook jank.
- Keep content-bearing route surfaces fully opaque throughout entrance motion; opacity animation is reserved for decorative, non-text route accents so transient frames preserve readable contrast.
- Keep the transition short and responsive; it should provide momentum and polish without making navigation feel slower.
- Prevent double-navigation, stale callbacks and mismatched route history while an animation is active.
- Critical pending writes and route validation must complete according to existing rules; animation may never bypass, reorder or disguise a failed save/blocked navigation.
- No full-screen video, canvas/WebGL requirement or heavy animation library.
- Preserve focus movement and screen-reader semantics across navigation.
- The existing reduced-motion preference/device request must suppress or substantially simplify the transition with no artificial delay.
- Test mouse, keyboard and touch activation on Chromebook and mobile.

## Micro click-feedback requirements

- Add a very short, restrained menu-confirmation sound only if it improves responsiveness and polish.
- The sound must be **originally synthesized/created for this project or otherwise safely licensed**; do not extract, copy or bundle an EA/FIFA menu sound.
- Aim for a similar *functional impression* — crisp, minimal, football-game-menu feedback — rather than waveform imitation.
- Trigger only from an explicit user interaction; no autoplay or surprise startup audio.
- Do not interfere with soundtrack/trailer playback.
- Avoid repeated/stacked audio when buttons are clicked rapidly.
- Provide a clean way to respect user preference if audio feedback proves intrusive; do not bloat Settings merely to justify the feature.
- Audio initialization/failure must never block navigation.

## Quality gate

Before acceptance, compare the experience with and without the feature on the actual target devices.

Ship only if all are true:

1. navigation feels smoother, not slower;
2. no visible frame hitch/overlap on Chromebook low-height layouts;
3. mobile remains fluid;
4. reduced-motion behavior is immediate and correct;
5. no route/history/persistence regression;
6. the click cue sounds intentional and subtle rather than like a generic browser beep;
7. no copied proprietary sound or transition asset is used.

If these conditions cannot be met at release quality, keep the existing immediate transition rather than shipping a compromised imitation.

---

# Revised finite release order

## Completed — v0.95 Workstream 1A / 1B

Rule Book / optional-screen visual consistency, FIFA-era presentation, procedural club identities and two-pack reveal are implemented and owner accepted through the later stabilized builds.

## Completed — v0.95 Workstream 2

Transfer Challenge phase separation, canonical FIFA 17 transfer data and responsive selectors are implemented and owner accepted.

## Completed — v0.95 Workstream 3

Settings blueprint alignment and persistent reduced-motion accessibility are implemented and owner accepted.

## Completed — v0.95 Workstream 4

Main Menu Career Statistics alignment, Rivalry Statistics and Trophy Room integration are implemented and owner accepted after r8 Home-bootstrap stabilization.

## Completed — v0.95 Workstream 5

Season pre-commit review/confirmation is implemented and owner accepted.

## Implemented — v0.95 Workstream 6

Final v0.95 accessibility, responsive, performance, persistence, navigation and gameplay regression, including the **quality-gated FIFA-era navigation transition and original micro click-feedback experiment** above, is implemented in `0.95.0-r11`.

## Completed — v0.95 release stabilization

The full r11 browser flow exposed a Smart Back integration conflict on Season Review **EDIT RESULTS** plus stale shell save-indicator state. Deployed `0.95.0-r12` corrects those release blockers and adds regression protection.

## Completed — V1 visual immersion and stable release

`0.95.0-r13` implemented the two owner-mandated Home/startup requirements recorded in amendment 0. The owner accepted the deployed result on August 9, 2026, and the exact behavior is sealed under `v1.0.0` / `1.0.0-r1`.

## v1.0

Complete reliable one-device local release. Stable identity and release documentation are sealed without changing gameplay, storage or the accepted r13 presentation.

## Post-v1.0

Two-device/private-manager architecture may consume the already-separated Transfer Challenge phases. Do not implement accounts/backend/realtime pairing as part of v1.0 unless the owner explicitly changes scope.

---

# Non-regression rules for all amendments

- Do not change the max-11 scoring model.
- Do not change the 0-0-only tiebreak.
- Do not expand Showdown club selection beyond the locked top-five-league pool merely because the transfer metadata dataset is larger.
- Do not weaken one-pair/no-reroll club assignment.
- Do not weaken critical-save rollback or centralized navigation.
- Do not move lazy gameplay/optional packages into startup without a measured reason.
- Do not use copied EA/FUT UI graphics, proprietary fonts or copied EA/FIFA interface audio.
- Do not use official club crests by default.
- Keep mobile and Chromebook support first-class.
- Future two-device compatibility must build on this architecture rather than forcing a rewrite of the one-device v1.0 flow.
