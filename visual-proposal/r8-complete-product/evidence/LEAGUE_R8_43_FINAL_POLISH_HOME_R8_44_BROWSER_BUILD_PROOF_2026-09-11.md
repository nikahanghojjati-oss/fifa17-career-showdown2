# League R8.43 Final Polish + Home R8.44 Browser Build Proof

Status: `ASSEMBLED_PROPOSAL / BROWSER-PROVEN / OWNER REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED`

Date: 2026-09-11

Production `main` was re-resolved before this pass at `3c5fb2589414f8f497d1f7cb174200ef84290431` (`1.9.1-r18`). That commit is accounting/provenance-only for the already-integrated Terminal Close lifecycle. Visual did not modify production `main`, Firebase, Firestore Rules, auth, saves, routing, shared sessions, selection logic, or any other product authority.

No image-generation call was used for R8.43 or R8.44.

## R8.43 — League Wheel final minor polish

Owner feedback identified two remaining defects after R8.42:

1. league SVG marks and league names had inconsistent spacing/alignment, with some visual crowding;
2. the top edge of the gold `SELECT LEAGUE` title was being visually washed/obscured by the bright stadium/light-overlay region.

R8.43 corrects those issues in the real browser assembly:

- all five wheel segments use one consistent mark/name layout grid;
- SVG mark dimensions are constrained consistently so no mark can collide with its league name;
- league-name rows have a common height/alignment baseline;
- the title receives a dedicated clean visual zone and stronger z-order separation from the stadium floodlights;
- the title remains live DOM text; no title raster image was introduced;
- all product selectors/state seams remain unchanged.

The full League matrix was rerun after the correction: six states (`ready`, `spinning`, `selected`, `confirmed`, `locked`, `save-error`) × six viewport conditions = **36/36 PASS**.

The matrix additionally checks mark/name non-overlap, horizontal overflow, title/header clearance, wheel/action clearance, exactly five `.wheelItem` nodes, fallback character removal, and disabled-state presentation.

Persistent R8.43 snapshots are stored at `/Showdown visual/R8_43_League/`:

- `league-r8-43-final-polish.html`
- `R8_43_DESKTOP_1366_READY.png`
- `R8_43_DESKTOP_1366_SELECTED.png`
- `R8_43_BROWSER_QA_36_OF_36.json`

## R8.44 — Home reference-fidelity build

After the League minor correction, Visual moved to the owner's next requested screen: Home / `mainMenu`.

Before building, current r18 production `index.html` was re-read. The real Home product authority is preserved exactly around these six actions and IDs:

1. `#continueCareer` — Continue Career
2. `#newShowdown` — New Showdown
3. `#legacyButton` — Legacy
4. `#careerStatisticsButton` — Statistics
5. `#ruleBookButton` — Rule Book
6. `#settingsButton` — Save Library

The real media surface is also preserved around `#menuMusicPlayer`, `#menuMusicStatus`, `#menuMusicToggle`, and `#menuMusicMute`.

The owner reference contains visual/navigation affordances that are not product features in current production. R8.44 therefore does **not** create functional Search/Profile/global Home/Career/Standings/Stats/Rules/About routes. The proposal instead keeps the current `#topHeader` / `#seasonIndicator` integration seam and applies the reference's lean black/gold cinematic treatment to it.

### Real browser presentation

R8.44 is a real HTML/CSS/SVG browser assembly, not a generated whole-page image. It uses:

- the existing clean stadium-only candidate as environmental source art;
- the frozen A02 Daniel pointing master and A01 Nik thinking master;
- real DOM hero/title copy;
- real DOM action buttons with deterministic original SVG/object treatments;
- real DOM media controls and status;
- real focus/selected states;
- responsive browser layout.

Tile object language remains:

- Continue Career → player/shirt `17` motif;
- New Showdown → tactical-board motif;
- Legacy → trophy motif;
- Statistics → rising data bars;
- Rule Book → notebook/tactical-document motif;
- Save Library → local save-drive motif.

No new source image was generated for these objects.

### Product-truth correction

An early local R8.44 draft visually reproduced the reference's progress strip as a fake percentage. That was rejected before owner review because current Home does not own such a progress value.

The final R8.44 QA assembly instead exposes truthful deterministic presentation modes only:

- `active`: Continue Career is available/primary and status reads `ACTIVE SHOWDOWN READY`;
- `empty`: Continue Career is disabled, New Showdown becomes primary, and status reads `NO ACTIVE SHOWDOWN · START A NEW RIVALRY`.

These are QA presentation states only. Production remains authoritative for the actual resumable/no-resume condition and season indicator.

### Quantitative geometry

Wide-desktop character placement was measured against the owner-supplied Home reference instead of being adjusted only by eye. At an equivalent 1366×768 composition, approximate face-anchor boxes were:

- Daniel reference target: x≈600, y≈151, width≈182; R8.44 browser: x≈596, y≈144, width≈194;
- Nik reference target: x≈886, y≈97, width≈207; R8.44 browser: x≈892, y≈102, width≈202.

These measurements are composition/geometry evidence only, not biometric identity authority.

Manager labels were also moved into the corresponding reference-like negative-space regions rather than being allowed to overlap faces, tiles, or media controls.

### Browser matrix

R8.44 exercised two Home modes (`active`, `empty`) across six viewport conditions:

- 1440×900 DPR1
- 1366×768 DPR1
- 1280×720 DPR1
- 1179×800 DPR1
- 940×700 DPR1 reduced motion
- 390×844 DPR2

Result: **12/12 PASS**.

Checks include:

- no horizontal overflow;
- exactly six real action tiles;
- Play and Mute media controls present;
- Continue disabled only in `empty` mode;
- correct primary/gold action per state;
- character/manager artwork fails closed at `<=1179px` before it can compress the product UI;
- mobile remains vertically scrollable and all six actions remain reachable.

Persistent R8.44 owner-review snapshots are stored at `/Showdown visual/R8_44_Home/`:

- `home-r8-44-reference-fidelity.html`
- `R8_44_DESKTOP_1366_ACTIVE.png`
- `R8_44_DESKTOP_1366_EMPTY.png`
- `R8_44_MOBILE_390_ACTIVE_FULL.png`
- `R8_44_BROWSER_QA_12_OF_12.json`

## Image-generation rule

Image generation remains locked. Existing source art was sufficient to execute R8.43 and the first R8.44 Home rebuild. A future generation call is permitted only if Sol identifies a specific source-art deficiency that cannot be solved reasonably with existing accepted/candidate source art or deterministic DOM/SVG, and only after a bounded asset ticket is written.

Whole-screen concepts remain reference material only and cannot become implementation authority.

## Integration gate

Home and League remain visual proposals. Owner review comes before CM reconciliation, and CM reconciliation comes before any production integration. The proposal QA harness must never be copied into production as a second product/state engine.