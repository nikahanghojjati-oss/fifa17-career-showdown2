# Season Results desktop mockup — stage 3 (JOB-1216)

Reference: project-documents/factory/mockups/MOCKUP_SEASON_RESULTS.jpg on factory/v1-wtt5ye, inspected as an image at 1536×864; target 1920×1080. Comparison uses the allowed source CSS, boot script and live adapter. No live screenshot or local tests were run; Showdown Gate remains the validation gate.

| Difference against reference | Outcome |
| --- | --- |
| Full HD layout rules were nested inside the mutually exclusive 1366×768 range, leaving absolute-positioned panels and clipped review content active. | Fixed: close the Chromebook range before JOB-1214; its existing Full HD flow and sole main scroll now apply. |
| Eyebrow was at 9.2% instead of the reference's 10.9% height. | Fixed at Full HD: 10.9dvh, tied to the first viewport. |
| Brush title was reduced to 40% width and raised to 14.6%, against reference registration 43.49% / 16.78%. | Fixed at Full HD: restore reference width, left and top; place the tagline four pixels below the enlarged wordmark to preserve separation from the scoring card. |
| Scoring heading and rule copy were too small (about 26px / 14.4px at Full HD). | Fixed: 30px heading and about 17.5px rule copy, closer to the reference's scaled typography. |
| Scoring trophy was capped around 140px, smaller than the reference. | Fixed: increase only its existing image box to about 175px; no artwork copied. |
| Full HD manager gutter was 14px rather than the reference's approximately 25px scaled separation. | Fixed: 1.3vw gap (24.96px at 1920). |
| Manager headings were about 32.6px rather than the reference's approximately 40px scaled names. | Fixed: 40px at Full HD, keeping existing words and header nodes. |
| Nik's inputs inherited gold borders and checkbox fills, rather than the reference's silver number-input/unchecked-box frames. | Fixed: silver number-input border and unchecked checkbox frame on Nik's card only; checked boxes retain the reference's gold fill. |

All new appearance rules are confined to 1880–1960px width / 1040–1120px height and exclude Final Winner. The media-boundary correction activates the existing Full HD rules only; 390×844 retains its original rules. Existing live control order, hidden/sealed states, review actions, text and game logic are preserved. The reference's illustrative scores, crests and navigation are not transplanted.
