# Club Assignment Cinematic Consumer — R8.32 Browser Proof

Status: `ASSEMBLED_PROPOSAL / SIX-STATE BROWSER-PROVEN / FINAL ART OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED`

Production anchor: `e624d19e04c0ca56f33fa7f0d25fdcc42eb99eda`

Current cinematic proposal consumer: `prototypes/04d-club-assignment-cinematic-r8-32.html`

Predecessor safety/geometry consumer: `prototypes/04c-club-assignment-mode-b2-assembled-product.html`

## What changed from R8.31

R8.31 proved that two-manager decoration can coexist safely with the live reveal geometry. R8.32 deliberately stops treating the production gray-card presentation as the visual ceiling.

The new `04d` consumer rebuilds the visible presentation language around the current product state contract:

- persistent CM17 cinematic application shell;
- large Club Assignment page identity;
- league-confirmed hierarchy;
- real five-step progress surface;
- two original black/gold sealed-pack frames implemented in HTML/CSS;
- central rivalry/VS hierarchy;
- revealed result faces as DOM surfaces with placeholder result text;
- compact locked-rivalry matchup deck;
- decisive confirm action;
- wide Daniel/Nik noninteractive staging slots;
- responsive character-free mobile/tablet recomposition.

No generated whole-page image is used.

## Product-contract reconciliation

Current production runtime remains:

`ready -> opening -> manager-one -> manager-two -> versus -> confirmation`

The proposal harness exposes `window.cm17ClubProposal.renderStage(stage)` only for deterministic visual QA. It does not draw clubs, save clubs, create timers, call Firebase, write storage or replace the production reveal controller.

The visible state mapping follows current production behavior:

| Stage | Pack 1 | Pack 2 | Open | Confirm | Back |
| --- | --- | --- | --- | --- | --- |
| ready | sealed | sealed | visible/enabled | hidden | visible |
| opening | sealed | sealed | visible/disabled | hidden | hidden |
| manager-one | revealed | sealed | visible | hidden | hidden |
| manager-two | revealed | revealed | visible | hidden | hidden |
| versus | revealed | revealed | hidden | hidden | hidden |
| confirmation | revealed | revealed | hidden | visible/enabled | hidden |

### Contract correction

The current production `renderClubConfirmationState()` calls `setRevealControls(... allowBack:false)`. Therefore **Back is hidden/disabled at confirmation** in current r17.

Any older proposal sentence claiming that Back is restored at confirmation is stale and is superseded by this evidence. Future Screen 04 contract cleanup must carry this correction forward.

## Browser QA

The real R8.32 HTML was run in local Chromium across every reveal stage at four viewports.

| Viewport | States tested | Character staging | Horizontal overflow | State/control assertions | Result |
| --- | ---: | --- | --- | --- | --- |
| 1366x768 | 6 | visible | none | 6/6 pass | PASS |
| 1440x900 | 6 | visible | none | 6/6 pass | PASS |
| 940x700 reduced-motion | 6 | removed | none | 6/6 pass | PASS |
| 390x844 DPR2 | 6 | removed | none | 6/6 pass | PASS |

Total: **24 state/viewport combinations passed**.

Measured horizontal document widths exactly matched their viewport widths: `1366`, `1440`, `940`, and `390` pixels respectively.

Mobile intentionally scrolls vertically because the two live pack surfaces stack rather than being shrunk into an unreadable horizontal tableau.

## Art authority

The current character figures are geometry placeholders only. They are `REFERENCE_ONLY / PLACEHOLDER`, not final Daniel/Nik source assets.

The CSS stadium is also placeholder atmosphere. Final environment/source art may be inserted later without changing state ownership.

Club result text is deliberately `CLUB RESULT A` / `CLUB RESULT B`. No fake club identity is promoted by this harness.

The final deterministic club-identity renderer may occupy the revealed crest/result slots only after the real club result is product-authoritative.

## Safe visual-contact policy in this consumer

R8.32 no longer bans all visual contact. Final character art may visually meet a **stable external pack frame/rail/pedestal** if:

- the contacted surface never determines reveal state;
- the hand remains `pointer-events:none` and absent from accessibility authority;
- the moving/revealed interior surface stays clear of anatomy;
- contact remains stable through the wide-desktop state matrix;
- narrower breakpoints can remove/recompose character art without affecting the live UI.

If those conditions cannot be maintained, use a visible air gap.

## Integration notes for CM

This proposal intends a future presentation adapter rather than a domain rewrite.

Production remains owner of:

- selected league;
- manager names;
- persisted club pair;
- reveal-operation race safety;
- reveal timing/reduced-motion completion;
- integrity checks;
- save success/failure;
- navigation to Showdown Home;
- deterministic club identity data once approved.

The visual layer owns only layout, typography, state styling, pack-frame animation treatment, responsive composition and decorative art.

No production merge/swap is authorized by this proof.

## Next visual work

1. fold this consumer into the canonical Screen 04 contract and remove stale Back-at-confirmation wording;
2. stabilize exact final-art character slots against `04d` rather than `04c`;
3. keep character assets withheld until ticket numbering/identity source authority is reconciled;
4. then extend the shared shell to Create Showdown and League Wheel while continuing per-screen production-contract reads.
