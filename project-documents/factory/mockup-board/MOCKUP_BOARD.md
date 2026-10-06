# Team V mockup board: how close the live game is to the mockups

Goal (Nik, 6 Oct, hand-off HO-017): by **Thursday 8 Oct** the live game looks as close as possible to the mockups. This page is Team V's number for the boards and the Custom view. Data: [MOCKUP_BOARD.json](MOCKUP_BOARD.json).

## Now: **74 %** (run 01, live build r62, Tue 6 Oct 12:10 a.m. Eastern)

```
[██████████████████████████████████████░░░░░░░░░░░░░░] 74 %
```

| Screen | Close to mockup | Biggest gap |
| --- | --- | --- |
| Select League | 92 % | Title is a thin script; the mockup has a bold brush wordmark |
| Club Assignment | 92 % | Two small layout problems on phone |
| Home | 83 % | Tile pictures smaller than the mockup's; phone has no Daniel and Nik |
| Transfer War | 83 % | Phone revamp (1016) passed but isn't live yet |
| Career Statistics | 80 % | Leader cards and comparison bars not seen yet |
| Rivalry Statistics | 80 % | Only the loading state was seen |
| Legacy | 80 % | Showdown cards not seen yet |
| Season Results | 75 % | Desktop: Daniel and Nik bigger and moved; one card instead of two. Phone fix passed but isn't live yet |
| Connect Players | 0 % | The new screen passed but isn't live; Home still has the pair box |
| Trophy Room | not measured | The test run couldn't open the styled screen |

## How each screen is scored

Each screen gets six checks against its mockup: **scene** (stadium, Daniel left and Nik right, in the mockup's place), **title** (brush wordmark), **layout** (panels where the mockup has them), **art** (the mockup's objects drawn as art, not plain boxes), **content** (real numbers and names fill it), and **phone** (its own layout, both faces whole, no scroll).

A check scores 1 when done, ½ when partly done, and 0 when missing. A check the run could not see is left out rather than guessed. Desktop is measured with `visual-assets/v10_1/shared/tools/mockup_diff.py` at 1920x1080, phone at 393x660, and every score is then looked at by eye.

The overall number is the average of the screens that were measured.

Mockups used are the ones in `project-documents/factory/mockups/`. When Nik's approved Mockup Lab images (`APPROVED_NN_desktop/phone.png`) are added, they replace these.

Evidence for run 01 is in [run-01/](run-01/): a sheet with one row per screen showing mockup, live desktop and live phone, plus `RESULTS.json`.

## Plan to Thursday

1. **Already passed, waiting for Team G to put live** (+19 points): Connect Players (#405), Season Results phone (#399), Transfer War phone (1021).
2. **Measure the screens the run couldn't open**: ask Team G to give the audit filled data for Trophy Room, Statistics, Rivalry, Legacy, Transfer War and Connect Players.
3. **GPT jobs for the biggest gaps**, in this order:
   - Season Results desktop: put Daniel and Nik where the mockup has them, with two cards side by side.
   - Select League: brush title wordmark.
   - Home: bigger tile pictures, and Daniel and Nik on phone.
4. Re-measure after each Team G release and update this page.
