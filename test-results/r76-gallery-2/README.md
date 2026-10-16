# JOB-1839 r76 gallery refresh

Open [index.html](index.html) with the sibling `before/` and `after/` folders present. This is a static, unhosted review artifact.

Workbench SHA: `8964ede717bc1f1a128553c9ee1fbe8f6c866974`

Before: live r75 `main` at `3f6b1c97ec20bd74c74a8330c0222511ecc02f6f`. After: final r76 `gameplay/bug-list-1` at the workbench SHA above. Both refs were rechecked after capture and were unchanged.

69 pairs / 138 WebP pictures: all 14 supplied core screens plus New Showdown; Loading; Daniel/Nik/Draw/completion-pending Final Winner; phone HONOURS; Champion after published Results; Home season-2 tile/chip; midway THIS SHOWDOWN Standings and Rivalry; completed-career Statistics with its rivalry button; phone Trophy Room MORE; Home and Connect Players free-limit states; Club confirmation; all four Transfer phases; and the lower Results review/actions area.

1920×1080 and 393×852 for every screen/state; 844×390 for Home, Career Statistics, Trophy Room and Standings, including midway/season-2/quota variants. DPR 1, local fonts, en-US. Main scroll positions are preserved in explicit Results-bottom pictures. Every image is a viewport capture.

## Tools and scope

Copied the factory gallery tools/fonts to `/tmp/gallery`, as requested. PR #855's branch contains the images/manifests/README but no committed capture scripts. Reused its documented extra-screen inventory and reconstructed the absent `screens.cjs` from the repository browser audits. Corrected only temporary paths, exact sizes, Chromium launch, WebP conversion, routes and the before/after builder. Seeded the repository's active-Showdown and multi-Showdown career fixtures through real renderers/read-only provider doubles. Provider/media traffic is blocked, and no real Firebase project is used.

Initial temporary setup errors (already-assigned clubs preventing League navigation; an empty quota transaction; inconsistent preview winner snapshots) were corrected before the final pass. The final pass captured all 69 states per branch once with no failures or retries. No product source or existing test was edited. No failing product check was fixed, skipped or retried.

## Differences

25 image pairs differ in pixels; each affected screen is listed below. Small raster/countdown differences are not claimed as gameplay fixes. The complete filename-level inventory is [comparisons.json](comparisons.json).

| Screen/state | Before → after |
| --- | --- |
| Home | Same visible Home content; small raster differences in the desktop capture. |
| New Showdown | Same signed-out setup and controls; small phone text/raster differences. |
| Select League | Same wheel, title and controls; desktop text/raster differences. |
| Transfer Challenge — live window | Live countdown sampled one second apart on desktop; other three phases are identical. |
| Season Results — top and bottom | Same review figures/actions; small desktop text/entrance raster differences. Phone views are identical. |
| Champion after published Results | REVIEW SEASON appears beside BACK TO SHOWDOWN HOME on desktop and phone; r75 had only the Home exit. |
| Rivalry Statistics — completed | Same 9–0 completed figures; small desktop raster differences. |
| Rivalry Statistics — mid Showdown | Loading/unavailable becomes the committed 6–3 totals, season W/D/L and trophies in both sizes. |
| Trophy Room | Same cabinet figures and records; tiny desktop raster differences. Portrait cabinet, touch-opened MORE and landscape are identical. |
| Career Statistics | CURRENT RIVALRY STATISTICS appears without a local active Showdown at all three sizes; career figures stay the same. |
| Home — season 2 of 3 | Header chip changes from season 1 to 2; desktop Continue metadata follows shared progression. Portrait and landscape header changes are captured. |
| Standings — THIS SHOWDOWN mid Showdown | Disabled/loading becomes an enabled THIS SHOWDOWN tab, 6–3 committed score, season 2 of 3 and seven standings rows at all three sizes. |
| Home — free-limit notice | r76 automatically shows the exact quota message. At 393×852 and 844×390 it clears soundtrack controls and every visible button; r75 shows no automatic Home notice. |
| Connect Players — free-limit notice | Same inline quota text and controls; small desktop raster differences. Phone views are identical with no leaked Home notice. |

## Validation

All 69 before/after pairs are present, linked and exact size; all 138 pictures are WebP. Final settled captures recorded zero page errors and zero broken images. The HTML passed at widths 1440 and 393 with 138 loaded images, 69 side-by-side comparisons and no horizontal overflow. [quota-check.json](quota-check.json) confirms both requested phone notices are visible and overlap no soundtrack control or visible button. [validation.json](validation.json) records the checks.

```text
node scripts/pos10-syntax.mjs
POS10 syntax: 356 active source files, 0 failures

npm run -s test:contracts
PASS POS10 selected deterministic census (210/210 current blocking contracts: frozen POS10 floor + POS20 supplements).

npm run -s test:ops
ℹ tests 73
ℹ pass 73
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0

node tests/contracts/firestore-budget-contracts.cjs
PASS Firestore budget contracts: 16 checks, measured reads/min 3.4 / 0.0 / 3.0 / 1.8 / 60.0 (waiting <= 5 reads/min, hidden 0, idle writes 0, partner update <= 1000 ms).

node tests/contracts/reus-gate-startup-contracts.cjs
PASS Reus Gate startup contracts: source, slow start (motion and reduced motion), screen plate gate (Rule Book, Club), no-loader fallback, failed-loader release.
```

## Not done / unsure

- `select-league-phone-393x852.webp`: large dark area below the wheel/back control, plus the generic application header above the artwork; confirm intended phone composition/navigation. `new-showdown-phone-393x852.webp` also retains the generic header. Both versions show these treatments.
- `club-phone-393x852.webp` and `club--confirmation-phone-393x852.webp`: large stadium band above relatively small manager figures; confirm intended composition. Both versions are identical.
- `transfer-challenge--signing-entry-phone-393x852.webp`: sticky LOCK MY SIGNINGS action meets/overlaps the bottom edge of the rival sealed card; review intended spacing. Both versions are identical.
- `rivalry-{desktop-1920x1080,phone-393x852}.webp` and `rivalry-mid-showdown-{desktop-1920x1080,phone-393x852}.webp`: Transfer Signings remains Unavailable because these fixtures do not supply transfer summaries.
- `standings-phone-844x390.webp` and `standings-mid-showdown-phone-844x390.webp`: the viewport ends within the standings table; the real main scroller contains the remaining rows. These are exact viewport shots, not full-page images.
- `trophy-room--more-phone-393x852.webp`: MORE is opened by a coordinate touch on the visible control in both versions, as in PR #855. The two images are identical; the pictures alone do not prove the label-targeted click fix.
- Still captures cannot establish the absence of transient flashes across every route. The separate required Reus startup contracts passed. No old light screen, broken image or page error was recorded in the final settled captures. Title-width diagnostic warnings refer to hidden/fallback/wipe text; the visible titles were inspected.
- This gallery is unhosted and awaits Claude verification/publication. It is local fixture evidence, not a completed CE2PG run, physical two-device journey or production/SSJR/MDP proof. App release labels remain r75 on the workbench; this job does not bump them.
