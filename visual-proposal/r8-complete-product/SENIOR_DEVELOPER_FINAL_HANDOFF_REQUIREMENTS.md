# Senior Developer Final Visual Handoff Requirements

Status: TARGET CONTRACT — NOT YET READY FOR SENIOR HANDOFF

The visual track may create the final senior-developer handoff only when every condition below is satisfied.

## 1. Final product reconciliation

After the main developer reaches the product's final development checkpoint:

1. independently resolve current `main`;
2. inventory every routed screen and substantial overlay/panel/state family;
3. compare that inventory with this proposal workspace;
4. add or revise proposal coverage for anything that changed;
5. remove proposal assumptions that no longer match the real product;
6. record the exact final-main commit used for reconciliation.

No earlier `main` commit may stand in for this final reconciliation.

## 2. Complete visual design

Every final routed screen and substantial non-route surface must have:

- intended information hierarchy;
- responsive layout contract;
- action hierarchy;
- empty/loading/error/waiting/disabled/destructive states where applicable;
- local/shared variants where applicable;
- motion and reduced-motion behavior;
- accessibility/focus requirements;
- asset usage decision.

## 3. Complete asset package

Every asset role in `ASSET_BUILD_MATRIX.md` must be resolved.

For each required asset, package the file and record:

- stable ID;
- filename/path inside this proposal folder;
- dimensions/type;
- SHA-256;
- provenance and rights status;
- generation source/model if generated;
- source master/derivative relationship;
- target screens/states;
- responsive eligibility;
- safe zones;
- acceptance status.

A01/A02 authoritative source masters must retain their exact approved hashes. Do not replace them with regenerations.

Any new generated character asset must be justified by a screen-specific brief and must pass identity, anatomy, crop and safe-zone QA.

## 4. Final-product-quality prototype/reference package

The visual proposal should be reviewable as though it were a finished product, while remaining isolated from production.

The senior developer should not need to infer major layout, styling or asset placement decisions.

Reference CSS/JS/HTML may be included under `prototypes/`, but it must:

- be presentation-only;
- be namespaced;
- avoid production persistence/provider/network authority;
- preserve real DOM text for UI copy;
- document which current production selectors/components it maps to;
- be clearly labeled reference/proposal code rather than production authority.

## 5. QA package

The proposal must pass visual QA at representative widths including:

- wide desktop;
- reduced-wide desktop;
- Chromebook/tablet;
- mobile.

It must also verify:

- normal and reduced motion;
- keyboard focus;
- modal focus ownership/restoration;
- color contrast;
- no art overlap with controls;
- no decorative hit targets/focusables;
- no baked/mirrored core UI text;
- character identity fidelity and fixed manager mapping;
- rights-safe assets;
- no missing/broken assets;
- exact asset hashes;
- local/shared state clarity;
- error/recovery/destructive-state legibility.

Known Legacy contrast finding in `QA_AND_PROTOTYPE_FINDINGS.md` must be resolved in the proposal before senior handoff.

## 6. Senior implementation map

The final package must tell the senior developer, with minimal interpretation:

- which production screen/component each proposal artifact maps to;
- which existing production authority must remain untouched;
- which files/selectors are likely integration points;
- which assets should be copied where if approved;
- responsive rules;
- state rules;
- any intentionally omitted character art;
- any known risks or places where the senior developer must adapt because final `main` differs from the proposal prototype.

This mapping is advisory. The senior developer owns the actual production implementation approach and final code review.

## 7. Final handoff prompt

Only after all requirements above are complete, create a concise final senior-developer prompt that:

- points first to this folder;
- identifies the exact final proposal manifest and exact final-main reconciliation commit;
- instructs the senior developer to review, verify, fix any remaining integration defects, and intentionally implement the package;
- explicitly says the visual track did not modify/deploy `main`;
- preserves the zero-dollar/Firebase Spark-only and domain-authority locks.

The final handoff prompt must not claim that proposal approval equals deployment approval.
