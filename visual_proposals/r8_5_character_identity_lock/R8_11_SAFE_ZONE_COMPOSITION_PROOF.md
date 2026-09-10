# R8.11 Safe-Zone Composition Proof

Status: COMPLETE PROPOSAL PROOF / NON-OPERATIONAL

Runtime authority at proof seal:

- live `main`: `1d0c9f9d6542cd020a4aae53998cb6daeba380e4`
- asset revision: `1.9.1-r10`
- live DOM authority: current `index.html`
- live CSS authority: current `css/app.css`
- visual proposal branch: `visual/r8-5-approved-character-identity-lock`

This proof answers the two questions left open by R8.10:

1. Can the approved Nik and Daniel character truth be integrated into Home, Create Showdown and League Wheel without covering live controls?
2. Does Club Assignment genuinely require bespoke pack-interaction character poses?

No generated character art was used to answer these questions. The proof uses live DOM geometry, the current CSS dimensions and abstract character occupancy zones only.

## Baseline geometry resolved from r10

The current app uses a safe width up to 1510px. The Home menu is a 12-column grid. Create Showdown centers a 520px setup card in current production CSS. League Wheel centers a 700px container with a wheel up to 390px. Club Assignment centers a 980px shell containing two pack cards, versus state, progress rail and CTA controls.

The R8.10 black/gold prototype widens Create Showdown to at most 620px but otherwise leaves the central authority model intact. Real controls retain a higher z-index than future art layers.

## Proof rule

Character art is never allowed to own layout authority. It is placed in a non-interactive background/final-art layer. If a character conflicts with a button, input, wheel label, pack card, status message or focus ring, the art is cropped, faded or omitted.

Desktop proof viewport: 1600 x 900 reference canvas.

Tablet proof behavior: 760 to 1179px.

Mobile proof behavior: below 760px.

These are proposal breakpoints, not runtime behavior changes.

## P01 Home

Live authority:

- `#mainMenu`
- `.fifaMenuHeading`
- `.fifaMenuGrid`
- six real `.menuTile` controls
- `.menuMusicTile`
- `.menuBottomStrip`

Constraint discovered: Home is the tightest character-composition surface because the 12-column tile grid intentionally occupies nearly the whole usable width.

Passing composition:

- Nik and Daniel can exist as upper-body/background framing, not foreground cards.
- Faces and shoulders may occupy the upper outer quadrants and atmospheric space behind the shell.
- Lower torso/arms must disappear behind opaque/semi-opaque real tiles rather than cross tile labels or hit areas.
- No hand gesture may sit over `#continueCareer`, `#newShowdown`, the five secondary menu tiles, or media controls.
- Home therefore needs clean isolated character masters with generous transparent padding; it does not need Home-specific poses.
- On tablet, crop to head/shoulder presence only.
- On mobile, omit large figures.

Result: PASS with constrained background framing.

Asset implication: A01/A02 are reusable here. A separate Home character asset is prohibited.

## P02 Create Showdown

Live authority:

- `#createShowdown`
- `.setupBox`
- `#showdownName`
- `#managerOne`
- `#managerTwo`
- `#roundAmount`
- `#startShowdown`
- Back

Production center card: 520px max. R8.10 proposal center card: 620px max.

Passing composition at 1600px:

- 620px central card leaves roughly 490px on each side before accounting for screen padding.
- A left character can occupy a restrained outer rail without touching labels/inputs.
- A right character can do the same.
- Character hands must remain outside the form card bounds.
- Primary Start Showdown CTA remains unobstructed.
- Tablet uses shoulder crops behind the outer shell or omits one/both if space becomes tight.
- Mobile uses no large figures.

Result: STRONG PASS.

Asset implication: A01/A02 are sufficient; no Create-specific generation.

## P03 League Wheel

Live authority:

- `#leagueWheelScreen`
- `.wheelContainer`
- `.wheelPointer`
- `#leagueWheel`
- `.wheelTrack`
- five `.wheelItem` labels
- `#selectedLeague`
- `#leagueStateNote`
- `#spinLeague`
- Back

Production center container: 700px max.

Passing composition at 1600px:

- A 700px central container leaves approximately 450px of gross side space on each side.
- Daniel's established pointing pose is compositionally useful on the left because the gesture can terminate near, but never inside, the wheel container.
- Nik's established thinking pose balances the right side without requiring a reaching hand.
- `#spinLeague` remains below the wheel and inside the central content layer; no character body or hand enters the lower CTA band.
- Shared host/waiting/locked messages remain readable in `#leagueStateNote`.
- Tablet crops the characters before reducing wheel/control clarity.
- Mobile omits full figures.

Result: STRONG PASS.

Asset implication: A01/A02 are the correct reusable core pair; no League-specific characters.

## P04 Club Assignment

Live authority:

- `#clubWheelScreen`
- `.clubAssignmentShell`
- `#clubAssignmentLeague`
- `#clubPackStatus`
- `.clubRevealProgress`
- `#clubCardOne`
- `#clubCardTwo`
- `.clubVs`
- `#clubRivalryConfirmation`
- `#openClubPack`
- `#continueClubAssignment`
- `#clubAssignmentBack`

Production center shell: 980px max.

Passing composition at 1600px:

- 980px center shell leaves approximately 310px gross side space on each side.
- This is enough for restrained head/shoulder or narrow upper-body character framing at the extreme edges.
- It is not a reason to make characters physically hold or touch the pack cards.
- The two real pack cards, reveal progression, versus state and CTA are already a complete interaction story.
- Adding hands that reach into the 980px shell would reduce safe-zone reliability and compete with the live reveal mechanics.
- Tablet and mobile should remove large character art on this screen before compressing pack UI.

Result: PASS without interaction poses.

Asset implication: C01 `NIK_CLUB_PACK_INTERACTION` and C02 `DANIEL_CLUB_PACK_INTERACTION` are CANCELLED. They are unnecessary for the mapped r10 product and would create more obstruction risk than value. A01/A02 may be used only as restrained edge framing; the screen may also omit characters entirely at narrower widths.

## A01/A02 extraction versus final isolated master decision

The approved visual truth currently exists primarily in accepted composites and deterministic facial reference crops. Those sources are excellent identity evidence but do not provide a clean, reusable, high-resolution transparent full/three-quarter body master with neutral background separation suitable for all four passing compositions.

Therefore the layout proof establishes a real production need for final isolated core masters.

A01 decision:

- finalization justified
- one Nik only
- thinking/core pose
- transparent or easily maskable background
- generous edge padding
- no UI, text, trophy, stadium signage or embedded logos
- Tier 0 CM17 AI identity/style references remain authority
- the previously owner-liked isolated Nik direction should be edited/reused if available rather than casually recast

A02 decision:

- finalization justified
- one Daniel only
- established pointing/core pose
- same isolation/padding rules
- Tier 0 Daniel pointing/main references remain authority

This does not authorize a multi-character or multi-expression batch. A01 and A02 are separate asset tasks.

## Responsive proof conclusion

Desktop wide >= 1180px:

- Home: upper/background character framing only
- Create: full/three-quarter side framing allowed
- League: full/three-quarter side framing allowed
- Club: narrow outer-edge framing only

Tablet 760-1179px:

- crop to shoulders/head first
- opacity may reduce
- character art may be omitted per screen if it approaches controls

Mobile < 760px:

- omit full character figures on all four proof screens
- use CSS atmosphere and optional small deterministic identity chips only

## Control-obstruction decision

PASS for all four screens under the rule that art loses before UI.

No live DOM control needs to move solely to preserve character art.

## Asset gate outcome

- A01 NIK_CORE_THINKING_HERO: FINAL ISOLATED MASTER REQUIRED; one-character generation/editing is now justified when roadmap reaches asset production.
- A02 DANIEL_CORE_POINTING_HERO: FINAL ISOLATED MASTER REQUIRED; one-character generation/editing is now justified after A01 freeze.
- C01 NIK_CLUB_PACK_INTERACTION: CANCELLED.
- C02 DANIEL_CLUB_PACK_INTERACTION: CANCELLED.
- Home-specific pose: NOT REQUIRED.
- Create-specific pose: NOT REQUIRED.
- League-specific pose: NOT REQUIRED.

Required unique character-master ceiling drops from 6 + up to 2 conditional to exactly 6 planned masters for the current r10 runtime.

## Next roadmap task

The safe-zone proof is complete. The next task is A01 core-master finalization because the proof has now supplied the missing generation justification.

Before invoking image generation, resolve the best existing owner-liked isolated Nik candidate/reference set and build the exact A01 generation/edit brief from the Tier 0 identity lock. Generate or edit one Nik only. Do not generate Daniel in the same call. Do not build a board or webpage. After owner approval, freeze A01 by exact file/hash in the asset ledger before beginning A02.

No production file is linked or changed by this proof.