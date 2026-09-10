# Owner Visual Finalization / Acceptance Contract

Status: HARD FINALITY AUTHORITY

Owner: Nik

Captured: 2026-09-10

This file defines when the R8 complete-product visual proposal is allowed to become `FINAL`.

## Required process

The visual track follows this order:

`THINK -> PLAN -> BUILD -> INTERNAL REVIEW -> FIX -> AUTOMATED/STRUCTURAL QA -> FINAL-MAIN RECONCILIATION -> FINAL SCREENSHOTS -> OWNER REVIEW -> REVISE IF NEEDED -> OWNER APPROVAL -> SEAL -> SENIOR IMPLEMENTATION REVIEW`

Skipping directly from a prototype to senior implementation is not permitted.

## Thinking / planning gate

Before an asset or page is built:

- resolve the actual current product route/state contract;
- preserve existing gameplay/storage/provider authority;
- identify whether character art genuinely improves the page or should be omitted;
- identify exact responsive/state variants that materially change the composition;
- reject invented product capability;
- preserve zero-dollar infrastructure.

## Build gate

Build proposal-only artifacts under `visual-proposal/r8-complete-product/`.

Do not modify/deploy production `main` from the visual track.

Character asset work must follow `assets/CHARACTER_POSE_LIBRARY_PLAN.md`.

Media must follow `surfaces/07_MEDIA_PLAYER.md`.

## Internal visual QA gate

Every final candidate is inspected for:

- hierarchy;
- readability;
- alignment/spacing;
- mobile overflow;
- Chromebook/reduced-wide behavior;
- 44px-class interaction targets;
- correct Daniel/Nik mapping;
- character safe zones;
- character identity/anatomy quality;
- no mirrored/baked critical text in raster art;
- no impossible hands/extra limbs;
- disabled/waiting/error state clarity;
- correct dark-shell/light-card contrast;
- reduced-motion safety;
- media/player state honesty;
- no provider/debug overlay in final screenshots.

A screenshot that exposes a defect is evidence for a fix, not evidence of acceptance.

## Automated / structural QA gate

Before owner review, perform every automated check feasible in the available zero-dollar environment, including at minimum:

- containment check: visual branch changes remain under proposal workspace;
- required-route/prototype inventory completeness;
- duplicate/missing stable asset IDs;
- manager mapping assertions (`Manager 1 = Daniel`, `Manager 2 = Nik` where canonical examples show names);
- frozen A01/A02 hash verification;
- missing relative asset references;
- obvious HTML duplicate-ID checks where testable;
- presence of responsive breakpoints for every route composition;
- player no-autoplay assertion;
- player no-YouTube-music-fallback assertion;
- r14 five-phase inventory;
- r15 visible-conflict consequence inventory;
- final screenshot index completeness;
- no `Owner approved = YES` before explicit owner decision.

Automated tests do not replace visual review.

## Final-main reconciliation gate

Immediately before owner review, resolve current `main` again.

If production has advanced:

- identify only genuine user-visible changes;
- reconcile affected proposal surfaces;
- do not restart unrelated approved work;
- refresh only screenshots made stale by the real change.

## Screenshot gate

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md` is the canonical inventory.

The owner receives:

- every routed page;
- every substantial non-route surface;
- every materially different reachable state/version;
- responsive variants when geometry/art/control placement materially differs;
- Nik character contact sheet;
- Daniel character contact sheet;
- pack-opening pair;
- winner/setback outcome pair;
- Audius player states;
- media provider/functionality/track disclosure.

One review sheet may satisfy several states only when every state is independently readable at approval scale.

## Owner approval gate

For each required screenshot/character/media item, the owner may:

- approve;
- reject;
- request a change.

Only explicit approval changes the item to approved.

If the owner requests an edit:

1. update the proposal;
2. rerun relevant QA;
3. replace stale screenshots;
4. present the revised exact item again.

No approval transfers automatically from an older screenshot to a changed composition.

## Seal gate

The proposal can be sealed only when:

- all required screenshot rows are owner-approved;
- final character set is owner-approved;
- final Audius track list and player behavior are owner-approved;
- A01/A02 integrity remains proven;
- required new character asset integrity/provenance is recorded;
- automated/structural QA is green;
- final-main reconciliation is current;
- no known visual blocker remains.

Then and only then create the senior-developer implementation handoff.

## Senior handoff expectation

The senior developer receives implementation authority, not permission to redesign the approved proposal casually.

The handoff includes:

- final screenshots;
- design tokens;
- exact screen/state map;
- final character asset manifest and hashes;
- media architecture and Audius integration contract;
- responsive rules;
- interaction/accessibility rules;
- final-main reconciliation evidence;
- QA results;
- known compatibility notes;
- zero-dollar locks;
- explicit statement of what the owner approved.

Current state:

`ACTIVE FINALIZATION — OWNER FINAL REVIEW NOT YET OPEN`.
