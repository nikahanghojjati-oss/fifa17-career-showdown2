# Club Assignment B2 — R8.31 assembled-product browser proof

Artifact status: `ASSEMBLED_PROPOSAL`

Browser geometry status: `PASS`

Owner visual approval status: `PENDING`

A05 / A06 source-art ticket status: `GEOMETRY READY / OWNER FINAL-ART APPROVAL NOT IMPLIED`

## Authority anchors

- Production `main`: `e624d19e04c0ca56f33fa7f0d25fdcc42eb99eda` (`1.9.1-r17`).
- Validated B2 proposal source commit: `2327bc14ccc706d2dd76b1bfd09c84441b8d294a`.
- Proposal harness: `prototypes/04c-club-assignment-mode-b2-assembled-product.html`.
- Manager mapping: Manager 1 = Daniel; Manager 2 = Nik.
- Production draw, persistence, reveal and confirmation authority remains unchanged.

## What was reconciled before the build

The current production Club Assignment is the live two-card reveal architecture based on `.clubRevealArea`, `.clubRevealCard`, `.clubPackStage`, `.clubPackDoor`, `.clubCardFace`, `.clubVs`, `#clubRivalryConfirmation`, `#openClubPack`, `#continueClubAssignment` and `#clubAssignmentBack`.

The proposal therefore does not use the previously summarized `clubPackTable` / `clubPackCore` shape. The R8.31 harness is built around the actual r17 reveal-card semantics.

The current controller owns these states:

`ready -> opening -> manager-one -> manager-two -> versus -> confirmation`

The club pair is persisted by production before presentation timers advance. The R8.31 harness owns presentation QA only and performs no draw, save, Firebase, Auth or Shared Journey write.

## Build result

R8.31 upgrades the earlier B2 structural proof into a self-contained browser-testable assembled proposal.

The page contains production-derived Club Assignment classes and control IDs, live-text placeholders for runtime club results, a state inspector for all six production presentation states, and a B2 exterior-flank layer containing only decorative Daniel/Nik geometry placeholders plus static presentation rails.

The manager layer is outside the accessibility/interaction authority:

- `aria-hidden` parent treatment;
- `pointer-events:none` on manager and rail decoration;
- no decorative focus targets;
- no second pack object;
- no generated club-result raster;
- no runtime network requirement.

`CLUB RESULT A` and `CLUB RESULT B` are explicit proposal placeholders, not invented club identities or product data.

## Protected-aperture contract

Each real `.clubPackStage` receives a measured 14px safety expansion. B2 decoration must remain geometrically disjoint from that protected aperture.

At the 1366x768 confirmation-state proof, the key horizontal bounds were:

- Daniel placeholder: x `54.98..218.98`;
- Manager 1 static rail: x `223.98..235.98`;
- Manager 1 protected aperture: x `266.98..650.98`;
- Manager 2 protected aperture: x `714.98..1098.98`;
- Manager 2 static rail: x `1129.98..1141.98`;
- Nik placeholder: x `1146.98..1310.98`.

This leaves approximately 31px from each rail to its protected aperture and approximately 48px from each character placeholder to its protected aperture. Open / Confirm / Back controls remain below the decorative flank region and are included in the overlap guard.

These numbers are proposal evidence, not hardcoded production authority. A future production implementation must remeasure then-current DOM geometry.

## Chromium proof matrix

Headless Chromium was executed with the proposal source at each required viewport. Every row was exercised through all six reveal states.

| Viewport | Motion | B2 decoration | Six-state logic | Horizontal overflow | Geometry result |
| --- | --- | --- | --- | --- | --- |
| 1366x768 | normal | enabled | pass | none | pass |
| 1440x900 | normal | enabled | pass | none | pass |
| 940x700 | reduced | removed | pass | none | pass |
| 390x844, DPR 2 | normal | removed | pass | none | pass |

The six-state checks confirmed:

- `ready`: both packs sealed, Open enabled, Back enabled;
- `opening`: both packs sealed, Open locked, Back locked;
- `manager-one`: Daniel / Pack 01 revealed only;
- `manager-two`: both manager packs revealed;
- `versus`: both packs revealed and confirmation panel visible while Confirm remains withheld;
- `confirmation`: both packs revealed, confirmation visible, Confirm enabled and Back restored.

This matches current r17 presentation ownership rather than inventing another state machine.

## Defect discovered and fixed during proof

The first mobile run at `390x844` exposed a real 10px horizontal overflow caused by the narrow-screen `.screen` width being calculated independently of the proposal viewport's horizontal padding.

The fix makes the narrow proposal viewport edge-to-edge and constrains `.screen` to `width:100%; max-width:100%` at `<=900px`.

The mobile matrix was rerun after the fix. Document width then matched viewport width exactly (`390px`) across all six states.

The fallback guard was also strengthened so any visible B2 manager/rail decoration under `<1320px` or reduced-motion conditions is a test failure.

## What this proof does and does not authorize

This proof is sufficient to freeze B2's placeholder geometry for the next proposal stage. It does not make the current placeholders final artwork and it does not approve the screen for production.

A05 Daniel and A06 Nik may now be treated as geometry-ready source-art tickets only if generated artwork obeys the frozen exterior bounding boxes: upper-body/torso presentation, no generated pack, no baked manager/club/UI text, transparent or maskable background, no extended anatomy entering the protected aperture, and rejection of any pose that cannot fit rather than moving the live product.

Any resulting art remains `CANDIDATE` until composited back into the actual assembled proposal, rerun through this matrix, and reviewed by the owner.

## Remaining gate

- Owner visual review of the real assembled render remains pending.
- A05/A06 final source art has not been generated or accepted by this proof.
- Club Identity V2.1 98-club deterministic R2 contact-sheet owner review remains separate and pending.
- `main` remains unchanged.
