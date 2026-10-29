# ART REVIEW · JOB-030

Reviewed asset baseline: `7d358e32c277c3ce9bde3e09ebd8c42728694dfb` on `factory/v1-wtt5ye`.

Gate used: JOB-030, PRODUCT_TRUTH, QUALITY_BAR and CRAFT_GUIDE §3. The trophy family was reviewed together at equal displayed height. Each 1X plate was compared against its source mockup and its intake likeness-lock record. Platemaps were checked separately for protected face/hand boxes, phone-band coverage and required limb cutouts.

## Verdicts

| Asset | Job | Verdict | Evidence | Exact redo if FAIL |
| --- | ---: | --- | --- | --- |
| TRO_SHOWDOWN_CHAMPION_V1 | 19 | PASS | Original gold football/ribbon-cage/crown silhouette, strongest hero in the four-trophy family, no text or logo, no distinctive real-trophy match; transparent silhouette reads clean and intake records the processed PNG as checked on grey and black. | — |
| TRO_LEAGUE_TITLE_V1 | 20 | PASS | Silver urn plus gold laurel handles and star band shares the family material language while staying distinct from the lion-and-crown league trophy and the Schale; no text/logo; transparent silhouette reads clean. | — |
| TRO_DOMESTIC_CUP_V1 | 21 | PASS | Original generic two-handle silver cup with ball finial and black/gold base; no text/logo; family finish and transparent silhouette are coherent. | — |
| TRO_CONTINENTAL_V1 | 22 | PASS | Tall silver chalice with gold wing handles is clearly different from the real Champions League cup; no text/logo; family finish and transparent silhouette are coherent. | — |
| ENV_TR_PLATE_V1 | 23 | FAIL | Daniel remains left and Nik right with faces/pose visually unchanged; the removed title/trophy/shelf UI paints believably. However readable manager labels, multiple stadium slogans and repeated crown marks remain baked into the plate, violating the explicit no-text/no-logo gate. | Redo job 23. Extend the editable mask to every manager-label block and every stadium banner/mark outside the protected face/hand boxes. Prompt line: `Remove every readable word, letter, number, logo/emblem and crown mark; repaint those regions as blank black/gold stadium fabric or crowd architecture with no symbols. Preserve Daniel and Nik face, hand and body pixels exactly and add no foreground people.` |
| ENV_CS_PLATE_V1 | 24 | FAIL | Faces/poses remain visually identical and the statistics UI zones are removed cleanly with believable stadium paint. Manager labels, side/lower slogan banners and crown marks remain. | Redo job 24. Extend the editable mask to the Daniel/Nik label blocks plus every left/right and lower stadium sign containing words or crown marks. Prompt line: `Remove every readable word, letter, number, logo/emblem and crown mark; replace with blank stadium fabric/architecture only. Preserve both managers exactly outside the new text/logo masks and add no people.` |
| ENV_RV_PLATE_V1 | 25 | FAIL | Faces/poses remain visually identical, the comparison/bottom UI is removed and the stadium repaint is believable. Manager labels, banner slogans and crown marks remain. The platemap also nests `phone_band` inside `safe_ui` instead of defining it at the top level. | Redo job 25 visual mask around both manager-label blocks and all readable/emblem stadium banners using: `Remove every readable word, letter, number, logo/emblem and crown mark; repaint as blank stadium material, preserve protected faces/hands and the two manager bodies, and add no people.` Also move `phone_band: [185, 70, 1515, 595]` to the top level of `platemap.json` and remove the nested copy from `safe_ui`. |
| ENV_LG_PLATE_V1 | 26 | FAIL | Faces/poses remain visually identical and the legacy archive/title/action zones are painted out believably. Manager labels, the two large slogan banners and crown marks remain baked in. | Redo job 26. Extend the editable mask to Daniel/Nik labels and all readable/crown-mark stadium banners. Prompt line: `Remove every readable word, letter, number, logo/emblem and crown mark; rebuild those regions as blank stadium fabric/architecture while preserving protected faces/hands and the manager silhouettes exactly. No new people.` |
| ENV_SR_PLATE_V1 | 27 | FAIL | Faces and raised fists remain visually identical; the entry-panel swoosh is gone and the central field repaint is believable. Remaining baked content includes Daniel/Nik labels, banner and corner slogans, crown crests/marks and Nik's shirt number 17. | Redo job 27. Extend edit zones to both manager labels, top banners, both bottom-corner slogans, both shirt crown marks and Nik's shirt number while keeping face/hand protected boxes untouched. Prompt line: `Remove all readable text, letters, numbers and logo/emblem/crown marks from the background and clothing; rebuild cloth/stadium texture naturally, preserve both faces and hands exactly, keep Daniel left and Nik right, and add no people.` |
| ENV_SJ_PLATE_V1 | 28 | FAIL | Faces/poses remain visually identical and the private-session UI/title/footer are removed cleanly. Manager labels, upper and lower slogan banners and crown marks remain. | Redo job 28. Extend the editable mask to both manager-label blocks and every readable/crown-mark banner. Prompt line: `Remove every readable word, letter, number, logo/emblem and crown mark; replace with blank black/gold stadium fabric/architecture, preserve the protected faces/hands and manager bodies exactly, and add no people.` |
| ENV_SYS_PLATE_V1 | 29 | FAIL | No managers or other foreground people remain and the stadium reconstruction is believable. Multiple readable banner slogans and crown marks remain baked into the system plate. | Redo job 29. Extend the cleanup mask to every surviving banner and emblem. Prompt line: `Empty stadium plate only: remove every readable word, letter, number, logo/emblem and crown mark; repaint all signs as blank black/gold stadium fabric with no symbols and introduce no people.` |

## Platemap check

| Platemap | Verdict | Evidence |
| --- | --- | --- |
| Trophy Room | PASS | Face and hand boxes cover the intended anatomy; top-level phone_band contains both faces; no mockup panel crosses a limb, so no cutout is required. |
| Career Statistics | PASS | Face/hand boxes and top-level phone_band cover both managers; Daniel crossed-arm and Nik chin-hand cutout polygons are present. |
| Rivalry Statistics | FAIL | Face/hand boxes and Nik crossed-hands cutout are present, but phone_band is nested under safe_ui instead of being a top-level platemap field. |
| Legacy | PASS | Protected boxes and top-level phone_band cover the two managers; the archive panel begins below the relevant limbs, so the no-cutout note is consistent with the mockup. |
| Season Results | PASS | Both face/hand protected boxes, top-level phone_band and both forearm/hand cutout polygons are present. |
| Start / Join | PASS | Protected boxes and top-level phone_band cover both managers; Daniel's pointing-hand cutout exists where the session panel overlaps him. |

## Gate summary

Trophies: 4 PASS, 0 FAIL.

Plates: 0 PASS, 7 FAIL. All seven fail the explicit no-text/no-logo requirement. No real club or league logos remain in the reviewed plates, and the intended Daniel-left/Nik-right staging is preserved on every two-manager plate.

Platemaps: 5 PASS, 1 FAIL. Rivalry Statistics needs the phone_band key moved to the required top level.
