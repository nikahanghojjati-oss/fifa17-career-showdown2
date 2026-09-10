# Club Assignment Mode B Feasibility — Held Live Pack Progressive Enhancement

Status: CONDITIONAL GO — RECOMMENDED FOR WIDE DESKTOP AS PROGRESSIVE ENHANCEMENT / MODE A OR CHARACTER-FREE FALLBACK REQUIRED

Date: 2026-09-10

Scope: proposal-only implementation feasibility evidence. This record changes no production HTML/CSS/JS, Firebase, storage, scoring, Shared Journey, Candidate B/C, provider, billing, or reveal authority.

## Decision

The advanced `held-live-pack` composition is technically feasible with the current Career Mode Showdown architecture and is within the expected implementation capability of a senior GPT-5.6 Sol developer already familiar with this repository. A separate high-capability reviewer may be used for code/design review, but no additional backend, paid service, rendering engine, or new framework is required.

The recommendation is **not** to make Mode B universal.

Recommended product shape:

- >= 1180px wide desktop: attempt Mode B as the preferred R8 Club Assignment presentation;
- if Mode B cannot satisfy the acceptance matrix, fall back automatically to Mode A flank presentation;
- <= 1179px: use the current proposal's character-free Club Assignment baseline unless a later proof safely promotes a restrained Mode A;
- mobile: character-free.

This gives the visual payoff of the owner-liked pack-holding composition without turning raster art into product state or making lower-width layouts brittle.

## Source reality

Current production already owns the Club Assignment interaction through:

- `#clubWheelScreen`;
- `.clubRevealArea`;
- two `.clubRevealCard` containers;
- two `.clubPackStage` containers;
- `.clubPackDoor` and `.clubCardFace` inside each stage;
- live manager labels and club names;
- central VS state;
- permanent-club confirmation;
- Open / Confirm / Back controls.

`js/clubAssignment.js` owns the reveal stages:

`ready -> opening -> manager-one -> manager-two -> versus -> confirmation`

The club pair is persisted before presentation timers run. Current approximate visual transition points are Manager 1 at 650ms, Manager 2 at 1750ms, versus at 2850ms, and confirmation at 3300ms.

Mode B must consume these existing states. It must not create a second reveal state machine or duplicate persistence.

## Why Mode B is feasible

### 1. The real pack is already a self-contained DOM object

The pack does not need to be rebuilt inside character art. The existing `.clubPackStage` can remain the live aperture between/inside decorative character layers.

### 2. Existing containers support layered composition

Current CSS already gives `.clubRevealArena` and `.clubAssignmentShell` visible overflow, `.clubRevealCard` positioned containment, and `.clubPackStage` its own internal overflow/perspective boundary. This is enough to anchor decorative character layers without changing product ownership.

### 3. Existing reveal state is exposed for styling

`setClubRevealStage()` writes the current stage to `data-club-reveal-stage` on the live screen. Mode B can key restrained opacity, glow, emphasis, or hand visibility from that existing attribute. No new JavaScript state is required.

### 4. Interaction safety can remain deterministic

Character body and optional foreground hand overlays can be `aria-hidden="true"` and `pointer-events:none`. The live pack and controls remain the only interactive/semantic layer.

### 5. The repository already has browser visual QA infrastructure

Production uses Playwright/Chromium visual audits at:

- 1366x768 desktop/Chromebook;
- 1100x720 compact desktop;
- 940x700 windowed/reduced-motion;
- 390x844 mobile DPR2.

The existing audits already assert no horizontal overflow, visible/loadable assets, viewport containment, reduced-motion behavior and screenshot evidence. A dedicated Club Assignment Mode B audit can extend this established pattern rather than introducing a new test framework.

## Recommended layer architecture

For each manager lane on supported wide desktop:

### Layer 0 — ambient/background

Existing R8 black/charcoal/gold atmosphere and any retained licensed visual treatment.

### Layer 1 — rear character body

Transparent A05/A06 character master behind the authoritative pack.

The final character master contains no club, pack result, manager name, state text, button or proprietary pack art.

### Layer 2 — authoritative live pack

Existing `.clubRevealCard` and `.clubPackStage`, including `.clubPackDoor`, `.clubCardFace`, live club identity and state.

This is the object that visibly opens.

### Layer 3 — optional foreground hand/forearm mask

A small deterministic derivative from the same accepted A05/A06 master may sit above decorative outer pack edges to create the held-pack illusion.

Requirements:

- `aria-hidden="true"`;
- `pointer-events:none`;
- may overlap decorative border only;
- must not cover manager label, club name, reveal state, live crest/monogram area, focus indicator or control;
- must grip the stable outer card/frame rather than an element whose animated transform would move away from the hand.

Do not independently generate a second hand layer. Derive it from the same approved master so anatomy and identity cannot drift between rear and foreground layers.

## Asset-production implication

Do not generate A05/A06 against a guessed pack size.

First build the DOM structural prototype with temporary silhouette/hand placeholders and measure the real safe aperture. Only after the aperture and hand contact points are frozen should final A05/A06 be generated/edited.

Owner-provided pack-holding images remain pose/composition evidence. Any pack pictured in those references is replaced by the real DOM pack in implementation.

## Existing licensed football visual dependency

Current production has a required football visual system. `clubWheelScreen` is included in the required visual routes and currently receives a cinematic-band visual through `prepareFootballVisualScreen()` / `mountCinematicBandVisual()`.

The current football visual browser audit expects one visual panel on Club Assignment.

Therefore a senior R8 implementation must explicitly choose one of these approaches rather than stacking uncontrolled vertical hero content:

1. preserve and demote/reposition the licensed visual as ambient/supporting material while the character/pack composition becomes the interaction hero; or
2. intentionally remap/retire the Club Assignment licensed panel and update its manifest/plan/tests with equivalent rights/provenance reasoning.

Approach 1 is lower implementation and provenance risk and is the preferred first attempt.

## Responsive recommendation

### 1366x768

Primary Mode B proof target. Full held-live-pack illusion is allowed if all states remain within the useful viewport and Open/Confirm/Back remain accessible.

### 1100x720

Do not force Mode B. Current proposal threshold makes this character-free. If future evidence promotes Mode A here, character flanks must remain secondary and must not shrink the real cards below current readability.

### 940x700 reduced motion

Character-free baseline. Existing reduced-motion state must remain immediate and understandable.

### 390x844 mobile DPR2

Character-free. Preserve the current stacked one-column card architecture.

This is intentional progressive enhancement, not a failure of responsiveness.

## Mode B acceptance matrix

Mode B is promoted only if a dedicated browser audit proves all of the following at the wide target:

1. all six reveal states render without horizontal overflow;
2. Daniel remains Manager 1 / left and Nik remains Manager 2 / right;
3. the live DOM pack is unmistakably the object that opens;
4. no raster pack result or baked club name exists;
5. hand overlays use `pointer-events:none` and are absent from the accessibility tree;
6. hands touch only stable decorative outer edges;
7. manager labels, club names, reveal states and identity monograms remain unobscured;
8. Open, Confirm and Back remain reachable with visible keyboard focus;
9. the permanent-club lock note remains visually higher priority at confirmation;
10. ready/opening/manager-one/manager-two/versus/confirmation remain visually distinct;
11. reduced-motion behavior remains valid;
12. lower-width fallbacks remove Mode B cleanly without ghost layers or layout jump;
13. no new local-storage/Firebase field or parallel reveal timer/state machine is introduced;
14. existing product/browser contract suites remain green;
15. the existing licensed football visual dependency is deliberately reconciled rather than accidentally duplicated.

## Automatic downgrade rule

Mode B has a hard fail-safe.

If the structural prototype cannot pass the 1366x768 six-state matrix without obscuring product content, introducing layout overflow, making hand alignment visibly brittle, or requiring changes to reveal/persistence authority, stop refining Mode B and use Mode A.

Do not spend additional asset-generation iterations trying to rescue an architecture failure.

## Expected implementation difficulty

- DOM wrappers/layer mounts: low to medium;
- CSS positioning/stacking: medium;
- responsive fallback: medium;
- A05/A06 art geometry and foreground-hand masking: medium to high and the largest visual risk;
- reveal runtime changes: low to none;
- Firebase/storage/provider work: none;
- accessibility impact: low if overlays remain decorative/noninteractive;
- regression testing: manageable because the repository already has Playwright and multi-viewport visual-audit conventions.

This is therefore an ambitious presentation task, not an infrastructure rewrite.

## Senior implementation sequence

1. independently resolve final `main` and current visual proposal head;
2. preserve current reveal state/persistence authority exactly;
3. build character-free structural baseline from the real Club Assignment DOM;
4. reconcile the existing licensed visual panel;
5. add temporary rear-character and foreground-hand placeholders;
6. prove Mode B at 1366x768 across all six reveal stages;
7. freeze pack aperture/contact geometry;
8. only then produce/finalize A05 and A06 one asset at a time;
9. replace placeholders with accepted A05/A06 derivatives;
10. run dedicated Club Assignment browser audit plus existing product/browser suites;
11. capture final Mode B and fallback screenshots;
12. include the result in owner review; do not mark final without explicit owner approval.

## Verdict

`MODE B: CONDITIONAL GO / RECOMMENDED WIDE-DESKTOP TARGET`

`MODE A: REQUIRED FALLBACK / NOT DISCARDED`

`MOBILE + <=1179PX: CHARACTER-FREE BASELINE`

`BACKEND OR BILLING CHANGE: NONE`

`A05/A06 FINAL GENERATION: WAIT UNTIL DOM APERTURE PROOF`
