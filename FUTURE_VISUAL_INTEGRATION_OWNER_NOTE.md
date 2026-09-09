# Future Visual Integration Owner Note

Status: DORMANT OWNER-SUPPLIED-ASSET HANDOFF

This note preserves a future UI migration request without creating a reminder, tracker, milestone blocker, readiness score, CI gate, recurring task, or owner follow-up obligation.

## Activation rule

Do nothing because this file exists.

Activate this work only when the owner explicitly supplies the finalized Career Mode Showdown visual assets and says they are ready to integrate. Do not ask the owner where the visuals are, when they will be ready, whether they are finished, or whether this work should begin. Do not make SSJR progress wait for them.

When the owner later says words such as "these are the visuals" or otherwise supplies the finalized visual package, future sessions should recognize that package as the planned Career Mode Showdown UI refresh described here and begin from this note instead of asking what the owner means.

## Owner intent

The replacement visuals are being designed to match the real Career Mode Showdown product. They should preserve the functions, controls and button purposes already implemented. Layout, artwork, framing, typography and presentation may change substantially. A small number of new presentation elements may be added, but the visual migration must not invent product capabilities that do not exist.

## Safe integration contract

Treat this as a presentation-layer migration around existing behavioral authority, not as permission to rewrite gameplay, Shared Showdown protocols, Firebase/provider authority, canonical storage, scoring, navigation semantics or security boundaries.

Before replacing a screen, map every live interactive element used by JavaScript, tests, accessibility or provider adapters. Preserve stable IDs, event targets, data attributes, form semantics and screen identities unless the corresponding behavioral references are deliberately migrated in the same bounded change. Never silently delete or duplicate a control that existing logic owns.

Keep local and Shared Showdown authority unchanged while changing presentation. Do not mix provider/state-model changes into a visual-only migration unless a real product requirement makes that unavoidable and it is separately reviewed.

Integrate screen by screen. For each screen, preserve its required actions first, then apply the new layout and assets, then run the existing relevant behavior, browser, responsive and accessibility checks. Add a narrowly scoped regression check only when the existing suite does not protect a newly exposed risk.

Different source image dimensions are acceptable. Fit them through responsive containers, object positioning/cropping and breakpoint-aware presentation rather than changing product logic to accommodate artwork. Do not distort artwork merely to preserve an old crop.

New decorative elements should be non-authoritative. New interactive elements must have an explicit behavioral mapping before implementation.

## Primary safety risks to prevent

The highest-risk visual changes are renaming or removing DOM IDs used by runtime code, changing capture-phase button ownership, duplicating form controls with the same ID, hiding required controls behind unreachable layouts, breaking keyboard/focus behavior, changing responsive containment, replacing dynamic text with baked-in artwork, or allowing a new visual shell to trigger local-only logic during a Shared Showdown.

## Relationship to current work

SSJR remains the active product priority. This dormant note earns zero SSJR or MDP credit and must not divert CI or development effort before the owner supplies finalized assets.
