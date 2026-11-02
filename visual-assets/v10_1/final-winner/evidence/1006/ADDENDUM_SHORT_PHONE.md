# JOB-1006 addendum: short phones (lead check of Team G PR #423, 06 Oct)

On the live route at 375x553, the summary panel is only about 100px tall. With the job's phone layout (FINAL SEASON on its own top row), the SEASONS and MARGIN row falls out of the panel. Add this block after the JOB-1006 block in `final-winner.css`:

```css
@media (max-width: 760px) and (max-height: 600px) {
  .finalWinnerMetaStrip { grid-template-columns: 1.4fr 1fr 1fr; grid-template-rows: 1fr; }
  .finalWinnerMetaCell--lastSeason { grid-column: auto; border-bottom: 0; }
  .finalWinnerMetaCell--lastSeason + .finalWinnerMetaCell { border-left: 1px solid rgb(242 196 91 / .18); }
  .finalWinnerMetaCell--lastSeason strong { font-size: 24px; }
  .finalWinnerMetaCell--lastSeason small { white-space: normal; text-align: center; }
}
```

Result: at 375x553 all three values show (FINAL SEASON 3 6-0, SEASONS 3, MARGIN 8), at the same height the base showed SEASONS and MARGIN. 393x660 and taller are unchanged. The sub-lines under the values (PLAYED, POINTS, DANIEL TAKES THE SEASON) are cut at the panel's bottom edge at 375x553. The base already cut PLAYED and POINTS there, so that is pre-existing. Sheet: `short_phone_375x553_base_pr_fix.jpg` (base | PR 423 | PR 423 + this block, then 393x660 PR | PR + block).
