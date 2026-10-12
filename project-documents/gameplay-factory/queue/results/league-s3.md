# League desktop mockup comparison — stage 3 (JOB-1129)

Reference: `project-documents/factory/mockups/GOAL_LEAGUE.jpg` on `factory/v1-wtt5ye`; target 1920×1080. Only the setup CSS adapter was edited.

| # | Difference from reference | Resolution |
|---|---|---|
| 1 | Desktop wheel was capped at 460px, noticeably smaller than the roughly 570–580px reference proportion. | **Fixed:** enlarge to a capped 570px on large desktop only. |
| 2 | Spin and Back used two equal-width columns although the reference's gold Spin button is wider. | **Fixed:** desktop action columns use 1.35:1. |
| 3 | Action buttons were only 54/48px high versus taller reference buttons. | **Fixed:** both use a 64px desktop minimum. |
| 4 | The initial result/subheading was too small compared with the large desktop reference. | **Fixed:** 18px tracked type at large desktop. |
| 5 | Flanking result rules were shorter than the reference's wide divider lines. | **Fixed:** extend desktop flex-basis to 118px and open the gap. |
| 6 | Wheel-to-button gap and title lead-in were loose for the enlarged wheel. | **Fixed:** tighten only large-desktop margins to keep the actions in the flow. |
| 7 | Stadium banners, manager portraits, and side legend positioning are baked into frozen Team V imagery. | **Not fixed:** changing those would require Team V asset edits, which are prohibited; retain existing supplied assets. |
| 8 | Reference art depicts an empty center wheel, while live product shows the five league options. | **Not fixed:** wheel items are required gameplay; never hide or replace player-visible league options. |

The breakpoint is `min-width: 1600px` and `min-height: 900px`: 390×844 mobile and the ticketed short desktop/tablet breakpoints are unchanged. No JS logic, player-visible copy or tab order changed. Runtime syntax and contract tests are deferred to Showdown Gate as instructed.
