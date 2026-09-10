# Senior Developer Final Visual Handoff Requirements

Status: TARGET CONTRACT — NOT YET READY FOR SENIOR HANDOFF

The visual track may create the final senior-developer implementation handoff only when every condition below is satisfied.

## 1. Final product reconciliation

After the main developer reaches the product's actual final development checkpoint:

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

The Home/menu media surface is explicitly included in this requirement.

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

If the approved Home design uses native soundtrack audio, every accepted track also requires its own rights/provenance ledger entry including source, exact license, required attribution, verification date and packaged-file hash. A provider catalogue is not a blanket rights grant.

## 4. Media player implementation boundary

Read first:

- `surfaces/07_MEDIA_PLAYER.md`
- `evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`
- `prototypes/25-native-music-player-reference.html`

The current r13 YouTube integration must not be copied forward blindly. It optimistically toggles a local playing boolean and uses iframe DOM `load` plus raw postMessage commands rather than observing the official provider lifecycle.

Approved proposal architecture is:

- default `SHOWDOWN RADIO`: browser-native audio using individually rights-verified tracks;
- optional `FIFA 17 ORIGINALS`: separate provider-backed mode for the existing commercial songs/trailer.

If YouTube remains the provider for FIFA 17 Originals:

- use the official IFrame Player API lifecycle/events;
- wait for provider readiness;
- derive playing/paused/buffering/ended/blocked/error UI from real provider events;
- keep the YouTube player visible while active;
- do not extract or isolate YouTube audio;
- do not suppress, cover, skip or work around provider ads;
- preserve lazy loading for the provider mode.

Spotify Premium is not an acceptable default dependency for the zero-dollar route. SoundCloud may be evaluated for individually suitable tracks but is not the canonical playback authority.

## 5. Final-product-quality prototype/reference package

The visual proposal should be reviewable as though it were a finished product while remaining isolated from production.

The senior developer should not need to infer major layout, styling, media-state or asset-placement decisions.

Reference CSS/JS/HTML may be included under `prototypes/`, but it must:

- be presentation-only;
- be namespaced;
- avoid production persistence/provider/network authority;
- preserve real DOM text for UI copy;
- document which current production selectors/components it maps to;
- be clearly labeled reference/proposal code rather than production authority.

## 6. QA package

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
- error/recovery/destructive-state legibility;
- media ready/playing/paused/loading/blocked/error truthfulness;
- responsive text readability without pinch zoom.

Use the mobile typography floor learned in `evidence/PROPOSAL_SCREENSHOT_QA_R13_2026-09-10.md`; do not preserve sub-readable microtype solely for visual density.

## 7. Owner final screenshot approval — HARD GATE

Read:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

Before the visual proposal may become `FINAL` or be handed to the senior developer as an approved implementation target:

1. every built routed page must have a final screenshot;
2. every substantial non-route surface must have a final screenshot;
3. every materially different user-visible version/state must be shown, including responsive variants where geometry/content materially changes;
4. those screenshots must represent the final reconciled proposal, not obsolete exploratory versions;
5. the complete set must be presented to the owner;
6. the owner must explicitly approve the final screenshots.

Internal QA PASS is not owner approval.

Do not call the proposal final while any required row in `FINAL_SCREENSHOT_APPROVAL_INDEX.md` remains unrendered, stale or unapproved.

## 8. Senior implementation map

The final package must tell the senior developer, with minimal interpretation:

- which production screen/component each proposal artifact maps to;
- which existing production authority must remain untouched;
- which files/selectors are likely integration points;
- which assets should be copied where if approved;
- responsive rules;
- state rules;
- media-player state and rights boundaries;
- any intentionally omitted character art;
- any known risks or places where the senior developer must adapt because final `main` differs from the proposal prototype.

This mapping is advisory. The senior developer owns the actual production implementation approach and final code review.

## 9. Final handoff prompt

Only after all requirements above are complete, create a concise final senior-developer prompt that:

- points first to this folder;
- identifies the exact final proposal manifest and exact final-main reconciliation commit;
- states that owner screenshot approval is complete;
- instructs the senior developer to review, verify, fix any remaining integration defects and intentionally implement the package;
- explicitly says the visual track did not modify/deploy `main`;
- preserves zero-dollar/Firebase Spark-only and domain-authority locks;
- preserves media rights/provider integrity rules.

The final handoff prompt must not claim that proposal approval equals deployment approval.
