# SOL HLC R3 QUICK CHECK VERDICT
Date: 2026-10-01
Reviewer: GPT-5.6 Sol
Input: FOR_SOL_5.6_HLC_R3_QUICK_CHECK_2026-10-01.md

## Verdict

R3 correctly applies D1 through D8 from SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01.

I am not authorizing the HLC intake or the Home, League, or Club builds from this exact R3 package yet. I found three bounded mechanical corrections that should be applied before execution. They do not change the approved product behavior, visual direction, screen ownership, branch strategy, or the no-main-merge rule.

After these three corrections, this package should be treated as R3.1 or R4 and returned for one final quick Sol mechanical check only. No new conceptual redesign is requested.

## D1 through D8 result

D1 PASS. Source drift now stops if any screen authority file changed, while harmless main movement can continue only when the relevant authority files are unchanged.

D2 PASS. Plate G is pinned to 8fbda036c1d1f7910631964e982705d0f25290c0 and a moved live head now causes PLATE_G_SOURCE_DRIFT instead of being silently accepted.

D3 PASS. Intake scope now includes assets, tools, and evidence.

D4 PASS. The Home-only owner icon exception is narrow and mechanically legal. The four Home tile icons are inline SVG decorative art, the anonymous back-facing 17 shirt figure is allowed only for Continue, and no raster-icon exception was introduced.

D5 PASS. Home now has explicit combined fixture authority: current-main Home product truth plus the approved Audius exception, including the four tracks and the default WHAT YOU GOT selection.

D6 PASS. League L2 now uses a positive whole-turn-plus-offset mid-spin sample consistent with production spin direction while L3/L4 normalization remains unchanged.

D7 PASS. Club pack boxes are now correctly separated from face/hand runtime clearance. Only the bounded aria-hidden pack reveal treatment may enter the two pack boxes in CL3 through CL6.

D8 PASS. The stale open-item wording is gone and the phone brand rule is resolved.

The R3 self-check also correctly preserves the blank ACCEPTED_CREST_SHA dependency and reports the common blocks as identical.

## Live authority recheck

I re-resolved the repository before this verdict.

main is still:
`2de237391e17c7de2c6deb606b102b68ee640212`

claude-cloud/transfer-tr2-plate-g is still:
`8fbda036c1d1f7910631964e982705d0f25290c0`

claude-cloud/hlc-goals is now:
`4f5555cc3f6eaf47ee166a9f5822bf7a937f554f`

That HLC goals movement is expected: it is one commit ahead of `ab14d780...`, and the only changed file in that commit is the R3 FOR_SOL quick-check package itself.

The crest branch has advanced beyond the earlier owner-gate state, but no final ACCEPTED_CREST_SHA is recorded in the HLC package. Do not infer or auto-fill one. League and Club remain blocked until the exact accepted crest commit is frozen after the required crest approval chain.

## Three exact corrections still required

### D9. League fingertip layering must be explicitly legal in C5.7 and G8

Problem:

League W2 intentionally puts the wheel behind Daniel's pointing fingertip and restores the original finger pixels with `OVL_DANIEL_FINGER_V1_*`.

However, common C5.7 now says that face and hand protected boxes always require at least 8 px clearance and says the Club pack exception is the only exception. G8 likewise describes face/hand clearance without explicitly encoding the League fingertip layering case.

That leaves a direct ambiguity: W2 requires the wheel to pass beneath the protected pointing hand, while the common wording can be read as forbidding any geometric overlap.

Required correction:

Add a narrow League-only exception to C5.7 and G8. Use this meaning:

> League-only fingertip layering exception: on the League screen, the aria-hidden wheel/rim may geometrically pass beneath Daniel's pointing-hand protected region only where the registered `OVL_DANIEL_FINGER_V1_*` overlay restores the exact original plate pixels above the wheel. No wheel pixel may remain visually over the hand after compositing. No live text, control, or panel may enter the face/hand protected box. All other face/hand protected boxes retain the normal 8 px clearance rule.

In League W2, keep the 0 px registration requirement.

In G8 reporting, add a League-specific check:

> For League, report the wheel/hand overlap region, verify that it is fully contained by the finger-overlay alpha coverage, and verify 0 px overlay registration error. Live text/control/panel intersection with the hand box remains zero.

Do not broaden this into a general face/hand exception.

### D10. League monochrome mark method is internally contradictory and the suggested mask can destroy the mark

Problem:

League W1 correctly requires the crest-v1 league marks to appear in one monochrome wheel language.

But the same paragraph says to use CSS mask-image or strip fills to currentColor, then says not to draw, edit, or restyle the marks.

The wording is internally inconsistent.

More importantly, the live crest-v1 `visualIdentity.js` league marks contain opaque framed backgrounds and internal filled geometry. Treating the entire returned mark image as one mask, or converting every fill to one identical currentColor, can collapse the internal motif into a mostly featureless rounded block and lose the mark's internal design.

Required correction:

Replace the implementation sentence and the later "do not restyle" sentence with this rule:

> League marks must come only from `getLeagueMark(id)` / `applyLeagueMark` at the pinned ACCEPTED_CREST_SHA. Preserve the exact source geometry and do not redraw, substitute, or invent any mark. The wheel is allowed and required to apply a presentation-only monochrome treatment. Preserve internal tonal separation so the mark motif and country code remain legible. Preferred methods are a deterministic CSS grayscale/tint/brightness/contrast treatment on the returned mark image, or a deterministic paint mapping of the returned SVG that maps its existing fills/strokes into tonal values inside the target monochrome family. Do not use a whole-mark alpha mask or one-flat-color fill replacement unless a visual assertion proves the internal mark remains legible.

State rules remain:

Unselected wedge: dark wedge, mark and name in an off-white / faded pale-gold monochrome family.

Selected wedge: gold wedge, mark and name in a near-black monochrome family.

Add a W1 QA assertion or handoff note that all five marks retain recognizable internal motif separation after the monochrome treatment.

This preserves owner direction and crest-v1 geometry without creating new marks.

### D11. Intake reproducibility needs two wording fixes

First issue:

The Home source is `GOAL_HOME.png`, but intake step 6 says "Copy the original as REF_GOAL_<SCREEN>.jpg". A literal file copy would produce PNG bytes under a `.jpg` name.

Replace step 6 with:

> Export the untouched goal reference as `REF_GOAL_<SCREEN>.jpg`. If the source is already JPEG, copy or losslessly re-encode as appropriate. For Home, convert `GOAL_HOME.png` to a real JPEG file; do not rename PNG bytes to `.jpg`. This reference is evidence/composition-only and must not be shipped as product art.

Second issue:

The per-plate section says `tools/intake_hlc.py` is committed in each screen folder, and SCOPE allows `tools/`, but the Branches paragraph lists only `assets/` and `evidence/` when describing what gets added to each PASS branch.

Amend the Branches paragraph so each PASS branch explicitly includes:

`visual-assets/v10_1/<screen>/assets/`
`visual-assets/v10_1/<screen>/tools/intake_hlc.py`
`visual-assets/v10_1/<screen>/evidence/intake_*`

plus the intake report in its declared location.

This makes the deterministic intake reproducible from each resulting screen branch.

## Items that should not change

Preserve all R3 decisions that already passed:

1. Four visible online Home actions while all six product IDs remain in the DOM.
2. Audius-only Home with the four approved tracks and no YouTube, trailer, iframe, autoplay, or playing-state fixture.
3. Owner-directed Home tile icon language.
4. Product-first strings and behavior.
5. Cover-fit `plateToScreen`.
6. Hard-restored intake faces, hands, packs, and keep rects.
7. Cloud-only deterministic intake.
8. 12 px visible-text floor.
9. Plate G pinned to `8fbda036...`.
10. League production order and rotation contract.
11. League monochrome wheel-mark visual direction.
12. Club pack reveal exception, bounded to the pack boxes.
13. Daniel always left and Nik always right.
14. No production/main merge. Visual work may continue only on the isolated visual branches.

## Run authorization

Plate generation remains allowed.

HLC intake: HOLD only until D11 is applied and the corrected package receives the final quick Sol check.

Home V1: HOLD until corrected intake passes. No additional Home-specific product-truth correction is required by this verdict.

League V1: HOLD until D9 and D10 are applied, League intake passes, and the exact ACCEPTED_CREST_SHA is frozen.

Club V1: HOLD until Club intake passes and the exact ACCEPTED_CREST_SHA is frozen. No new Club-specific brief correction is required by this verdict.

Merge to main remains prohibited.

## Ready-to-paste instruction for Claude

Revise the HLC R3 package once more as R3.1 or R4. This is documents-only work. Do not run intake or any Home, League, or Club build yet.

D1 through D8 are accepted and must stay unchanged.

Apply only these three bounded corrections:

D9: make the League fingertip-over-wheel layering explicitly legal in common C5.7 and G8. The wheel may pass beneath Daniel's pointing-hand region only where `OVL_DANIEL_FINGER_V1_*` restores the exact original plate pixels above it. No live text, controls, or panels may enter the hand box. Add QA for full overlay containment and 0 px registration. Do not broaden the exception.

D10: fix League W1's monochrome-mark method. Keep every mark sourced only from the pinned crest-v1 API and preserve its exact geometry. Do not use a whole-mark alpha mask or flatten every fill to one identical color if that destroys internal motif separation. Use a deterministic monochrome grayscale/tint/brightness/contrast treatment or deterministic tonal paint mapping of the returned SVG so the internal motif and country code remain legible. Unselected remains off-white/faded pale gold on dark; selected remains near-black on gold. Clarify that this presentation recoloring is explicitly allowed while redrawing/substituting mark geometry is forbidden.

D11: make intake reproducible. Step 6 must create a real JPEG for `REF_GOAL_HOME.jpg` from the PNG source rather than renaming PNG bytes. In the Branches section, explicitly include `tools/intake_hlc.py` in every PASS screen branch alongside assets and evidence.

Preserve every other R3 decision, including the blank `ACCEPTED_CREST_SHA` placeholder. Do not infer a crest acceptance SHA. Do not touch main. Do not merge visual work into main.

Return:
1. the compact R3.1/R4 change log,
2. the corrected intake brief,
3. the corrected Home brief,
4. the corrected League brief,
5. the corrected Club brief,
6. a short self-check proving D9 through D11 are present and D1 through D8 were not regressed.

No build run yet.
