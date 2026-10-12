# Home desktop mockup comparison · stage 3 (JOB-1071)

Reference: `project-documents/factory/mockups/GOAL_HOME.jpg` on `factory/v1-wtt5ye`.
Scope: CSS adapter at 1920×1080 only; no Team V source or game-flow changes.

| # | Difference from mockup | Result |
| --- | --- | --- |
| 1 | Desktop dock sat substantially lower than the reference, leaving too much space below the soundtrack card. | **Fixed** — moved the full-HD dock higher using `--tile-top` while keeping the soundtrack box untouched. |
| 2 | Seven-up dock tiles were shorter than the reference's tall, cinematic bottom cards. | **Fixed** — increased full-HD `--tile-h` to approx. 189px at 1080px high. |
| 3 | Continue's number-17 player image was on the right, while the reference places the figure at the left. | **Fixed** — placed the existing artwork on the left; no asset replacement. |
| 4 | Continue's label occupied the left side in the implementation, but the reference puts it beside the figure on the right. | **Fixed** — shifted Continue copy into the right portion with CSS padding. |
| 5 | Secondary tile labels started too high relative to the reference's vertically centred rows. | **Fixed** — centre-align the secondary tile stacks for full-HD desktop. |
| 6 | Secondary labels could extend into the right-side artwork area. | **Fixed** — limit label width to the left 66% on full-HD desktop. |
| 7 | Current product has seven Home destinations, including Trophy Room, whereas the older six-column reference shows six tiles. | **Not fixed** — removing/reordering a live destination would change navigation and violate the ticket's no-game-flow rule. |
| 8 | The mockup's static soundtrack text/art differs from the live Audius media playlist and controls. | **Not fixed** — dynamic media content and player labels must not be changed by this layout-only job. |

Checks: reviewed frozen Team V `home.css` and adapter markup, reread the saved CSS, confirmed the override is bounded to 1850–1999px width, 1040–1120px height and landscape (leaves 390×844 untouched); no executable tests here, CI Showdown Gate handles syntax/contracts.