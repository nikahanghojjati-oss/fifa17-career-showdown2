# SOL HLC R3 QUICK CHECK VERDICT
Date: 2026-10-01
Reviewer: GPT-5.6 Sol
Input: `FOR_SOL_5.6_HLC_R3_QUICK_CHECK_2026-10-01.md`

## Verdict

R3 correctly applies D1 through D8 from the prior Sol consistency verdict. The product direction is approved.

Do not run the intake or Home / League / Club builds exactly as written yet. Five small mechanical contradictions remain. They do not require another redesign or another broad reconciliation. Apply the five line-level corrections below as R3.1, preserve everything else, then the HLC package is cleared for execution subject to the existing crest dependency.

## Live repository recheck

Verified immediately before this verdict:

- `main` = `2de237391e17c7de2c6deb606b102b68ee640212`
- `claude-cloud/transfer-tr2-plate-g` = `8fbda036c1d1f7910631964e982705d0f25290c0`
- `claude-cloud/hlc-goals` = `4f5555cc3f6eaf47ee166a9f5822bf7a937f554f`
- R3 brief commit = `ab14d780b3f3115c30526bfd6f6dd3c9b1d0fee2`
- `claude-cloud/crest-v1` = `f57944d5d2ead6e0dced6e024230127b9b61e4ec`

The current `hlc-goals` head is one commit after `ab14d780...`; that extra commit only adds `FOR_SOL_5.6_HLC_R3_QUICK_CHECK_2026-10-01.md`. The four R3 briefs themselves remain the `ab14d780...` versions.

Main and Plate G still match the pinned HLC anchors.

The crest branch has advanced separately. That does not change this HLC document verdict. `ACCEPTED_CREST_SHA` must remain blank until the crest owner-gate flow is actually cleared and the exact accepted SHA is frozen.

## What R3 got right

R3 correctly incorporated the previous eight requested changes:

- D1: authority-file source drift now stops for Sol review.
- D2: Plate G drift now stops instead of silently inheriting a new head.
- D3: intake scope now includes `evidence/`.
- D4: the owner-approved Home `17` shirt icon is a bounded Home-only inline-SVG exception.
- D5: Home fixture authority explicitly includes the Audius exception and deterministic default track.
- D6: League L2 now uses the production-consistent positive spin direction.
- D7: Club pack boxes distinguish intake protection from runtime reveal occlusion.
- D8: the stale “Open item for Sol” wording is gone.

The prior product decisions are also preserved: four visible online Home actions with six production IDs retained in DOM, Audius-only Home, pinned crest dependency, cover-fit `plateToScreen`, hard-restored intake protected boxes, 12 px text floor, monochrome League wheel owner direction, and no main merge.

## Five exact corrections required

### R3.1-1 — Common C5.1 still contradicts the Home Audius exception

Current common C5.1 says:

> Every string, id, role and aria attribute in section S comes from production main.

But Home section S intentionally contains the Sol/owner-approved Audius strings that do not come from current main.

Replace common C5.1 in all three screen briefs with:

> Every live product string, id, role and aria attribute in section S follows production main unless that screen's section S explicitly declares a Sol/owner-approved exception. Home's Audius soundtrack content is the current explicit exception. Where the goal image disagrees with product truth, product truth or an explicit approved exception wins; record each case in the handoff.

This does not change the Audius decision. It only makes the common contract agree with D5.

### R3.1-2 — Intake branch commit instruction omits the required tool script

The intake brief says `tools/intake_hlc.py` is committed in each screen folder, and the scope now allows `tools/`, but the Branches instruction only says to add `assets/` and `evidence/`.

Change the PASS-screen branch instruction so the commit includes:

- `visual-assets/v10_1/<screen>/assets/`
- `visual-assets/v10_1/<screen>/evidence/`
- `visual-assets/v10_1/<screen>/tools/intake_hlc.py`

If `BUILD_RESULT.md` is emitted at screen root under the chosen structure, include it as well.

Do not broaden write scope beyond the R3 intake scope.

### R3.1-3 — Home soundtrack chips conflict with G6 desktop control size

Home H3 currently permits the four soundtrack choice chips to be `min 32 px tall desktop`.

Common G6 requires every desktop control to be at least 40 px.

These soundtrack choices are interactive controls, so change Home H3 to:

> four choices as compact chips in one row or a 2 × 2 grid, each at least 40 px tall on desktop; selected chip gold.

Phone remains 44 px as already specified.

### R3.1-4 — League OWNER-2 monochrome treatment conflicts with “do not restyle”

League W1 correctly requires the owner-approved monochrome wheel treatment and explicitly describes recolouring the crest-build league marks with CSS mask/currentColor.

The next bullet then says:

> Do not draw, edit or restyle league marks yourself.

That can be read as prohibiting the required OWNER-2 transformation.

Replace that sentence with:

> Do not redraw league-mark geometry, alter the source recipes, or invent replacement marks. The OWNER-2 wheel-only monochrome presentation transform defined above is explicitly allowed and required. Outside the wheel, do not restyle the crest-build marks unless separately approved.

Keep `data/leagues.js` untouched.

### R3.1-5 — League fingertip layering needs an explicit G8 exception

League W2 intentionally places Daniel's original fingertip/hand overlay above the wheel and says the wheel may sit under that hand.

But common C5.7 says the only protected-box exception is the Club pack-box exception, and common G8 says face and hand boxes always require 8 px clearance.

Make the intended League composition explicit.

Update C5.7/G8 so there are exactly two bounded runtime exceptions:

1. League-only fingertip/hand layering: in League, the decorative wheel rim/background may pass beneath Daniel's original hand/fingertip overlay required by W2. No live text, wheel-item label, button, status line, or other control may enter the hand protected box. The overlay remains exactly registered through `plateToScreen`. Face boxes remain fully protected.
2. Club-only pack reveal: keep the existing D7 pack-box exception exactly as written.

For League QA, report separately:
- face clearance;
- live-text/control clearance from Daniel's hand box;
- fingertip overlay registration error;
- confirmation that only decorative wheel geometry is beneath the hand.

This resolves the remaining conflict without weakening likeness protection.

## Execution status after R3.1

Once those five edits are committed without changing anything else:

- HLC intake: CLEARED TO RUN, after the required plate files are committed and the pinned Plate G head still matches.
- Home V1: CLEARED TO RUN after Home intake passes.
- League V1: document-cleared, but still blocked until `ACCEPTED_CREST_SHA` is frozen.
- Club V1: document-cleared, but still blocked until `ACCEPTED_CREST_SHA` is frozen.
- Merge to main: still prohibited until the complete visual page set is built, reviewed, and Nik approves it.

No new conceptual review is needed after R3.1. A changed-lines-only verification is sufficient.

## Ready-to-paste instruction for Claude

Apply one bounded R3.1 document patch to the HLC package. Do not run intake or any screen build while making this patch.

Make only these five corrections from `SOL_HLC_R3_QUICK_CHECK_VERDICT_2026-10-01.md`:

1. C5.1: explicitly allow section-S Sol/owner exceptions, with Home Audius as the current exception.
2. Intake Branches: commit `tools/intake_hlc.py` as well as assets/evidence, plus root BUILD_RESULT only if emitted there.
3. Home H3: soundtrack choice chips are at least 40 px tall on desktop.
4. League W1: replace “do not restyle” with “do not redraw/change source geometry; OWNER-2 wheel-only monochrome transform is allowed and required.”
5. C5.7/G8: add the bounded League fingertip/hand layering exception alongside the existing Club pack-box exception, with no live text/control allowed under Daniel's hand.

Preserve every other R3 decision verbatim. Documents only. Do not touch main. Do not run intake. Do not merge visual work into main.

Return the four R3.1 briefs or a minimal patch commit plus a compact five-item change log for a changed-lines-only Sol verification.
