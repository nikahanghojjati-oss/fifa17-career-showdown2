# Club Assignment Mode B2 Feasibility — Static Presentation Frame / Protected Live Pack

Status: STRUCTURAL PROTOTYPE GO — SAFER AMBITIOUS ROUTE PREFERRED FOR WIDE DESKTOP / FINAL A05-A06 GENERATION STILL BLOCKED ON GEOMETRY PROOF

Date: 2026-09-10

Production authority checked against `main` head `4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a`.

Scope: proposal-only implementation feasibility evidence. This record changes no production HTML/CSS/JS, Firebase, storage, scoring, Shared Journey, Candidate B/C, provider, billing, club-draw authority, or reveal timing.

## Decision

The earlier Mode B concept allowed a small foreground hand/forearm mask to touch decorative pack edges. Owner review correctly identified that this still leaves an unnecessary character-to-pack alignment risk.

That variant is superseded by **Mode B2 — Static Presentation Frame / Protected Live Pack**.

Mode B2 keeps the visual ambition but removes the moving-pack hand synchronization problem:

- the real `.clubRevealCard` / `.clubPackStage` owns a protected rectangular aperture;
- no raster hand, arm, sleeve, character body or decorative mask may enter that aperture;
- characters may place hands on, beside or behind a separate static presentation frame outside the protected aperture;
- the static frame never moves with the pack door;
- the real DOM pack opens entirely inside the protected aperture;
- no foreground raster layer is required above live semantic pack content;
- if the pose cannot look natural while respecting the protected aperture, Mode A flank presentation wins automatically.

This is the preferred ambitious implementation target for wide desktop because it preserves the owner-liked physical presentation illusion while materially reducing geometry, interaction and accessibility risk.

## Why the refinement is safer

### Production motion reality

Current production already owns the reveal.

The live sequence is:

`ready -> opening -> manager-one -> manager-two -> versus -> confirmation`

`js/clubAssignment.js` persists the selected club pair before the presentation timers begin. Current transition points are Manager 1 at 650ms, Manager 2 at 1750ms, versus at 2850ms and confirmation at 3300ms. Reduced-motion mode skips the staged delays and renders confirmation directly.

The current `.clubPackDoor` is the moving object. When a card is revealed it translates upward by more than its own height and rotates slightly while fading. Therefore a raster hand visually attached to that moving door would create a synchronization dependency that the product does not need.

Mode B2 eliminates that dependency by forbidding character contact with the moving door and the live pack aperture.

### Existing containment helps

Current CSS already supplies useful boundaries:

- `.clubAssignmentShell` uses visible overflow;
- `.clubRevealArena` uses visible overflow;
- `.clubRevealArea` is a positioned two-card grid around the VS lane;
- `.clubRevealCard` is positioned containment;
- `.clubPackStage` has its own internal overflow and perspective boundary.

That means a senior implementation can add an outer decorative presentation frame around each real card without changing persistence or reveal ownership.

## Mode B2 layer architecture

For each manager lane on supported wide desktop:

### Layer 0 — ambient/background

R8 black/charcoal/gold environment plus deliberately reconciled licensed football visual treatment.

### Layer 1 — character body

Transparent A05/A06 character master positioned outside/behind the protected pack aperture.

Character body is decorative only:

- `aria-hidden="true"`;
- `pointer-events:none`;
- no manager name;
- no club name;
- no pack state;
- no UI copy;
- no generated club result;
- no proprietary pack art.

### Layer 2 — static presentation frame

A DOM/CSS/SVG frame that visually connects the manager to the live pack.

The frame may include:

- outer side rails;
- lower support rail;
- restrained top corner accents;
- gold/cyan seam lighting;
- original Showdown geometry;
- a stable hand-rest / presentation edge outside the protected aperture.

The frame itself is decorative and noninteractive. It does not animate with the pack door.

### Layer 3 — protected live pack aperture

The existing `.clubRevealCard` and `.clubPackStage` remain fully visible and fully authoritative inside the frame.

The protected aperture includes the entire live card rectangle plus a measured safety gutter established by the structural prototype.

No character pixels may overlap this rectangle.

This is stricter than the previous Mode B proposal.

## Hand / arm rule

The hand rule is now intentionally simple enough to test mechanically:

> Character pixels must not intersect the protected live-pack rectangle.

Allowed poses:

- palm resting on an outer side rail;
- fingertips wrapping around the outside of a decorative rail while remaining outside the live aperture;
- open-hand presentation toward the pack with visible air gap;
- forearm behind the decorative frame;
- one hand lowered while the other points/presents from outside the aperture.

Rejected poses:

- fingers crossing the pack border;
- hand sitting over the club crest/monogram zone;
- hand attached to `.clubPackDoor`;
- hand crossing manager label, club name, reveal state or focus ring;
- separate foreground hand image above semantic content;
- pose that requires JavaScript tracking of a moving raster hand.

A final minimum CSS safety gutter must be measured in the placeholder prototype. Do not guess it during image generation.

## Viewport risk reduction

The characters must not be normal-flow content that increases the screen's vertical stack.

Wide-desktop implementation should use a fixed-height composition wrapper derived from the existing reveal arena. Character art is positioned within that already-budgeted presentation zone and cropped at approximately chest/waist level as needed.

Product priority order:

1. manager label and live pack;
2. live club result and state;
3. permanence/confirmation information;
4. Open / Confirm / Back actions;
5. character presentation;
6. ambient decoration.

If space becomes constrained, remove decoration and character art before shrinking semantic content.

### 1366x768

Primary Mode B2 proof target.

The full static-frame illusion may be used only if:

- current card readability is preserved;
- the composition adds no horizontal document overflow;
- Open/Confirm/Back remain naturally reachable;
- the confirmation block does not become visually subordinate to character art.

### 1100x720

Do not force Mode B2. Default remains character-free under the current 1180px threshold. A later measured Mode A may be promoted here only if it consumes no useful control space.

### 940x700 reduced motion

Character-free baseline. No presentation dependency on animated character/frame effects.

### 390x844 mobile DPR2

Character-free. Preserve the existing one-column live-card architecture.

## Licensed football visual reconciliation

Current production requires a football visual on `clubWheelScreen`, and the existing visual audit expects that route to mount one football visual panel.

Mode B2 must not simply stack a new character hero below/above that panel and inflate the page.

Preferred implementation:

- preserve the current licensed visual asset/provenance contract;
- demote/reposition its visual treatment into the same ambient presentation budget used by the reveal composition;
- keep exactly one intentionally owned visual lane;
- let the live pack remain the interaction hero.

Only if that composition proves impossible should the senior developer intentionally remap/retire the Club Assignment visual-plan entry and update its manifest/tests/provenance together.

No accidental duplicate hero stack is accepted.

## Pack animation feasibility

A richer pack opening is feasible without changing product authority.

Allowed enhancement surface:

- CSS/SVG seam charge;
- bounded gold edge light;
- short light sweep;
- panel/foil split treatment inside the pack door;
- restrained particles contained inside the live aperture;
- reveal-face settle;
- VS hit enhancement;
- confirmation-frame pulse.

All enhancement must key from the existing `data-club-reveal-stage` and existing `.is-revealed` state.

Do not add:

- a second timer sequence;
- a second reveal state variable;
- persistence for presentation state;
- animation that delays the authoritative reveal;
- particle canvas requiring a new animation engine;
- movement of the static character hand frame to chase the pack door.

Reduced motion must remain immediately understandable and may disable decorative motion completely.

## Regression-test burden reduction

Mode B2 does not require the senior developer to run the full browser suite after every CSS adjustment.

Recommended development loop:

1. add one focused `club-assignment-composite-audit.cjs` following existing Playwright conventions;
2. run that focused audit while iterating on frame/card geometry;
3. run the existing football visual audit when the licensed visual lane changes;
4. run directly relevant Club Assignment/shared setup/product contracts for authority regressions;
5. run the full browser/product suite only at the implementation checkpoint / pre-merge gate.

The focused audit should inspect:

- all six reveal stages at 1366x768;
- fallback behavior at 1100x720;
- reduced-motion behavior at 940x700;
- character-free mobile at 390x844 DPR2;
- zero horizontal overflow;
- zero character-pixel intersection with protected live-pack rectangles;
- live-card bounding-box minimums;
- visible/focusable Open, Confirm and Back controls;
- decorative layers `pointer-events:none` and `aria-hidden`;
- Daniel remains Manager 1 and Nik remains Manager 2;
- no extra presentation timers or persisted fields.

This keeps iteration cost low while preserving a full final regression gate.

## Risk reassessment

Previous Mode B:

- character / hand geometry: medium-high;
- CSS compositing: medium;
- accessibility/interaction: low to medium;
- responsive risk: medium;
- reveal-state risk: low;
- backend risk: none.

Mode B2:

- character / hand geometry: low to medium;
- CSS compositing: medium;
- accessibility/interaction: low;
- responsive risk: low to medium because the enhancement is wide-only;
- reveal-state risk: very low because presentation consumes existing state only;
- backend risk: none;
- regression iteration cost: low to medium with a focused audit, full suite reserved for checkpoint.

The largest remaining uncertainty is aesthetic rather than architectural: whether the outside-frame hand pose looks convincingly intentional. That can be answered cheaply with silhouette placeholders before final image generation.

## Structural prototype gate before A05/A06

Do not generate final A05/A06 yet.

Senior implementation should first create a temporary geometry proof using plain DOM/CSS silhouette blocks:

1. resolve final `main` again;
2. preserve the current real pack DOM;
3. create the static presentation frame;
4. define protected aperture rectangles;
5. position temporary Daniel/Nik silhouette blocks outside them;
6. exercise all six reveal stages;
7. prove 1366x768 controls and confirmation fit;
8. reconcile the existing licensed visual lane;
9. run focused audit;
10. freeze the frame, safe gutter and character crop geometry;
11. only then generate/finalize A05 and A06 against those measured constraints.

If the silhouettes cannot produce a convincing composition without violating the aperture, stop and use Mode A. No asset-generation rescue loop.

## Automatic downgrade rule

Mode B2 is rejected if any of the following is required:

- character pixels enter the protected live pack aperture;
- a hand must track the moving pack door;
- a raster layer must sit over live club text/state to sell the illusion;
- current card readability must be materially reduced;
- normal-flow character content pushes primary actions out of the useful wide-desktop viewport;
- a new reveal timer/state/persistence field is needed;
- the existing licensed visual is accidentally duplicated rather than reconciled;
- lower-width fallbacks retain ghost layers or layout gaps.

Mode A then becomes canonical automatically.

## Senior-developer recommendation

A senior GPT-5.6 Sol developer familiar with this repository should be able to implement the Mode B2 structural prototype using the current HTML/CSS/JS and Playwright stack. GPT-6 Astra may be useful as an independent architecture/accessibility/visual-regression reviewer after the structural proof, but is not required to make the approach feasible.

## Verdict

`MODE B2 STATIC FRAME: GO FOR STRUCTURAL PROTOTYPE`

`HAND CONTACT WITH LIVE PACK: FORBIDDEN`

`PACK OPENS INSIDE PROTECTED DOM APERTURE: REQUIRED`

`A05/A06 FINAL GENERATION: BLOCKED UNTIL GEOMETRY PROOF`

`MODE A: AUTOMATIC FALLBACK`

`<=1179PX: CHARACTER-FREE BASELINE UNLESS LATER PROVEN OTHERWISE`

`PACK ANIMATION POLISH: FEASIBLE USING EXISTING STATES`

`BACKEND / FIREBASE / STORAGE / BILLING CHANGE: NONE`
