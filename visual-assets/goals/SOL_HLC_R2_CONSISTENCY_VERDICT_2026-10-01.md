# SOL HLC R2 CONSISTENCY VERDICT
Date: 2026-10-01
Reviewer: GPT-5.6 Sol
Input: FOR_SOL_5.6_HLC_R2_CONSISTENCY_2026-10-01.md

## Verdict

R2 is substantially aligned with the 2026-09-30 Sol verdict, but it is not yet approved to run as written.

The major decisions were applied correctly:
- four visible Home actions while preserving all six production IDs;
- Audius-only Home direction;
- pinned accepted crest SHA for League and Club;
- cover-fit plate mapping;
- hard-restored protected boxes during intake;
- Cloud-only intake;
- 12 px text floor;
- updated Plate G base;
- owner override for the Home Continue icon.

I found eight exact consistency/mechanical deltas. They are bounded document corrections. No screen build should run until Claude applies them and returns R3 (or R2.2) for a quick Sol check.

## Live authority recheck

Re-resolved live repository state before this verdict:

- `main` = `2de237391e17c7de2c6deb606b102b68ee640212`
- `claude-cloud/transfer-tr2-plate-g` = `8fbda036c1d1f7910631964e982705d0f25290c0`
- `claude-cloud/hlc-goals` = `d2cfb313712f273eacde65dfbf14b8c3212baeaf`
- `claude-cloud/crest-v1` = `c3e1834792d7823ed02587d68c9e037e7974fce8`

`main` and Plate G are unchanged from the R2 anchors.

`hlc-goals` moved because the R2 documents and ticket edits were committed there. That is expected.

`crest-v1` has advanced: the 14-owner-gate crest revision is now implemented at `c3e1834...`. Its handoff reports 14 revised crests DONE and the mechanical checks passing. The accepted crest SHA must still remain unfilled until Claude visual verification, Sol crest clearance, and Nik's final owner look are complete.

## Exact deltas required

### D1 — Source drift must not silently change approved product truth

Current common C2 says that if `origin/main` moved, the worker should diff the named files, use the new strings, and continue.

Replace that rule in Home, League, and Club with:

> `git fetch origin main`. Approved product anchor is `2de237391e17c7de2c6deb606b102b68ee640212`. If `origin/main` differs, diff only the section-S authority files for this screen. If none of those files changed, record `SOURCE_DRIFT: <new sha> (no relevant authority-file changes)` and continue. If any authority file changed, STOP before implementation and return `SOURCE_DRIFT_REVIEW_REQUIRED` with the changed paths and diff summary for Sol. Do not silently adopt new product behavior or strings.

Reason: an approved visual brief cannot automatically absorb a later product-behavior change without another product-truth gate.

### D2 — Plate G drift must not be accepted blindly

The intake brief currently says to use the live Plate G head if it moved.

Replace with:

> Resolve `claude-cloud/transfer-tr2-plate-g`. Expected base is `8fbda036c1d1f7910631964e982705d0f25290c0`. If the live head differs, STOP and report `PLATE_G_SOURCE_DRIFT` with the expected SHA, live SHA, and changed-path list. Do not cut HLC branches from an unreviewed newer Plate G head.

Current live head still equals the expected SHA, so this correction costs nothing now and prevents future accidental inheritance.

### D3 — Intake scope omits its own evidence directory

The intake task header currently limits writes to:

`visual-assets/v10_1/{home,league,club}/assets/ and tools/`

but later requires `evidence/intake_<screen>.json` and side-by-side evidence.

Change intake SCOPE to:

> write only `visual-assets/v10_1/{home,league,club}/{assets,tools,evidence}/` plus that screen's `BUILD_RESULT` / intake report file if the chosen folder structure places it at screen root.

Keep main, PRs and production files forbidden.

### D4 — Owner Home icon override conflicts with three common rules

Home H2 correctly records Nik's override for the Continue tile's player-with-17 icon, but the shared rules still say:
- no people other than Daniel and Nik;
- the only new rasters may be crops from the plate;
- G9 imagery allows plates/plate overlays/wordmark/fonts/SVG only.

Make the override mechanically legal and narrow.

Preferred correction:

> Home-only icon exception: the four action-tile icons are `aria-hidden` decorative UI art derived from Nik's supplied Home goal. Prefer inline SVG redraws matching the goal silhouettes/shapes. Do not create photographic player art. The Continue icon may depict the goal's anonymous back-facing `17` shirt figure. This exception does not authorize any additional person in the plate/world scene and does not apply to League or Club.

Then:
- C5.4 should explicitly exempt this Home-only anonymous decorative icon.
- C5.5 should require inline SVG redraws for these icons, avoiding new raster-icon exceptions.
- H2 should remove the option to crop the icons into new PNGs.
- G9 should allow the four inline/data SVG Home tile icons.

This keeps the owner override and restores consistency with the asset rules.

### D5 — Home Audius strings need an explicit fixture exception

Home H0 says fixtures are built from main's strings, while Home S intentionally overrides main's YouTube catalog with the owner-approved Audius direction.

Clarify:

> Home fixtures = current-main Home product strings + the explicit Sol/owner-approved Audius exception in section S. The four Audius track titles/artists, source label `AUDIUS`, and Audius status/control strings are authoritative for this static Home visual prototype even though main still carries the old YouTube catalog.

Also define the static default selection:

> Default selected track in HM1/HM2/HM3: `WHAT YOU GOT — Valentino Khan & NITTI`.

G1 should compare against that combined fixture authority, not claim every expected string came from main.

### D6 — League L2 rotation sign is inconsistent with production spin direction

The brief's L2 fixture currently uses a negative mid-spin angle:

`−(2 × 360 + 3 × 72 + 31)°`

Production explicit spin uses:

`getLeagueRotation(selected.id, 5)` = positive whole turns minus selected-index offset.

Keep L2 as a static presentation frame, but make its direction consistent with production. For example:

> L2: static mid-spin track at `+(2 × 360 − 3 × 72 + 31)°` for the illustrative Serie A mid-spin sample, or another positive whole-turn-plus-offset angle. The exact L2 angle is presentation-only; its rotation direction must match production.

Do not change L3/L4 normalization. Bundesliga at `−144°` after spin remains correct.

### D7 — Club pack protected boxes conflict with the reveal overlay gate

The Club intake correctly protects the held packs as original pixels, but Club K3 intentionally places crest/light/torn-edge reveal art over those pack regions. Common C5.7/G8 currently forbids UI intersection with every protected box, which would make CL3-CL6 fail by design.

Split intake protection from runtime occlusion authority:

> Intake: face/hand/pack protected boxes are all hard-restored original pixels.
>
> Runtime G8: face and hand protected boxes always require ≥8 px clearance. The two pack boxes are an explicit Club-only exception for K3's `aria-hidden` pack-open treatment in CL3-CL6. Only the bounded reveal treatment may enter those pack boxes; live text, controls and panels may not. CL1/CL2 keep the pack pixels unobscured except for the allowed transparent positioning shell.

The QA report should separately report:
- face/hand clearance;
- pack overlay containment inside each pack box;
- zero live-text/control intersection with pack boxes.

### D8 — Remove stale “open item for Sol” wording

Common C6 still says the phone brand treatment is an “Open item for Sol, see D.”

That item was already approved as HLC-R1.6.

Delete the stale parenthetical in all three briefs. The rule should simply state:
- desktop shows badge + product brand;
- phone may visually hide brand text and retain the CM17 badge.

## Items confirmed consistent

No further product-truth change is required for these parts:

- HLC-M1: no goal-only nav tabs/icons.
- HLC-M2 / SOL-HLC-1: six Home IDs remain in DOM; four are visible in online product surface.
- HLC-M3: no loading/local-save claim on Home.
- HLC-M4: production league order/rotation contract retained.
- HLC-M5 / SOL-HLC-3: exact accepted crest SHA, no floating branch merge.
- HLC-M6/M7: confirmation copy stays out of CL1; league name stays visible.
- HLC-R1.2: phone hiding is applied to the corrected four-visible-action Home surface.
- HLC-R1.3/R1.4/R1.5/R1.6: accepted presentation substitutions remain bounded.
- HLC-R2/R3/R5: decorative slogans, CM17 branding and no Marco Reus remain acceptable.
- HLC-R4 / SOL-HLC-6: Cloud intake is the only deterministic intake path.
- HLC-R6 / SOL-HLC-2: Audius-only direction is correctly carried forward.
- SOL-HLC-4: `plateToScreen` cover-fit mapping is now correctly defined.
- SOL-HLC-5: intake hard-restores keep rects and protected boxes.
- SOL-HLC-7: 12 px visible-text floor is correctly propagated.
- OWNER-1: Nik's Continue icon override is accepted once D4 makes its scope mechanically consistent.

## Crest status update

The run-order dependency has advanced since the R2 file was written.

Current `claude-cloud/crest-v1` head is:

`c3e1834792d7823ed02587d68c9e037e7974fce8`

The owner-gate revision implementation is now present. The branch handoff reports:
- 14 revised crests;
- 11 motif changes;
- 98 recipes retained;
- crest contract PASS;
- static release contract PASS;
- full contract suite PASS;
- browser review pages clean.

This does not make `c3e1834...` the accepted crest SHA by itself. The HLC placeholder stays blank until:
1. Claude performs the visual verify,
2. Sol reviews the crest result,
3. Nik gives the final owner look.

Only then freeze the exact accepted SHA into League/Club.

## Run authorization after the document correction

Current status:

- Plate generation: allowed.
- HLC intake: HOLD until D1-D3 and D8 are incorporated.
- Home V1: HOLD until D1, D4, D5 and D8 are incorporated and Home intake passes.
- League V1: HOLD until D1, D2, D6, D8 are incorporated, League intake passes, and ACCEPTED_CREST_SHA is frozen.
- Club V1: HOLD until D1, D2, D7, D8 are incorporated, Club intake passes, and ACCEPTED_CREST_SHA is frozen.
- Merge to main: still prohibited.

After Claude returns corrected documents, Sol only needs a quick consistency pass; no new conceptual redesign is requested.

## Ready-to-paste instruction for Claude

Revise the HLC R2 package once more. Apply D1 through D8 from `SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01.md` exactly. This is documents-only work. Do not run intake or any Home/League/Club build yet.

Preserve all R2 decisions already accepted. In particular:
- four visible online Home tiles;
- Audius-only Home;
- pinned accepted crest SHA;
- cover-fit `plateToScreen`;
- hard-restored intake protected boxes;
- Cloud-only intake;
- 12 px visible-text floor;
- owner-approved Home icon language.

Return the corrected intake/Home/League/Club briefs plus one compact change log. Do not touch main and do not merge any visual work into main.
