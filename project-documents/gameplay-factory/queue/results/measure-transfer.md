# JOB-1584 — Transfer measurements

Measured 2026-10-10T15:15:14.806Z against gameplay/bug-list-1 commit `c9cb090e95343c5adfd20e1745fc972508c34274`. Browser: Chromium with Playwright; local static server; synthetic private two-manager provider fixtures only. No game files or existing audits changed.

Run from the repository root: `npm run serve:test` in one terminal, then `node project-documents/gameplay-factory/queue/results/measure-transfer.cjs`. Screenshots and raw JSON go to `/tmp/job1584-transfer-evidence` (override with `CMS_TEST_RESULTS`).

Method: reuse the existing shared-transfer-challenge-replay audit’s gameplay module loading, mocked private provider and production `open`/`refresh` route. Both manager roles are measured at every requested size. Replay advances with the actual Continue button. A blocked pointer click is recorded; keyboard Enter on that button is used to measure later states without concealing the pointer defect. Live provider fixtures cover ready, window, early-end requested, guesses, guesses locked, signings, signings locked and completed; guess and signing League/Nationality listboxes are opened through their controls. Fixture names/one completed signing match that audit; empty and populated states are identified below. Empty-entry fixtures clear leftover replay form values before the production refresh; open search lists use Premier/Eng queries.

Touch means the first six requested windows (width ≤ 932), including phone landscape and tablet; 1280x650 and larger desktop windows use mouse contexts. The 768x1024 touch tablet retains the app’s intentional meta viewport width=760 policy (js/onlinePlayerIdentity.js); observed CSS layout dimensions are recorded separately from the requested window, without changing the app. All dimensions are CSS px; controls use transformed bounding boxes, including disabled controls. Text flags use scrollWidth > clientWidth on direct-text elements and inputs/selects; overflow:visible can be an overflow flag without literal clipping. Decorative image overscan is recorded separately in values. Horizontal scrollbar means document scrollWidth > clientWidth (Chromium overlay scrollbars may have no painted gutter). Main action must be wholly within the initial viewport and all clipping ancestors, after resetting page and internal vertical scroll; a disabled action is explicitly marked. One-pixel assistive text is explicitly labelled and excluded from the priority list. Open lists report their visible intersection with the viewport and clipping ancestors separately from internal scroll height. The completed primary is Continue; waiting states can have no primary. Dropdown focus may scroll the form; measurements reset it to the first screenful while keeping the list open. Enabled-control overlaps use rendered/clipped rectangles, excluding containing pairs. Native select popups, real remote error/busy states and arbitrary long custom names are outside this fixture evidence.

## Most important five

1. **Main action outside first screenful**: 1 measured state; e.g. 844x390 playerTwo/replay-guesses, `#continueFromTransfers`: NO; left=438; right=601.2; top=373.42; bottom=401.72; viewport=844x390; enabled; text=CONTINUE REPLAY · GUESS ENTRY.
2. **Small enabled touch targets**: 60 measured states; e.g. 844x390 playerOne/replay-window, `#continueFromTransfers`: 165.1x28.29; enabled; label=CONTINUE REPLAY · WINDOW OPEN.
3. **Text width flags**: 107 measured states; e.g. 360x640 playerOne/replay-signings, `#p1Signing1League`: scrollWidth=110; clientWidth=100; overflowX=clip; text=Primera División.
4. **Enabled control overlaps**: 56 measured states; e.g. 360x640 playerOne/guess-league-listbox, `#tw-p2Guess1Value-listbox-option-1`: with #completeTransferChallenge; intersection=338x37.
5. **Clipped search lists**: 16 measured states; e.g. 844x390 playerOne/guess-league-listbox, `#tw-p2Guess1Value-listbox`: CLIPPED; box=55.33x153.05; left=176.71; top=320.48; bottom=473.53; visibleWithinViewportAndAncestors=55.33x69.52; options=3; scrollHeight=188; clientHeight=159.

## Coverage and per-state summary

| Window | CSS layout viewport | Screen (role/state) | V10 mounted | Horizontal scrollbar | Wider elements | Touch controls <44 | Text flags | Main action first screenful | Control overlaps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 360x640 | 360x640 | playerOne/replay-window | yes | no | 3 | 0 | 6 | yes | 0 |
| 360x640 | 360x640 | playerOne/replay-guesses | yes | no | 3 | 0 | 4 | yes | 0 |
| 360x640 | 360x640 | playerOne/replay-signings | yes | no | 3 | 0 | 5 | yes | 0 |
| 360x640 | 360x640 | playerOne/completed-populated | yes | no | 3 | 0 | 5 | yes | 0 |
| 360x640 | 360x640 | playerOne/ready | yes | no | 3 | 0 | 6 | yes | 0 |
| 360x640 | 360x640 | playerOne/window | yes | no | 3 | 0 | 6 | yes | 0 |
| 360x640 | 360x640 | playerOne/early-end-requested | yes | no | 3 | 0 | 6 | yes | 0 |
| 360x640 | 360x640 | playerOne/guesses-empty | yes | no | 3 | 0 | 4 | yes | 0 |
| 360x640 | 360x640 | playerOne/guess-league-listbox | yes | no | 3 | 0 | 4 | yes | 4 |
| 360x640 | 360x640 | playerOne/guess-nationality-listbox | yes | no | 3 | 0 | 4 | yes | 3 |
| 360x640 | 360x640 | playerOne/guesses-locked | yes | no | 3 | 0 | 4 | N/A | 0 |
| 360x640 | 360x640 | playerOne/signings-empty | yes | no | 3 | 0 | 4 | yes | 0 |
| 360x640 | 360x640 | playerOne/signing-league-listbox | yes | no | 3 | 0 | 4 | yes | 4 |
| 360x640 | 360x640 | playerOne/signing-nationality-listbox | yes | no | 3 | 0 | 4 | yes | 3 |
| 360x640 | 360x640 | playerOne/signings-locked | yes | no | 3 | 0 | 4 | N/A | 0 |
| 360x640 | 360x640 | playerTwo/replay-window | yes | no | 3 | 0 | 6 | yes | 0 |
| 360x640 | 360x640 | playerTwo/replay-guesses | yes | no | 3 | 0 | 4 | yes | 0 |
| 360x640 | 360x640 | playerTwo/replay-signings | yes | no | 3 | 0 | 5 | yes | 0 |
| 360x640 | 360x640 | playerTwo/completed-populated | yes | no | 3 | 0 | 5 | yes | 0 |
| 360x640 | 360x640 | playerTwo/ready | yes | no | 3 | 0 | 6 | N/A | 0 |
| 360x640 | 360x640 | playerTwo/window | yes | no | 3 | 0 | 6 | yes | 0 |
| 360x640 | 360x640 | playerTwo/early-end-requested | yes | no | 3 | 0 | 6 | yes | 0 |
| 360x640 | 360x640 | playerTwo/guesses-empty | yes | no | 3 | 0 | 4 | yes | 0 |
| 360x640 | 360x640 | playerTwo/guess-league-listbox | yes | no | 3 | 0 | 4 | yes | 4 |
| 360x640 | 360x640 | playerTwo/guess-nationality-listbox | yes | no | 3 | 0 | 4 | yes | 3 |
| 360x640 | 360x640 | playerTwo/guesses-locked | yes | no | 3 | 0 | 4 | N/A | 0 |
| 360x640 | 360x640 | playerTwo/signings-empty | yes | no | 3 | 0 | 4 | yes | 0 |
| 360x640 | 360x640 | playerTwo/signing-league-listbox | yes | no | 3 | 0 | 4 | yes | 4 |
| 360x640 | 360x640 | playerTwo/signing-nationality-listbox | yes | no | 3 | 0 | 4 | yes | 3 |
| 360x640 | 360x640 | playerTwo/signings-locked | yes | no | 3 | 0 | 4 | N/A | 0 |
| 390x844 | 390x844 | playerOne/replay-window | yes | no | 1 | 0 | 6 | yes | 0 |
| 390x844 | 390x844 | playerOne/replay-guesses | yes | no | 1 | 0 | 4 | yes | 0 |
| 390x844 | 390x844 | playerOne/replay-signings | yes | no | 1 | 0 | 5 | yes | 0 |
| 390x844 | 390x844 | playerOne/completed-populated | yes | no | 1 | 0 | 5 | yes | 0 |
| 390x844 | 390x844 | playerOne/ready | yes | no | 1 | 0 | 6 | yes | 0 |
| 390x844 | 390x844 | playerOne/window | yes | no | 1 | 0 | 6 | yes | 0 |
| 390x844 | 390x844 | playerOne/early-end-requested | yes | no | 1 | 0 | 6 | yes | 0 |
| 390x844 | 390x844 | playerOne/guesses-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 390x844 | 390x844 | playerOne/guess-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 390x844 | 390x844 | playerOne/guess-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 390x844 | 390x844 | playerOne/guesses-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 390x844 | 390x844 | playerOne/signings-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 390x844 | 390x844 | playerOne/signing-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 390x844 | 390x844 | playerOne/signing-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 390x844 | 390x844 | playerOne/signings-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 390x844 | 390x844 | playerTwo/replay-window | yes | no | 1 | 0 | 6 | yes | 0 |
| 390x844 | 390x844 | playerTwo/replay-guesses | yes | no | 1 | 0 | 4 | yes | 0 |
| 390x844 | 390x844 | playerTwo/replay-signings | yes | no | 1 | 0 | 5 | yes | 0 |
| 390x844 | 390x844 | playerTwo/completed-populated | yes | no | 1 | 0 | 5 | yes | 0 |
| 390x844 | 390x844 | playerTwo/ready | yes | no | 1 | 0 | 6 | N/A | 0 |
| 390x844 | 390x844 | playerTwo/window | yes | no | 1 | 0 | 6 | yes | 0 |
| 390x844 | 390x844 | playerTwo/early-end-requested | yes | no | 1 | 0 | 6 | yes | 0 |
| 390x844 | 390x844 | playerTwo/guesses-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 390x844 | 390x844 | playerTwo/guess-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 390x844 | 390x844 | playerTwo/guess-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 390x844 | 390x844 | playerTwo/guesses-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 390x844 | 390x844 | playerTwo/signings-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 390x844 | 390x844 | playerTwo/signing-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 390x844 | 390x844 | playerTwo/signing-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 390x844 | 390x844 | playerTwo/signings-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 430x932 | 430x932 | playerOne/replay-window | yes | no | 1 | 0 | 6 | yes | 0 |
| 430x932 | 430x932 | playerOne/replay-guesses | yes | no | 1 | 0 | 4 | yes | 0 |
| 430x932 | 430x932 | playerOne/replay-signings | yes | no | 1 | 0 | 4 | yes | 0 |
| 430x932 | 430x932 | playerOne/completed-populated | yes | no | 1 | 0 | 5 | yes | 0 |
| 430x932 | 430x932 | playerOne/ready | yes | no | 1 | 0 | 6 | yes | 0 |
| 430x932 | 430x932 | playerOne/window | yes | no | 1 | 0 | 6 | yes | 0 |
| 430x932 | 430x932 | playerOne/early-end-requested | yes | no | 1 | 0 | 6 | yes | 0 |
| 430x932 | 430x932 | playerOne/guesses-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 430x932 | 430x932 | playerOne/guess-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 430x932 | 430x932 | playerOne/guess-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 430x932 | 430x932 | playerOne/guesses-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 430x932 | 430x932 | playerOne/signings-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 430x932 | 430x932 | playerOne/signing-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 430x932 | 430x932 | playerOne/signing-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 430x932 | 430x932 | playerOne/signings-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 430x932 | 430x932 | playerTwo/replay-window | yes | no | 1 | 0 | 6 | yes | 0 |
| 430x932 | 430x932 | playerTwo/replay-guesses | yes | no | 1 | 0 | 4 | yes | 0 |
| 430x932 | 430x932 | playerTwo/replay-signings | yes | no | 1 | 0 | 4 | yes | 0 |
| 430x932 | 430x932 | playerTwo/completed-populated | yes | no | 1 | 0 | 5 | yes | 0 |
| 430x932 | 430x932 | playerTwo/ready | yes | no | 1 | 0 | 6 | N/A | 0 |
| 430x932 | 430x932 | playerTwo/window | yes | no | 1 | 0 | 6 | yes | 0 |
| 430x932 | 430x932 | playerTwo/early-end-requested | yes | no | 1 | 0 | 6 | yes | 0 |
| 430x932 | 430x932 | playerTwo/guesses-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 430x932 | 430x932 | playerTwo/guess-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 430x932 | 430x932 | playerTwo/guess-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 430x932 | 430x932 | playerTwo/guesses-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 430x932 | 430x932 | playerTwo/signings-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 430x932 | 430x932 | playerTwo/signing-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 430x932 | 430x932 | playerTwo/signing-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 430x932 | 430x932 | playerTwo/signings-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 844x390 | 844x390 | playerOne/replay-window | yes | no | 0 | 3 | 4 | yes | 0 |
| 844x390 | 844x390 | playerOne/replay-guesses | yes | no | 0 | 9 | 3 | yes | 0 |
| 844x390 | 844x390 | playerOne/replay-signings | yes | no | 0 | 12 | 5 | yes | 0 |
| 844x390 | 844x390 | playerOne/completed-populated | yes | no | 0 | 3 | 2 | yes | 0 |
| 844x390 | 844x390 | playerOne/ready | yes | no | 0 | 3 | 4 | yes | 0 |
| 844x390 | 844x390 | playerOne/window | yes | no | 0 | 3 | 4 | yes | 0 |
| 844x390 | 844x390 | playerOne/early-end-requested | yes | no | 0 | 3 | 4 | yes | 0 |
| 844x390 | 844x390 | playerOne/guesses-empty | yes | no | 0 | 9 | 1 | yes | 0 |
| 844x390 | 844x390 | playerOne/guess-league-listbox | yes | no | 0 | 9 | 4 | yes | 0 |
| 844x390 | 844x390 | playerOne/guess-nationality-listbox | yes | no | 0 | 10 | 2 | yes | 0 |
| 844x390 | 844x390 | playerOne/guesses-locked | yes | no | 0 | 8 | 1 | N/A | 0 |
| 844x390 | 844x390 | playerOne/signings-empty | yes | no | 0 | 12 | 4 | yes | 0 |
| 844x390 | 844x390 | playerOne/signing-league-listbox | yes | no | 0 | 12 | 7 | yes | 3 |
| 844x390 | 844x390 | playerOne/signing-nationality-listbox | yes | no | 0 | 13 | 5 | yes | 3 |
| 844x390 | 844x390 | playerOne/signings-locked | yes | no | 0 | 2 | 4 | N/A | 0 |
| 844x390 | 844x390 | playerTwo/replay-window | yes | no | 0 | 3 | 4 | yes | 0 |
| 844x390 | 844x390 | playerTwo/replay-guesses | yes | no | 0 | 9 | 2 | no | 0 |
| 844x390 | 844x390 | playerTwo/replay-signings | yes | no | 0 | 12 | 5 | yes | 0 |
| 844x390 | 844x390 | playerTwo/completed-populated | yes | no | 0 | 3 | 2 | yes | 0 |
| 844x390 | 844x390 | playerTwo/ready | yes | no | 0 | 2 | 4 | N/A | 0 |
| 844x390 | 844x390 | playerTwo/window | yes | no | 0 | 3 | 4 | yes | 0 |
| 844x390 | 844x390 | playerTwo/early-end-requested | yes | no | 0 | 3 | 4 | yes | 0 |
| 844x390 | 844x390 | playerTwo/guesses-empty | yes | no | 0 | 9 | 1 | yes | 0 |
| 844x390 | 844x390 | playerTwo/guess-league-listbox | yes | no | 0 | 9 | 4 | yes | 0 |
| 844x390 | 844x390 | playerTwo/guess-nationality-listbox | yes | no | 0 | 10 | 2 | yes | 0 |
| 844x390 | 844x390 | playerTwo/guesses-locked | yes | no | 0 | 8 | 1 | N/A | 0 |
| 844x390 | 844x390 | playerTwo/signings-empty | yes | no | 0 | 12 | 4 | yes | 0 |
| 844x390 | 844x390 | playerTwo/signing-league-listbox | yes | no | 0 | 12 | 8 | yes | 3 |
| 844x390 | 844x390 | playerTwo/signing-nationality-listbox | yes | no | 0 | 13 | 5 | yes | 3 |
| 844x390 | 844x390 | playerTwo/signings-locked | yes | no | 0 | 2 | 4 | N/A | 0 |
| 932x430 | 932x430 | playerOne/replay-window | yes | no | 0 | 3 | 4 | yes | 0 |
| 932x430 | 932x430 | playerOne/replay-guesses | yes | no | 0 | 9 | 3 | yes | 0 |
| 932x430 | 932x430 | playerOne/replay-signings | yes | no | 0 | 12 | 5 | yes | 0 |
| 932x430 | 932x430 | playerOne/completed-populated | yes | no | 0 | 3 | 2 | yes | 0 |
| 932x430 | 932x430 | playerOne/ready | yes | no | 0 | 3 | 4 | yes | 0 |
| 932x430 | 932x430 | playerOne/window | yes | no | 0 | 3 | 4 | yes | 0 |
| 932x430 | 932x430 | playerOne/early-end-requested | yes | no | 0 | 3 | 4 | yes | 0 |
| 932x430 | 932x430 | playerOne/guesses-empty | yes | no | 0 | 9 | 1 | yes | 0 |
| 932x430 | 932x430 | playerOne/guess-league-listbox | yes | no | 0 | 9 | 2 | yes | 0 |
| 932x430 | 932x430 | playerOne/guess-nationality-listbox | yes | no | 0 | 10 | 1 | yes | 0 |
| 932x430 | 932x430 | playerOne/guesses-locked | yes | no | 0 | 8 | 1 | N/A | 0 |
| 932x430 | 932x430 | playerOne/signings-empty | yes | no | 0 | 12 | 4 | yes | 0 |
| 932x430 | 932x430 | playerOne/signing-league-listbox | yes | no | 0 | 12 | 7 | yes | 4 |
| 932x430 | 932x430 | playerOne/signing-nationality-listbox | yes | no | 0 | 13 | 5 | yes | 3 |
| 932x430 | 932x430 | playerOne/signings-locked | yes | no | 0 | 2 | 4 | N/A | 0 |
| 932x430 | 932x430 | playerTwo/replay-window | yes | no | 0 | 3 | 4 | yes | 0 |
| 932x430 | 932x430 | playerTwo/replay-guesses | yes | no | 0 | 9 | 3 | yes | 0 |
| 932x430 | 932x430 | playerTwo/replay-signings | yes | no | 0 | 12 | 5 | yes | 0 |
| 932x430 | 932x430 | playerTwo/completed-populated | yes | no | 0 | 3 | 2 | yes | 0 |
| 932x430 | 932x430 | playerTwo/ready | yes | no | 0 | 2 | 4 | N/A | 0 |
| 932x430 | 932x430 | playerTwo/window | yes | no | 0 | 3 | 4 | yes | 0 |
| 932x430 | 932x430 | playerTwo/early-end-requested | yes | no | 0 | 3 | 4 | yes | 0 |
| 932x430 | 932x430 | playerTwo/guesses-empty | yes | no | 0 | 9 | 1 | yes | 0 |
| 932x430 | 932x430 | playerTwo/guess-league-listbox | yes | no | 0 | 9 | 4 | yes | 0 |
| 932x430 | 932x430 | playerTwo/guess-nationality-listbox | yes | no | 0 | 10 | 2 | yes | 0 |
| 932x430 | 932x430 | playerTwo/guesses-locked | yes | no | 0 | 8 | 1 | N/A | 0 |
| 932x430 | 932x430 | playerTwo/signings-empty | yes | no | 0 | 12 | 4 | yes | 0 |
| 932x430 | 932x430 | playerTwo/signing-league-listbox | yes | no | 0 | 12 | 7 | yes | 4 |
| 932x430 | 932x430 | playerTwo/signing-nationality-listbox | yes | no | 0 | 13 | 5 | yes | 3 |
| 932x430 | 932x430 | playerTwo/signings-locked | yes | no | 0 | 2 | 4 | N/A | 0 |
| 768x1024 | 760x1014 | playerOne/replay-window | yes | no | 1 | 0 | 6 | yes | 0 |
| 768x1024 | 760x1014 | playerOne/replay-guesses | yes | no | 1 | 0 | 4 | yes | 0 |
| 768x1024 | 760x1014 | playerOne/replay-signings | yes | no | 1 | 0 | 4 | yes | 0 |
| 768x1024 | 760x1014 | playerOne/completed-populated | yes | no | 1 | 0 | 5 | yes | 0 |
| 768x1024 | 760x1014 | playerOne/ready | yes | no | 1 | 0 | 6 | yes | 0 |
| 768x1024 | 760x1014 | playerOne/window | yes | no | 1 | 0 | 6 | yes | 0 |
| 768x1024 | 760x1014 | playerOne/early-end-requested | yes | no | 1 | 0 | 6 | yes | 0 |
| 768x1024 | 760x1014 | playerOne/guesses-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 768x1024 | 760x1014 | playerOne/guess-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 768x1024 | 760x1014 | playerOne/guess-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 768x1024 | 760x1014 | playerOne/guesses-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 768x1024 | 760x1014 | playerOne/signings-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 768x1024 | 760x1014 | playerOne/signing-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 768x1024 | 760x1014 | playerOne/signing-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 768x1024 | 760x1014 | playerOne/signings-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 768x1024 | 760x1014 | playerTwo/replay-window | yes | no | 1 | 0 | 6 | yes | 0 |
| 768x1024 | 760x1014 | playerTwo/replay-guesses | yes | no | 1 | 0 | 4 | yes | 0 |
| 768x1024 | 760x1014 | playerTwo/replay-signings | yes | no | 1 | 0 | 4 | yes | 0 |
| 768x1024 | 760x1014 | playerTwo/completed-populated | yes | no | 1 | 0 | 5 | yes | 0 |
| 768x1024 | 760x1014 | playerTwo/ready | yes | no | 1 | 0 | 6 | N/A | 0 |
| 768x1024 | 760x1014 | playerTwo/window | yes | no | 1 | 0 | 6 | yes | 0 |
| 768x1024 | 760x1014 | playerTwo/early-end-requested | yes | no | 1 | 0 | 6 | yes | 0 |
| 768x1024 | 760x1014 | playerTwo/guesses-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 768x1024 | 760x1014 | playerTwo/guess-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 768x1024 | 760x1014 | playerTwo/guess-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 768x1024 | 760x1014 | playerTwo/guesses-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 768x1024 | 760x1014 | playerTwo/signings-empty | yes | no | 1 | 0 | 4 | yes | 0 |
| 768x1024 | 760x1014 | playerTwo/signing-league-listbox | yes | no | 1 | 0 | 4 | yes | 4 |
| 768x1024 | 760x1014 | playerTwo/signing-nationality-listbox | yes | no | 1 | 0 | 4 | yes | 3 |
| 768x1024 | 760x1014 | playerTwo/signings-locked | yes | no | 1 | 0 | 4 | N/A | 0 |
| 1280x650 | 1280x650 | playerOne/replay-window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/replay-guesses | yes | no | 0 | N/A | 1 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/replay-signings | yes | no | 0 | N/A | 1 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/completed-populated | yes | no | 0 | N/A | 2 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/ready | yes | no | 0 | N/A | 4 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/early-end-requested | yes | no | 0 | N/A | 4 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/guesses-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/guess-league-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/guess-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/guesses-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1280x650 | 1280x650 | playerOne/signings-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1280x650 | 1280x650 | playerOne/signing-league-listbox | yes | no | 0 | N/A | 1 | yes | 3 |
| 1280x650 | 1280x650 | playerOne/signing-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 2 |
| 1280x650 | 1280x650 | playerOne/signings-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1280x650 | 1280x650 | playerTwo/replay-window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1280x650 | 1280x650 | playerTwo/replay-guesses | yes | no | 0 | N/A | 1 | yes | 0 |
| 1280x650 | 1280x650 | playerTwo/replay-signings | yes | no | 0 | N/A | 4 | yes | 0 |
| 1280x650 | 1280x650 | playerTwo/completed-populated | yes | no | 0 | N/A | 2 | yes | 0 |
| 1280x650 | 1280x650 | playerTwo/ready | yes | no | 0 | N/A | 4 | N/A | 0 |
| 1280x650 | 1280x650 | playerTwo/window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1280x650 | 1280x650 | playerTwo/early-end-requested | yes | no | 0 | N/A | 4 | yes | 0 |
| 1280x650 | 1280x650 | playerTwo/guesses-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1280x650 | 1280x650 | playerTwo/guess-league-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1280x650 | 1280x650 | playerTwo/guess-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1280x650 | 1280x650 | playerTwo/guesses-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1280x650 | 1280x650 | playerTwo/signings-empty | yes | no | 0 | N/A | 4 | yes | 0 |
| 1280x650 | 1280x650 | playerTwo/signing-league-listbox | yes | no | 0 | N/A | 4 | yes | 3 |
| 1280x650 | 1280x650 | playerTwo/signing-nationality-listbox | yes | no | 0 | N/A | 4 | yes | 2 |
| 1280x650 | 1280x650 | playerTwo/signings-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1366x768 | 1366x768 | playerOne/replay-window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/replay-guesses | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/replay-signings | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/completed-populated | yes | no | 0 | N/A | 2 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/ready | yes | no | 0 | N/A | 4 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/early-end-requested | yes | no | 0 | N/A | 4 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/guesses-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/guess-league-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/guess-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/guesses-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1366x768 | 1366x768 | playerOne/signings-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerOne/signing-league-listbox | yes | no | 0 | N/A | 1 | yes | 4 |
| 1366x768 | 1366x768 | playerOne/signing-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 2 |
| 1366x768 | 1366x768 | playerOne/signings-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1366x768 | 1366x768 | playerTwo/replay-window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1366x768 | 1366x768 | playerTwo/replay-guesses | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerTwo/replay-signings | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerTwo/completed-populated | yes | no | 0 | N/A | 2 | yes | 0 |
| 1366x768 | 1366x768 | playerTwo/ready | yes | no | 0 | N/A | 4 | N/A | 0 |
| 1366x768 | 1366x768 | playerTwo/window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1366x768 | 1366x768 | playerTwo/early-end-requested | yes | no | 0 | N/A | 4 | yes | 0 |
| 1366x768 | 1366x768 | playerTwo/guesses-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerTwo/guess-league-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerTwo/guess-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerTwo/guesses-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1366x768 | 1366x768 | playerTwo/signings-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1366x768 | 1366x768 | playerTwo/signing-league-listbox | yes | no | 0 | N/A | 1 | yes | 4 |
| 1366x768 | 1366x768 | playerTwo/signing-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 2 |
| 1366x768 | 1366x768 | playerTwo/signings-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1920x1080 | 1920x1080 | playerOne/replay-window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/replay-guesses | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/replay-signings | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/completed-populated | yes | no | 0 | N/A | 2 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/ready | yes | no | 0 | N/A | 4 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/early-end-requested | yes | no | 0 | N/A | 4 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/guesses-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/guess-league-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/guess-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/guesses-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1920x1080 | 1920x1080 | playerOne/signings-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerOne/signing-league-listbox | yes | no | 0 | N/A | 1 | yes | 4 |
| 1920x1080 | 1920x1080 | playerOne/signing-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 1 |
| 1920x1080 | 1920x1080 | playerOne/signings-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1920x1080 | 1920x1080 | playerTwo/replay-window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1920x1080 | 1920x1080 | playerTwo/replay-guesses | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerTwo/replay-signings | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerTwo/completed-populated | yes | no | 0 | N/A | 2 | yes | 0 |
| 1920x1080 | 1920x1080 | playerTwo/ready | yes | no | 0 | N/A | 4 | N/A | 0 |
| 1920x1080 | 1920x1080 | playerTwo/window | yes | no | 0 | N/A | 4 | yes | 0 |
| 1920x1080 | 1920x1080 | playerTwo/early-end-requested | yes | no | 0 | N/A | 4 | yes | 0 |
| 1920x1080 | 1920x1080 | playerTwo/guesses-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerTwo/guess-league-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerTwo/guess-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerTwo/guesses-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 1920x1080 | 1920x1080 | playerTwo/signings-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 1920x1080 | 1920x1080 | playerTwo/signing-league-listbox | yes | no | 0 | N/A | 1 | yes | 4 |
| 1920x1080 | 1920x1080 | playerTwo/signing-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 1 |
| 1920x1080 | 1920x1080 | playerTwo/signings-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 2560x1080 | 2560x1080 | playerOne/replay-window | yes | no | 0 | N/A | 4 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/replay-guesses | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/replay-signings | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/completed-populated | yes | no | 0 | N/A | 2 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/ready | yes | no | 0 | N/A | 4 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/window | yes | no | 0 | N/A | 4 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/early-end-requested | yes | no | 0 | N/A | 4 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/guesses-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/guess-league-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/guess-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/guesses-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 2560x1080 | 2560x1080 | playerOne/signings-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerOne/signing-league-listbox | yes | no | 0 | N/A | 1 | yes | 5 |
| 2560x1080 | 2560x1080 | playerOne/signing-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 1 |
| 2560x1080 | 2560x1080 | playerOne/signings-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 2560x1080 | 2560x1080 | playerTwo/replay-window | yes | no | 0 | N/A | 4 | yes | 0 |
| 2560x1080 | 2560x1080 | playerTwo/replay-guesses | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerTwo/replay-signings | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerTwo/completed-populated | yes | no | 0 | N/A | 2 | yes | 0 |
| 2560x1080 | 2560x1080 | playerTwo/ready | yes | no | 0 | N/A | 4 | N/A | 0 |
| 2560x1080 | 2560x1080 | playerTwo/window | yes | no | 0 | N/A | 4 | yes | 0 |
| 2560x1080 | 2560x1080 | playerTwo/early-end-requested | yes | no | 0 | N/A | 4 | yes | 0 |
| 2560x1080 | 2560x1080 | playerTwo/guesses-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerTwo/guess-league-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerTwo/guess-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerTwo/guesses-locked | yes | no | 0 | N/A | 1 | N/A | 0 |
| 2560x1080 | 2560x1080 | playerTwo/signings-empty | yes | no | 0 | N/A | 1 | yes | 0 |
| 2560x1080 | 2560x1080 | playerTwo/signing-league-listbox | yes | no | 0 | N/A | 1 | yes | 5 |
| 2560x1080 | 2560x1080 | playerTwo/signing-nationality-listbox | yes | no | 0 | N/A | 1 | yes | 1 |
| 2560x1080 | 2560x1080 | playerTwo/signings-locked | yes | no | 0 | N/A | 1 | N/A | 0 |

## Measurements

| Size | Screen | Problem | Selector | Measured value |
| --- | --- | --- | --- | --- |
| 360x640 | playerOne/replay-window | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/replay-guesses | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/replay-signings | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/completed-populated | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/ready | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/window | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/early-end-requested | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/guesses-empty | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/guesses-locked | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/signings-empty | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerOne/signings-locked | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/replay-window | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/replay-guesses | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/replay-signings | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/completed-populated | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/ready | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/window | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/early-end-requested | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/guesses-empty | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/guesses-locked | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/signings-empty | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 360x640 | playerTwo/signings-locked | CSS layout viewport | window / viewport meta | requested window=360x640; observed innerWidth x innerHeight=360x640 |
| 390x844 | playerOne/replay-window | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/replay-guesses | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/replay-signings | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/completed-populated | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/ready | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/window | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/early-end-requested | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/guesses-empty | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/guesses-locked | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/signings-empty | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerOne/signings-locked | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/replay-window | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/replay-guesses | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/replay-signings | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/completed-populated | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/ready | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/window | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/early-end-requested | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/guesses-empty | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/guesses-locked | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/signings-empty | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 390x844 | playerTwo/signings-locked | CSS layout viewport | window / viewport meta | requested window=390x844; observed innerWidth x innerHeight=390x844 |
| 430x932 | playerOne/replay-window | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/replay-guesses | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/replay-signings | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/completed-populated | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/ready | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/window | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/early-end-requested | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/guesses-empty | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/guesses-locked | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/signings-empty | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerOne/signings-locked | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/replay-window | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/replay-guesses | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/replay-signings | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/completed-populated | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/ready | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/window | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/early-end-requested | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/guesses-empty | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/guesses-locked | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/signings-empty | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 430x932 | playerTwo/signings-locked | CSS layout viewport | window / viewport meta | requested window=430x932; observed innerWidth x innerHeight=430x932 |
| 844x390 | playerOne/replay-window | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/replay-guesses | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/replay-signings | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/completed-populated | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/ready | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/window | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/early-end-requested | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/guesses-empty | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/guesses-locked | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/signings-empty | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerOne/signings-locked | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/replay-window | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/replay-guesses | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/replay-signings | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/completed-populated | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/ready | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/window | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/early-end-requested | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/guesses-empty | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/guesses-locked | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/signings-empty | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 844x390 | playerTwo/signings-locked | CSS layout viewport | window / viewport meta | requested window=844x390; observed innerWidth x innerHeight=844x390 |
| 932x430 | playerOne/replay-window | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/replay-guesses | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/replay-signings | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/completed-populated | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/ready | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/window | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/early-end-requested | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/guesses-empty | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/guesses-locked | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/signings-empty | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerOne/signings-locked | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/replay-window | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/replay-guesses | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/replay-signings | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/completed-populated | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/ready | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/window | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/early-end-requested | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/guesses-empty | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/guesses-locked | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/signings-empty | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 932x430 | playerTwo/signings-locked | CSS layout viewport | window / viewport meta | requested window=932x430; observed innerWidth x innerHeight=932x430 |
| 768x1024 | playerOne/replay-window | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/replay-guesses | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/replay-signings | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/completed-populated | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/ready | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/window | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/early-end-requested | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/guesses-empty | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/guesses-locked | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/signings-empty | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerOne/signings-locked | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/replay-window | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/replay-guesses | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/replay-signings | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/completed-populated | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/ready | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/window | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/early-end-requested | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/guesses-empty | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/guesses-locked | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/signings-empty | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 768x1024 | playerTwo/signings-locked | CSS layout viewport | window / viewport meta | requested window=768x1024; observed innerWidth x innerHeight=760x1014 |
| 1280x650 | playerOne/replay-window | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/replay-guesses | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/replay-signings | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/completed-populated | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/ready | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/window | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/early-end-requested | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/guesses-empty | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/guesses-locked | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/signings-empty | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerOne/signings-locked | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/replay-window | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/replay-guesses | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/replay-signings | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/completed-populated | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/ready | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/window | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/early-end-requested | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/guesses-empty | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/guesses-locked | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/signings-empty | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1280x650 | playerTwo/signings-locked | CSS layout viewport | window / viewport meta | requested window=1280x650; observed innerWidth x innerHeight=1280x650 |
| 1366x768 | playerOne/replay-window | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/replay-guesses | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/replay-signings | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/completed-populated | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/ready | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/window | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/early-end-requested | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/guesses-empty | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/guesses-locked | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/signings-empty | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerOne/signings-locked | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/replay-window | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/replay-guesses | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/replay-signings | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/completed-populated | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/ready | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/window | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/early-end-requested | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/guesses-empty | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/guesses-locked | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/signings-empty | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1366x768 | playerTwo/signings-locked | CSS layout viewport | window / viewport meta | requested window=1366x768; observed innerWidth x innerHeight=1366x768 |
| 1920x1080 | playerOne/replay-window | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/replay-guesses | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/replay-signings | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/completed-populated | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/ready | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/window | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/early-end-requested | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/guesses-empty | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/guesses-locked | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/signings-empty | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerOne/signings-locked | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/replay-window | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/replay-guesses | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/replay-signings | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/completed-populated | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/ready | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/window | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/early-end-requested | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/guesses-empty | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/guesses-locked | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/signings-empty | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 1920x1080 | playerTwo/signings-locked | CSS layout viewport | window / viewport meta | requested window=1920x1080; observed innerWidth x innerHeight=1920x1080 |
| 2560x1080 | playerOne/replay-window | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/replay-guesses | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/replay-signings | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/completed-populated | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/ready | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/window | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/early-end-requested | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/guesses-empty | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/guesses-locked | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/signings-empty | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerOne/signings-locked | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/replay-window | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/replay-guesses | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/replay-signings | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/completed-populated | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/ready | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/window | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/early-end-requested | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/guesses-empty | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/guess-league-listbox | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/guess-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/guesses-locked | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/signings-empty | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/signing-league-listbox | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/signing-nationality-listbox | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 2560x1080 | playerTwo/signings-locked | CSS layout viewport | window / viewport meta | requested window=2560x1080; observed innerWidth x innerHeight=2560x1080 |
| 360x640 | playerOne/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/replay-window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/replay-window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=567.84; window=360; left=-113.09; right=454.75; classes=plane |
| 360x640 | playerOne/replay-window | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg two-line sd-entered |
| 360x640 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=10.97; right=349.03; top=542; bottom=590; viewport=360x640; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 360x640 | playerOne/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/replay-guesses | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/replay-guesses | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=513.45; window=360; left=-85.11; right=428.34; classes=plane |
| 360x640 | playerOne/replay-guesses | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full sd-entered |
| 360x640 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 360x640 | playerOne/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/replay-signings | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/replay-signings | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=429.94; window=360; left=-42.17; right=387.77; classes=plane |
| 360x640 | playerOne/replay-signings | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full sd-entered |
| 360x640 | playerOne/replay-signings | Text scrollWidth > clientWidth | #p1Signing1League | scrollWidth=110; clientWidth=100; overflowX=clip; text=Primera División |
| 360x640 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 360x640 | playerOne/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 360x640 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/completed-populated | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/completed-populated | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=567.84; window=360; left=-113.09; right=454.75; classes=plane |
| 360x640 | playerOne/completed-populated | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full sd-entered |
| 360x640 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerOne/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 360x640 | playerOne/ready | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/ready | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/ready | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=567.84; window=360; left=-113.09; right=454.75; classes=plane |
| 360x640 | playerOne/ready | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg two-line sd-entered |
| 360x640 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/ready | Main action in first screenful | #startTransferTimer | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=START SHARED 15-MINUTE WINDOW |
| 360x640 | playerOne/window | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=567.84; window=360; left=-113.09; right=454.75; classes=plane |
| 360x640 | playerOne/window | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg two-line sd-entered |
| 360x640 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/window | Main action in first screenful | #endTransferTimer | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=REQUEST EARLY END |
| 360x640 | playerOne/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/early-end-requested | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/early-end-requested | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=567.84; window=360; left=-113.09; right=454.75; classes=plane |
| 360x640 | playerOne/early-end-requested | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg two-line sd-entered |
| 360x640 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=10.97; right=349.03; top=542; bottom=590; viewport=360x640; disabled; text=EARLY END REQUESTED ✓ |
| 360x640 | playerOne/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/guesses-empty | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/guesses-empty | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=513.45; window=360; left=-85.11; right=428.34; classes=plane |
| 360x640 | playerOne/guesses-empty | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=LOCK MY GUESSES |
| 360x640 | playerOne/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/guess-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/guess-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=513.45; window=360; left=-85.11; right=428.34; classes=plane |
| 360x640 | playerOne/guess-league-listbox | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/guess-league-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=340x149; left=10; top=479; bottom=628; visibleWithinViewportAndAncestors=340x149; options=3; scrollHeight=144; clientHeight=144 |
| 360x640 | playerOne/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/guess-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p2Guess1Value-listbox-option-1 > span:nth-of-type(1) |
| 360x640 | playerOne/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=542; bottom=590; viewport=360x640; enabled; text=LOCK MY GUESSES |
| 360x640 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-1 | with #completeTransferChallenge; intersection=338x37 |
| 360x640 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #completeTransferChallenge; intersection=338x11 |
| 360x640 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 360x640 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 360x640 | playerOne/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/guess-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/guess-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=513.45; window=360; left=-85.11; right=428.34; classes=plane |
| 360x640 | playerOne/guess-nationality-listbox | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/guess-nationality-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=340x53; left=10; top=575; bottom=628; visibleWithinViewportAndAncestors=340x53; options=1; scrollHeight=48; clientHeight=48 |
| 360x640 | playerOne/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=LOCK MY GUESSES |
| 360x640 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #completeTransferChallenge; intersection=338x10 |
| 360x640 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 360x640 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 360x640 | playerOne/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/guesses-locked | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/guesses-locked | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=513.45; window=360; left=-85.11; right=428.34; classes=plane |
| 360x640 | playerOne/guesses-locked | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full sd-entered |
| 360x640 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 360x640 | playerOne/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/signings-empty | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/signings-empty | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=429.94; window=360; left=-42.17; right=387.77; classes=plane |
| 360x640 | playerOne/signings-empty | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=LOCK MY SIGNINGS |
| 360x640 | playerOne/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/signing-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/signing-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=429.94; window=360; left=-42.17; right=387.77; classes=plane |
| 360x640 | playerOne/signing-league-listbox | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/signing-league-listbox | Open listbox visibility | #tw-p1Signing1League-listbox | FULL; box=340x149; left=10; top=479; bottom=628; visibleWithinViewportAndAncestors=340x149; options=3; scrollHeight=144; clientHeight=144 |
| 360x640 | playerOne/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p1Signing1League-listbox-option-1 > span:nth-of-type(1) |
| 360x640 | playerOne/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=542; bottom=590; viewport=360x640; enabled; text=LOCK MY SIGNINGS |
| 360x640 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=338x37 |
| 360x640 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=338x11 |
| 360x640 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 360x640 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 360x640 | playerOne/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/signing-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/signing-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=429.94; window=360; left=-42.17; right=387.77; classes=plane |
| 360x640 | playerOne/signing-nationality-listbox | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/signing-nationality-listbox | Open listbox visibility | #tw-p1Signing1Nationality-listbox | FULL; box=340x53; left=10; top=575; bottom=628; visibleWithinViewportAndAncestors=340x53; options=1; scrollHeight=48; clientHeight=48 |
| 360x640 | playerOne/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=542; bottom=590; viewport=360x640; enabled; text=LOCK MY SIGNINGS |
| 360x640 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=338x11 |
| 360x640 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 360x640 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 360x640 | playerOne/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerOne/signings-locked | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerOne/signings-locked | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=429.94; window=360; left=-42.17; right=387.77; classes=plane |
| 360x640 | playerOne/signings-locked | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full sd-entered |
| 360x640 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerOne/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerOne/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 360x640 | playerTwo/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/replay-window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/replay-window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=567.84; window=360; left=-113.09; right=454.75; classes=plane |
| 360x640 | playerTwo/replay-window | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg two-line sd-entered |
| 360x640 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=10.97; right=349.03; top=542; bottom=590; viewport=360x640; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 360x640 | playerTwo/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/replay-guesses | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/replay-guesses | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=513.45; window=360; left=-85.11; right=428.34; classes=plane |
| 360x640 | playerTwo/replay-guesses | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full sd-entered |
| 360x640 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 360x640 | playerTwo/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/replay-signings | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/replay-signings | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=429.94; window=360; left=-42.17; right=387.77; classes=plane |
| 360x640 | playerTwo/replay-signings | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full sd-entered |
| 360x640 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #p2Signing1League | scrollWidth=110; clientWidth=100; overflowX=clip; text=Primera División |
| 360x640 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 360x640 | playerTwo/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 360x640 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/completed-populated | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/completed-populated | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=567.84; window=360; left=-113.09; right=454.75; classes=plane |
| 360x640 | playerTwo/completed-populated | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full sd-entered |
| 360x640 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerTwo/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 360x640 | playerTwo/ready | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/ready | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/ready | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=567.84; window=360; left=-113.09; right=454.75; classes=plane |
| 360x640 | playerTwo/ready | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg two-line sd-entered |
| 360x640 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/ready | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 360x640 | playerTwo/window | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=567.84; window=360; left=-113.09; right=454.75; classes=plane |
| 360x640 | playerTwo/window | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg two-line sd-entered |
| 360x640 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/window | Main action in first screenful | #endTransferTimer | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=REQUEST EARLY END |
| 360x640 | playerTwo/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/early-end-requested | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/early-end-requested | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=567.84; window=360; left=-113.09; right=454.75; classes=plane |
| 360x640 | playerTwo/early-end-requested | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg two-line sd-entered |
| 360x640 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 360x640 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=10.97; right=349.03; top=542; bottom=590; viewport=360x640; disabled; text=EARLY END REQUESTED ✓ |
| 360x640 | playerTwo/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/guesses-empty | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/guesses-empty | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=513.45; window=360; left=-85.11; right=428.34; classes=plane |
| 360x640 | playerTwo/guesses-empty | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=LOCK MY GUESSES |
| 360x640 | playerTwo/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/guess-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/guess-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=513.45; window=360; left=-85.11; right=428.34; classes=plane |
| 360x640 | playerTwo/guess-league-listbox | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/guess-league-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=340x149; left=10; top=479; bottom=628; visibleWithinViewportAndAncestors=340x149; options=3; scrollHeight=144; clientHeight=144 |
| 360x640 | playerTwo/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/guess-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p1Guess1Value-listbox-option-1 > span:nth-of-type(1) |
| 360x640 | playerTwo/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=542; bottom=590; viewport=360x640; enabled; text=LOCK MY GUESSES |
| 360x640 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-1 | with #completeTransferChallenge; intersection=338x37 |
| 360x640 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #completeTransferChallenge; intersection=338x11 |
| 360x640 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 360x640 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 360x640 | playerTwo/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/guess-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/guess-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=513.45; window=360; left=-85.11; right=428.34; classes=plane |
| 360x640 | playerTwo/guess-nationality-listbox | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/guess-nationality-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=340x53; left=10; top=575; bottom=628; visibleWithinViewportAndAncestors=340x53; options=1; scrollHeight=48; clientHeight=48 |
| 360x640 | playerTwo/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=LOCK MY GUESSES |
| 360x640 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #completeTransferChallenge; intersection=338x10 |
| 360x640 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 360x640 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 360x640 | playerTwo/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/guesses-locked | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/guesses-locked | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=513.45; window=360; left=-85.11; right=428.34; classes=plane |
| 360x640 | playerTwo/guesses-locked | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full sd-entered |
| 360x640 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 360x640 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 360x640 | playerTwo/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/signings-empty | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/signings-empty | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=429.94; window=360; left=-42.17; right=387.77; classes=plane |
| 360x640 | playerTwo/signings-empty | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=541; bottom=589; viewport=360x640; enabled; text=LOCK MY SIGNINGS |
| 360x640 | playerTwo/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/signing-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/signing-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=429.94; window=360; left=-42.17; right=387.77; classes=plane |
| 360x640 | playerTwo/signing-league-listbox | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/signing-league-listbox | Open listbox visibility | #tw-p2Signing1League-listbox | FULL; box=340x149; left=10; top=479; bottom=628; visibleWithinViewportAndAncestors=340x149; options=3; scrollHeight=144; clientHeight=144 |
| 360x640 | playerTwo/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p2Signing1League-listbox-option-1 > span:nth-of-type(1) |
| 360x640 | playerTwo/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=542; bottom=590; viewport=360x640; enabled; text=LOCK MY SIGNINGS |
| 360x640 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=338x37 |
| 360x640 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=338x11 |
| 360x640 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 360x640 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 360x640 | playerTwo/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/signing-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/signing-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=429.94; window=360; left=-42.17; right=387.77; classes=plane |
| 360x640 | playerTwo/signing-nationality-listbox | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full lead sd-entered |
| 360x640 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/signing-nationality-listbox | Open listbox visibility | #tw-p2Signing1Nationality-listbox | FULL; box=340x53; left=10; top=575; bottom=628; visibleWithinViewportAndAncestors=340x53; options=1; scrollHeight=48; clientHeight=48 |
| 360x640 | playerTwo/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=10.97; right=349.03; top=542; bottom=590; viewport=360x640; enabled; text=LOCK MY SIGNINGS |
| 360x640 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=338x11 |
| 360x640 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 360x640 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 360x640 | playerTwo/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=360, clientWidth=360; overflowX=visible/hidden |
| 360x640 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 360x640 | playerTwo/signings-locked | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) | width=362.06; window=360; left=-1.03; right=361.03; classes=scene sd-entered |
| 360x640 | playerTwo/signings-locked | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=429.94; window=360; left=-42.17; right=387.77; classes=plane |
| 360x640 | playerTwo/signings-locked | Element wider than window | #tw-transferPhaseStatus | width=362.06; window=360; left=-1.03; right=361.03; classes=sign-status reg full sd-entered |
| 360x640 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 360x640 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 360x640 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 360x640 | playerTwo/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 360x640 | playerTwo/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 390x844 | playerOne/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/replay-window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=11.89; right=378.11; top=746; bottom=794; viewport=390x844; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 390x844 | playerOne/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/replay-guesses | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 390x844 | playerOne/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/replay-signings | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/replay-signings | Text scrollWidth > clientWidth | #p1Signing1League | scrollWidth=110; clientWidth=105; overflowX=clip; text=Primera División |
| 390x844 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 390x844 | playerOne/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 390x844 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/completed-populated | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerOne/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 390x844 | playerOne/ready | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/ready | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/ready | Main action in first screenful | #startTransferTimer | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=START SHARED 15-MINUTE WINDOW |
| 390x844 | playerOne/window | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/window | Main action in first screenful | #endTransferTimer | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=REQUEST EARLY END |
| 390x844 | playerOne/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/early-end-requested | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=11.89; right=378.11; top=746; bottom=794; viewport=390x844; disabled; text=EARLY END REQUESTED ✓ |
| 390x844 | playerOne/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/guesses-empty | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=LOCK MY GUESSES |
| 390x844 | playerOne/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/guess-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/guess-league-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=370x149; left=10; top=683; bottom=832; visibleWithinViewportAndAncestors=370x149; options=3; scrollHeight=144; clientHeight=144 |
| 390x844 | playerOne/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/guess-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p2Guess1Value-listbox-option-1 > span:nth-of-type(1) |
| 390x844 | playerOne/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=746; bottom=794; viewport=390x844; enabled; text=LOCK MY GUESSES |
| 390x844 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-1 | with #completeTransferChallenge; intersection=366.22x37 |
| 390x844 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #completeTransferChallenge; intersection=366.22x11 |
| 390x844 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 390x844 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 390x844 | playerOne/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/guess-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/guess-nationality-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=370x53; left=10; top=779; bottom=832; visibleWithinViewportAndAncestors=370x53; options=1; scrollHeight=48; clientHeight=48 |
| 390x844 | playerOne/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=LOCK MY GUESSES |
| 390x844 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #completeTransferChallenge; intersection=366.22x10 |
| 390x844 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 390x844 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 390x844 | playerOne/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/guesses-locked | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 390x844 | playerOne/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/signings-empty | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=LOCK MY SIGNINGS |
| 390x844 | playerOne/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/signing-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/signing-league-listbox | Open listbox visibility | #tw-p1Signing1League-listbox | FULL; box=370x149; left=10; top=683; bottom=832; visibleWithinViewportAndAncestors=370x149; options=3; scrollHeight=144; clientHeight=144 |
| 390x844 | playerOne/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p1Signing1League-listbox-option-1 > span:nth-of-type(1) |
| 390x844 | playerOne/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=746; bottom=794; viewport=390x844; enabled; text=LOCK MY SIGNINGS |
| 390x844 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=366.22x37 |
| 390x844 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=366.22x11 |
| 390x844 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 390x844 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 390x844 | playerOne/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/signing-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/signing-nationality-listbox | Open listbox visibility | #tw-p1Signing1Nationality-listbox | FULL; box=370x53; left=10; top=779; bottom=832; visibleWithinViewportAndAncestors=370x53; options=1; scrollHeight=48; clientHeight=48 |
| 390x844 | playerOne/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=746; bottom=794; viewport=390x844; enabled; text=LOCK MY SIGNINGS |
| 390x844 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=366.22x11 |
| 390x844 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 390x844 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 390x844 | playerOne/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerOne/signings-locked | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerOne/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerOne/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 390x844 | playerTwo/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/replay-window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=11.89; right=378.11; top=746; bottom=794; viewport=390x844; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 390x844 | playerTwo/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/replay-guesses | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 390x844 | playerTwo/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/replay-signings | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #p2Signing1League | scrollWidth=110; clientWidth=105; overflowX=clip; text=Primera División |
| 390x844 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 390x844 | playerTwo/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 390x844 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/completed-populated | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerTwo/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 390x844 | playerTwo/ready | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/ready | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/ready | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 390x844 | playerTwo/window | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/window | Main action in first screenful | #endTransferTimer | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=REQUEST EARLY END |
| 390x844 | playerTwo/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/early-end-requested | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 390x844 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=11.89; right=378.11; top=746; bottom=794; viewport=390x844; disabled; text=EARLY END REQUESTED ✓ |
| 390x844 | playerTwo/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/guesses-empty | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=LOCK MY GUESSES |
| 390x844 | playerTwo/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/guess-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/guess-league-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=370x149; left=10; top=683; bottom=832; visibleWithinViewportAndAncestors=370x149; options=3; scrollHeight=144; clientHeight=144 |
| 390x844 | playerTwo/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/guess-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p1Guess1Value-listbox-option-1 > span:nth-of-type(1) |
| 390x844 | playerTwo/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=746; bottom=794; viewport=390x844; enabled; text=LOCK MY GUESSES |
| 390x844 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-1 | with #completeTransferChallenge; intersection=366.22x37 |
| 390x844 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #completeTransferChallenge; intersection=366.22x11 |
| 390x844 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 390x844 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 390x844 | playerTwo/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/guess-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/guess-nationality-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=370x53; left=10; top=779; bottom=832; visibleWithinViewportAndAncestors=370x53; options=1; scrollHeight=48; clientHeight=48 |
| 390x844 | playerTwo/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=LOCK MY GUESSES |
| 390x844 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #completeTransferChallenge; intersection=366.22x10 |
| 390x844 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 390x844 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 390x844 | playerTwo/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/guesses-locked | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 390x844 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 390x844 | playerTwo/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/signings-empty | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=745; bottom=793; viewport=390x844; enabled; text=LOCK MY SIGNINGS |
| 390x844 | playerTwo/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/signing-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/signing-league-listbox | Open listbox visibility | #tw-p2Signing1League-listbox | FULL; box=370x149; left=10; top=683; bottom=832; visibleWithinViewportAndAncestors=370x149; options=3; scrollHeight=144; clientHeight=144 |
| 390x844 | playerTwo/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p2Signing1League-listbox-option-1 > span:nth-of-type(1) |
| 390x844 | playerTwo/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=746; bottom=794; viewport=390x844; enabled; text=LOCK MY SIGNINGS |
| 390x844 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=366.22x37 |
| 390x844 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=366.22x11 |
| 390x844 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 390x844 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 390x844 | playerTwo/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/signing-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/signing-nationality-listbox | Open listbox visibility | #tw-p2Signing1Nationality-listbox | FULL; box=370x53; left=10; top=779; bottom=832; visibleWithinViewportAndAncestors=370x53; options=1; scrollHeight=48; clientHeight=48 |
| 390x844 | playerTwo/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=11.89; right=378.11; top=746; bottom=794; viewport=390x844; enabled; text=LOCK MY SIGNINGS |
| 390x844 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=366.22x11 |
| 390x844 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 390x844 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 390x844 | playerTwo/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=390, clientWidth=390; overflowX=visible/hidden |
| 390x844 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 390x844 | playerTwo/signings-locked | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=615.16; window=390; left=-121.52; right=493.64; classes=plane |
| 390x844 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 390x844 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 390x844 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 390x844 | playerTwo/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 390x844 | playerTwo/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 430x932 | playerOne/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/replay-window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=13.11; right=416.89; top=834; bottom=882; viewport=430x932; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 430x932 | playerOne/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/replay-guesses | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 430x932 | playerOne/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/replay-signings | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 430x932 | playerOne/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 430x932 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/completed-populated | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerOne/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 430x932 | playerOne/ready | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/ready | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/ready | Main action in first screenful | #startTransferTimer | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=START SHARED 15-MINUTE WINDOW |
| 430x932 | playerOne/window | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/window | Main action in first screenful | #endTransferTimer | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=REQUEST EARLY END |
| 430x932 | playerOne/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/early-end-requested | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=13.11; right=416.89; top=834; bottom=882; viewport=430x932; disabled; text=EARLY END REQUESTED ✓ |
| 430x932 | playerOne/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/guesses-empty | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=LOCK MY GUESSES |
| 430x932 | playerOne/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/guess-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/guess-league-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=410x149; left=10; top=771; bottom=920; visibleWithinViewportAndAncestors=410x149; options=3; scrollHeight=144; clientHeight=144 |
| 430x932 | playerOne/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/guess-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p2Guess1Value-listbox-option-1 > span:nth-of-type(1) |
| 430x932 | playerOne/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=834; bottom=882; viewport=430x932; enabled; text=LOCK MY GUESSES |
| 430x932 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-1 | with #completeTransferChallenge; intersection=403.78x37 |
| 430x932 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #completeTransferChallenge; intersection=403.78x11 |
| 430x932 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 430x932 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 430x932 | playerOne/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/guess-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/guess-nationality-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=410x53; left=10; top=867; bottom=920; visibleWithinViewportAndAncestors=410x53; options=1; scrollHeight=48; clientHeight=48 |
| 430x932 | playerOne/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=LOCK MY GUESSES |
| 430x932 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #completeTransferChallenge; intersection=403.78x10 |
| 430x932 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 430x932 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 430x932 | playerOne/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/guesses-locked | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 430x932 | playerOne/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/signings-empty | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=LOCK MY SIGNINGS |
| 430x932 | playerOne/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/signing-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/signing-league-listbox | Open listbox visibility | #tw-p1Signing1League-listbox | FULL; box=410x149; left=10; top=771; bottom=920; visibleWithinViewportAndAncestors=410x149; options=3; scrollHeight=144; clientHeight=144 |
| 430x932 | playerOne/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p1Signing1League-listbox-option-1 > span:nth-of-type(1) |
| 430x932 | playerOne/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=834; bottom=882; viewport=430x932; enabled; text=LOCK MY SIGNINGS |
| 430x932 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=403.78x37 |
| 430x932 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=403.78x11 |
| 430x932 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 430x932 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 430x932 | playerOne/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/signing-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/signing-nationality-listbox | Open listbox visibility | #tw-p1Signing1Nationality-listbox | FULL; box=410x53; left=10; top=867; bottom=920; visibleWithinViewportAndAncestors=410x53; options=1; scrollHeight=48; clientHeight=48 |
| 430x932 | playerOne/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=834; bottom=882; viewport=430x932; enabled; text=LOCK MY SIGNINGS |
| 430x932 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=403.78x11 |
| 430x932 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 430x932 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 430x932 | playerOne/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerOne/signings-locked | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerOne/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerOne/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 430x932 | playerTwo/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/replay-window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=13.11; right=416.89; top=834; bottom=882; viewport=430x932; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 430x932 | playerTwo/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/replay-guesses | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 430x932 | playerTwo/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/replay-signings | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 430x932 | playerTwo/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 430x932 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/completed-populated | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerTwo/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 430x932 | playerTwo/ready | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/ready | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/ready | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 430x932 | playerTwo/window | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/window | Main action in first screenful | #endTransferTimer | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=REQUEST EARLY END |
| 430x932 | playerTwo/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/early-end-requested | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 430x932 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=13.11; right=416.89; top=834; bottom=882; viewport=430x932; disabled; text=EARLY END REQUESTED ✓ |
| 430x932 | playerTwo/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/guesses-empty | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=LOCK MY GUESSES |
| 430x932 | playerTwo/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/guess-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/guess-league-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=410x149; left=10; top=771; bottom=920; visibleWithinViewportAndAncestors=410x149; options=3; scrollHeight=144; clientHeight=144 |
| 430x932 | playerTwo/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/guess-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p1Guess1Value-listbox-option-1 > span:nth-of-type(1) |
| 430x932 | playerTwo/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=834; bottom=882; viewport=430x932; enabled; text=LOCK MY GUESSES |
| 430x932 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-1 | with #completeTransferChallenge; intersection=403.78x37 |
| 430x932 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #completeTransferChallenge; intersection=403.78x11 |
| 430x932 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 430x932 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 430x932 | playerTwo/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/guess-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/guess-nationality-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=410x53; left=10; top=867; bottom=920; visibleWithinViewportAndAncestors=410x53; options=1; scrollHeight=48; clientHeight=48 |
| 430x932 | playerTwo/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=LOCK MY GUESSES |
| 430x932 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #completeTransferChallenge; intersection=403.78x10 |
| 430x932 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 430x932 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 430x932 | playerTwo/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/guesses-locked | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 430x932 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 430x932 | playerTwo/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/signings-empty | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=833; bottom=881; viewport=430x932; enabled; text=LOCK MY SIGNINGS |
| 430x932 | playerTwo/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/signing-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/signing-league-listbox | Open listbox visibility | #tw-p2Signing1League-listbox | FULL; box=410x149; left=10; top=771; bottom=920; visibleWithinViewportAndAncestors=410x149; options=3; scrollHeight=144; clientHeight=144 |
| 430x932 | playerTwo/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p2Signing1League-listbox-option-1 > span:nth-of-type(1) |
| 430x932 | playerTwo/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=834; bottom=882; viewport=430x932; enabled; text=LOCK MY SIGNINGS |
| 430x932 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=403.78x37 |
| 430x932 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=403.78x11 |
| 430x932 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 430x932 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 430x932 | playerTwo/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/signing-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/signing-nationality-listbox | Open listbox visibility | #tw-p2Signing1Nationality-listbox | FULL; box=410x53; left=10; top=867; bottom=920; visibleWithinViewportAndAncestors=410x53; options=1; scrollHeight=48; clientHeight=48 |
| 430x932 | playerTwo/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=13.11; right=416.89; top=834; bottom=882; viewport=430x932; enabled; text=LOCK MY SIGNINGS |
| 430x932 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=403.78x11 |
| 430x932 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 430x932 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 430x932 | playerTwo/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=430, clientWidth=430; overflowX=visible/hidden |
| 430x932 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 430x932 | playerTwo/signings-locked | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=678.25; window=430; left=-132.75; right=545.5; classes=plane |
| 430x932 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 430x932 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 430x932 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 430x932 | playerTwo/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 430x932 | playerTwo/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 844x390 | playerOne/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=53; clientWidth=43; overflowX=visible; text=REPLAY |
| 844x390 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/replay-window | Touch control below 44 px | #continueFromTransfers | 165.1x28.29; enabled; label=CONTINUE REPLAY · WINDOW OPEN |
| 844x390 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerOne/replay-window | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/replay-window | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=180.48; right=345.57; top=309.4; bottom=337.7; viewport=844x390; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 844x390 | playerOne/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess1Type | 55.33x17.91; disabled; label=Guess 1 against Nik type |
| 844x390 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess1Value | 55.33x17.91; disabled; label=Guess 1 against Nik value. Search FIFA 17 previous league |
| 844x390 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #p2Guess1Value | scrollWidth=80; clientWidth=59; overflowX=clip; text=Premier League |
| 844x390 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess2Type | 55.35x17.91; disabled; label=Guess 2 against Nik type |
| 844x390 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess2Value | 55.35x17.91; disabled; label=Guess 2 against Nik value. Search player nationality |
| 844x390 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess3Type | 55.35x17.91; disabled; label=Guess 3 against Nik type |
| 844x390 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess3Value | 55.35x17.91; disabled; label=Guess 3 against Nik value. Search player nationality |
| 844x390 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferGuessPrivacyNote | scrollWidth=29; clientWidth=2; overflowX=visible; text=Hidden from Nik until you both lock. |
| 844x390 | playerOne/replay-guesses | Touch control below 44 px | #continueFromTransfers | 166.75x16.48; enabled; label=CONTINUE REPLAY · GUESS ENTRY |
| 844x390 | playerOne/replay-guesses | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/replay-guesses | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/replay-guesses | Main action occluded at center | #continueFromTransfers | covered by #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) |
| 844x390 | playerOne/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=182.59; right=349.34; top=356.68; bottom=373.16; viewport=844x390; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 844x390 | playerOne/replay-guesses | Replay pointer activation blocked | #continueFromTransfers | Pointer click timed out after 1500ms; <footer data-sd-enter="panel" class="hud-footer sd-entered">…</footer> intercepts pointer events; keyboard Enter used to reach next state |
| 844x390 | playerOne/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=8; overflowX=visible; text=01 |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #p1Signing1Name | 57.31x17.8; disabled; label=Player One signing 1 player name |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #p1Signing1League | 51.68x17.8; disabled; label=Player One signing 1 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/replay-signings | Text scrollWidth > clientWidth | #p1Signing1League | scrollWidth=81; clientWidth=56; overflowX=clip; text=Primera División |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #p1Signing1Nationality | 48.01x17.8; disabled; label=Player One signing 1 nationality. Search player nationality |
| 844x390 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=02 |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #p1Signing2Name | 57.31x17.8; disabled; label=Player One signing 2 player name |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #p1Signing2League | 51.68x17.8; disabled; label=Player One signing 2 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #p1Signing2Nationality | 48.01x17.8; disabled; label=Player One signing 2 nationality. Search player nationality |
| 844x390 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=03 |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #p1Signing3Name | 57.31x17.8; disabled; label=Player One signing 3 player name |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #p1Signing3League | 51.68x17.8; disabled; label=Player One signing 3 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #p1Signing3Nationality | 48.01x17.8; disabled; label=Player One signing 3 nationality. Search player nationality |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #continueFromTransfers | 171.5x28.11; enabled; label=CONTINUE REPLAY · SIGNING ENTRY |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/replay-signings | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=178.31; right=349.81; top=318.6; bottom=346.71; viewport=844x390; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 844x390 | playerOne/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 844x390 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/completed-populated | Touch control below 44 px | #continueFromTransfers | 83.65x4.65; enabled; label=CONTINUE TO SHARED SEASON RESULTS |
| 844x390 | playerOne/completed-populated | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/completed-populated | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=647.47; right=731.12; top=321.49; bottom=326.14; viewport=844x390; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 844x390 | playerOne/ready | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=45; clientWidth=36; overflowX=visible; text=00:00 |
| 844x390 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/ready | Touch control below 44 px | #startTransferTimer | 210.62x18.86; enabled; label=START SHARED 15-MINUTE WINDOW |
| 844x390 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerOne/ready | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/ready | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/ready | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/ready | Main action in first screenful | #startTransferTimer | YES; left=134.95; right=345.57; top=317.9; bottom=336.76; viewport=844x390; enabled; text=START SHARED 15-MINUTE WINDOW |
| 844x390 | playerOne/window | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=45; clientWidth=36; overflowX=visible; text=14:55 |
| 844x390 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/window | Touch control below 44 px | #endTransferTimer | 130.25x18.86; enabled; label=REQUEST EARLY END |
| 844x390 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerOne/window | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/window | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/window | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/window | Main action in first screenful | #endTransferTimer | YES; left=215.33; right=345.57; top=317.9; bottom=336.76; viewport=844x390; enabled; text=REQUEST EARLY END |
| 844x390 | playerOne/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=45; clientWidth=36; overflowX=visible; text=14:55 |
| 844x390 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/early-end-requested | Touch control below 44 px | #endTransferTimer | 159.8x18.86; disabled; label=EARLY END REQUESTED ✓ |
| 844x390 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerOne/early-end-requested | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/early-end-requested | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=185.78; right=345.57; top=318.83; bottom=337.7; viewport=844x390; disabled; text=EARLY END REQUESTED ✓ |
| 844x390 | playerOne/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess1Type | 55.33x17.91; enabled; label=Guess 1 against Nik type |
| 844x390 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess1Value | 55.33x17.91; disabled; label=Guess 1 against Nik value. Search FIFA 17 previous league |
| 844x390 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess2Type | 55.35x17.91; enabled; label=Guess 2 against Nik type |
| 844x390 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess2Value | 55.35x17.91; disabled; label=Guess 2 against Nik value. Search player nationality |
| 844x390 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess3Type | 55.35x17.91; enabled; label=Guess 3 against Nik type |
| 844x390 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess3Value | 55.35x17.91; disabled; label=Guess 3 against Nik value. Search player nationality |
| 844x390 | playerOne/guesses-empty | Touch control below 44 px | #completeTransferChallenge | 107.47x18.86; enabled; label=LOCK MY GUESSES |
| 844x390 | playerOne/guesses-empty | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/guesses-empty | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=241.87; right=349.34; top=329.45; bottom=348.31; viewport=844x390; enabled; text=LOCK MY GUESSES |
| 844x390 | playerOne/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess1Type | 55.33x17.91; enabled; label=Guess 1 against Nik type |
| 844x390 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess1Value | 55.33x17.91; enabled; label=Guess 1 against Nik value. Search FIFA 17 previous league |
| 844x390 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-p2Guess1Value-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=37; overflowX=visible; text=Premier League |
| 844x390 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-p2Guess1Value-listbox-option-1 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=37; overflowX=visible; text=Russian Premier League |
| 844x390 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-p2Guess1Value-listbox-option-2 > strong:nth-of-type(1) | scrollWidth=64; clientWidth=37; overflowX=visible; text=Scottish Premiership |
| 844x390 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess2Type | 55.35x17.91; enabled; label=Guess 2 against Nik type |
| 844x390 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess2Value | 55.35x17.91; disabled; label=Guess 2 against Nik value. Search player nationality |
| 844x390 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess3Type | 55.35x17.91; enabled; label=Guess 3 against Nik type |
| 844x390 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess3Value | 55.35x17.91; disabled; label=Guess 3 against Nik value. Search player nationality |
| 844x390 | playerOne/guess-league-listbox | Touch control below 44 px | #completeTransferChallenge | 107.47x18.86; enabled; label=LOCK MY GUESSES |
| 844x390 | playerOne/guess-league-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/guess-league-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/guess-league-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | CLIPPED; box=55.33x153.05; left=176.71; top=320.48; bottom=473.53; visibleWithinViewportAndAncestors=55.33x69.52; options=3; scrollHeight=188; clientHeight=159 |
| 844x390 | playerOne/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=241.87; right=349.34; top=329.45; bottom=348.31; viewport=844x390; enabled; text=LOCK MY GUESSES |
| 844x390 | playerOne/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess1Type | 55.33x17.91; enabled; label=Guess 1 against Nik type |
| 844x390 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess1Value | 55.33x17.91; enabled; label=Guess 1 against Nik value. Search player nationality |
| 844x390 | playerOne/guess-nationality-listbox | Touch control below 44 px | #tw-p2Guess1Value-listbox-option-0 | 53.47x42.05; enabled; label=England |
| 844x390 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-p2Guess1Value-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=43; clientWidth=37; overflowX=visible; text=England |
| 844x390 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess2Type | 55.35x17.91; enabled; label=Guess 2 against Nik type |
| 844x390 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess2Value | 55.35x17.91; disabled; label=Guess 2 against Nik value. Search player nationality |
| 844x390 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess3Type | 55.35x17.91; enabled; label=Guess 3 against Nik type |
| 844x390 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess3Value | 55.35x17.91; disabled; label=Guess 3 against Nik value. Search player nationality |
| 844x390 | playerOne/guess-nationality-listbox | Touch control below 44 px | #completeTransferChallenge | 107.47x18.86; enabled; label=LOCK MY GUESSES |
| 844x390 | playerOne/guess-nationality-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/guess-nationality-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/guess-nationality-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=55.33x46.72; left=176.71; top=320.48; bottom=367.2; visibleWithinViewportAndAncestors=55.33x46.72; options=1; scrollHeight=45; clientHeight=45 |
| 844x390 | playerOne/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=241.87; right=349.34; top=329.45; bottom=348.31; viewport=844x390; enabled; text=LOCK MY GUESSES |
| 844x390 | playerOne/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess1Type | 55.33x17.91; disabled; label=Guess 1 against Nik type |
| 844x390 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess1Value | 55.33x17.91; disabled; label=Guess 1 against Nik value. Search player nationality |
| 844x390 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess2Type | 55.35x17.91; disabled; label=Guess 2 against Nik type |
| 844x390 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess2Value | 55.35x17.91; disabled; label=Guess 2 against Nik value. Search player nationality |
| 844x390 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess3Type | 55.35x17.91; disabled; label=Guess 3 against Nik type |
| 844x390 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess3Value | 55.35x17.91; disabled; label=Guess 3 against Nik value. Search player nationality |
| 844x390 | playerOne/guesses-locked | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/guesses-locked | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 844x390 | playerOne/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=8; overflowX=visible; text=01 |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #p1Signing1Name | 57.31x17.8; enabled; label=Player One signing 1 player name |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #p1Signing1League | 51.68x17.8; enabled; label=Player One signing 1 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #p1Signing1Nationality | 48.01x17.8; enabled; label=Player One signing 1 nationality. Search player nationality |
| 844x390 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=02 |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #p1Signing2Name | 57.31x17.8; enabled; label=Player One signing 2 player name |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #p1Signing2League | 51.68x17.8; enabled; label=Player One signing 2 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #p1Signing2Nationality | 48.01x17.8; enabled; label=Player One signing 2 nationality. Search player nationality |
| 844x390 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=03 |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #p1Signing3Name | 57.31x17.8; enabled; label=Player One signing 3 player name |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #p1Signing3League | 51.68x17.8; enabled; label=Player One signing 3 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #p1Signing3Nationality | 48.01x17.8; enabled; label=Player One signing 3 nationality. Search player nationality |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #completeTransferChallenge | 109.97x17.8; enabled; label=LOCK MY SIGNINGS |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/signings-empty | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=239.84; right=349.81; top=323.75; bottom=341.54; viewport=844x390; enabled; text=LOCK MY SIGNINGS |
| 844x390 | playerOne/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=8; overflowX=visible; text=01 |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing1Name | 57.31x17.8; enabled; label=Player One signing 1 player name |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing1League | 51.68x17.8; enabled; label=Player One signing 1 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p1Signing1League-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=34; overflowX=visible; text=Premier League |
| 844x390 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p1Signing1League-listbox-option-1 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=34; overflowX=visible; text=Russian Premier League |
| 844x390 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p1Signing1League-listbox-option-2 > strong:nth-of-type(1) | scrollWidth=64; clientWidth=34; overflowX=visible; text=Scottish Premiership |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing1Nationality | 48.01x17.8; enabled; label=Player One signing 1 nationality. Search player nationality |
| 844x390 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=02 |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing2Name | 57.31x17.8; enabled; label=Player One signing 2 player name |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing2League | 51.68x17.8; enabled; label=Player One signing 2 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing2Nationality | 48.01x17.8; enabled; label=Player One signing 2 nationality. Search player nationality |
| 844x390 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=03 |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing3Name | 57.31x17.8; enabled; label=Player One signing 3 player name |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing3League | 51.68x17.8; enabled; label=Player One signing 3 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing3Nationality | 48.01x17.8; enabled; label=Player One signing 3 nationality. Search player nationality |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #completeTransferChallenge | 109.97x17.8; enabled; label=LOCK MY SIGNINGS |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/signing-league-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/signing-league-listbox | Open listbox visibility | #tw-p1Signing1League-listbox | CLIPPED; box=51.68x152.05; left=247.77; top=284.31; bottom=436.36; visibleWithinViewportAndAncestors=51.68x105.69; options=3; scrollHeight=188; clientHeight=159 |
| 844x390 | playerOne/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p1Signing1League-listbox-option-0 |
| 844x390 | playerOne/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=239.84; right=349.81; top=324.67; bottom=342.47; viewport=844x390; enabled; text=LOCK MY SIGNINGS |
| 844x390 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #p1Signing2League; intersection=49.82x14.26 |
| 844x390 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #p1Signing3League; intersection=49.82x17.8 |
| 844x390 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #completeTransferChallenge; intersection=49.82x17.13 |
| 844x390 | playerOne/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=8; overflowX=visible; text=01 |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing1Name | 57.31x17.8; enabled; label=Player One signing 1 player name |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing1League | 51.68x17.8; enabled; label=Player One signing 1 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing1Nationality | 48.01x17.8; enabled; label=Player One signing 1 nationality. Search player nationality |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #tw-p1Signing1Nationality-listbox-option-0 | 46.15x41.77; enabled; label=England |
| 844x390 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-p1Signing1Nationality-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=43; clientWidth=30; overflowX=visible; text=England |
| 844x390 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=02 |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing2Name | 57.31x17.8; enabled; label=Player One signing 2 player name |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing2League | 51.68x17.8; enabled; label=Player One signing 2 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing2Nationality | 48.01x17.8; enabled; label=Player One signing 2 nationality. Search player nationality |
| 844x390 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=03 |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing3Name | 57.31x17.8; enabled; label=Player One signing 3 player name |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing3League | 51.68x17.8; enabled; label=Player One signing 3 previous league. Search FIFA 17 previous league |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing3Nationality | 48.01x17.8; enabled; label=Player One signing 3 nationality. Search player nationality |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #completeTransferChallenge | 109.97x17.8; enabled; label=LOCK MY SIGNINGS |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/signing-nationality-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/signing-nationality-listbox | Open listbox visibility | #tw-p1Signing1Nationality-listbox | FULL; box=48.01x46.41; left=301.79; top=284.31; bottom=330.72; visibleWithinViewportAndAncestors=48.01x46.41; options=1; scrollHeight=45; clientHeight=45 |
| 844x390 | playerOne/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=239.84; right=349.81; top=324.67; bottom=342.47; viewport=844x390; enabled; text=LOCK MY SIGNINGS |
| 844x390 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #p1Signing2Nationality; intersection=46.15x14.26 |
| 844x390 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #p1Signing3Nationality; intersection=46.15x17.8 |
| 844x390 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=46.15x5.12 |
| 844x390 | playerOne/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 844x390 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=8; overflowX=visible; text=01 |
| 844x390 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=02 |
| 844x390 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=03 |
| 844x390 | playerOne/signings-locked | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerOne/signings-locked | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerOne/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerOne/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 844x390 | playerTwo/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=53; clientWidth=43; overflowX=visible; text=REPLAY |
| 844x390 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/replay-window | Touch control below 44 px | #continueFromTransfers | 159.43x28.29; enabled; label=CONTINUE REPLAY · WINDOW OPEN |
| 844x390 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerTwo/replay-window | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/replay-window | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=438; right=597.44; top=324.98; bottom=353.27; viewport=844x390; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 844x390 | playerTwo/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess1Type | 53.45x17.91; disabled; label=Guess 1 against Daniel type |
| 844x390 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess1Value | 53.45x17.91; disabled; label=Guess 1 against Daniel value. Search FIFA 17 previous league |
| 844x390 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #p1Guess1Value | scrollWidth=80; clientWidth=57; overflowX=clip; text=Premier League |
| 844x390 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess2Type | 53.45x17.91; disabled; label=Guess 2 against Daniel type |
| 844x390 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess2Value | 53.45x17.91; disabled; label=Guess 2 against Daniel value. Search player nationality |
| 844x390 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess3Type | 53.45x17.91; disabled; label=Guess 3 against Daniel type |
| 844x390 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess3Value | 53.45x17.91; disabled; label=Guess 3 against Daniel value. Search player nationality |
| 844x390 | playerTwo/replay-guesses | Touch control below 44 px | #continueFromTransfers | 163.2x28.29; enabled; label=CONTINUE REPLAY · GUESS ENTRY |
| 844x390 | playerTwo/replay-guesses | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/replay-guesses | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/replay-guesses | Main action in first screenful | #continueFromTransfers | NO; left=438; right=601.2; top=373.42; bottom=401.72; viewport=844x390; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 844x390 | playerTwo/replay-guesses | Replay pointer activation blocked | #continueFromTransfers | Pointer click timed out after 1500ms; <footer data-sd-enter="panel" class="hud-footer sd-entered">…</footer> intercepts pointer events; keyboard Enter used to reach next state |
| 844x390 | playerTwo/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=8; overflowX=visible; text=01 |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing1Name | 55.18x17.8; disabled; label=Player Two signing 1 player name |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing1League | 49.75x17.8; disabled; label=Player Two signing 1 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #p2Signing1League | scrollWidth=81; clientWidth=54; overflowX=clip; text=Primera División |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing1Nationality | 46.44x17.8; disabled; label=Player Two signing 1 nationality. Search player nationality |
| 844x390 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=02 |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing2Name | 55.18x17.8; disabled; label=Player Two signing 2 player name |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing2League | 49.75x17.8; disabled; label=Player Two signing 2 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing2Nationality | 46.44x17.8; disabled; label=Player Two signing 2 nationality. Search player nationality |
| 844x390 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=03 |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing3Name | 55.18x17.8; disabled; label=Player Two signing 3 player name |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing3League | 49.75x17.8; disabled; label=Player Two signing 3 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing3Nationality | 46.44x17.8; disabled; label=Player Two signing 3 nationality. Search player nationality |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #continueFromTransfers | 165.87x28.11; enabled; label=CONTINUE REPLAY · SIGNING ENTRY |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/replay-signings | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=434.16; right=600.03; top=338.74; bottom=366.85; viewport=844x390; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 844x390 | playerTwo/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 844x390 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/completed-populated | Touch control below 44 px | #continueFromTransfers | 83.65x4.65; enabled; label=CONTINUE TO SHARED SEASON RESULTS |
| 844x390 | playerTwo/completed-populated | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/completed-populated | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=647.47; right=731.12; top=321.49; bottom=326.14; viewport=844x390; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 844x390 | playerTwo/ready | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=45; clientWidth=36; overflowX=visible; text=00:00 |
| 844x390 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerTwo/ready | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/ready | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/ready | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/ready | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 844x390 | playerTwo/window | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=45; clientWidth=36; overflowX=visible; text=14:56 |
| 844x390 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/window | Touch control below 44 px | #endTransferTimer | 130.25x18.86; enabled; label=REQUEST EARLY END |
| 844x390 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerTwo/window | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/window | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/window | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/window | Main action in first screenful | #endTransferTimer | YES; left=467.19; right=597.44; top=333.48; bottom=352.34; viewport=844x390; enabled; text=REQUEST EARLY END |
| 844x390 | playerTwo/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=45; clientWidth=36; overflowX=visible; text=14:55 |
| 844x390 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/early-end-requested | Touch control below 44 px | #endTransferTimer | 159.8x18.86; disabled; label=EARLY END REQUESTED ✓ |
| 844x390 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 844x390 | playerTwo/early-end-requested | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/early-end-requested | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=437.64; right=597.44; top=334.41; bottom=353.27; viewport=844x390; disabled; text=EARLY END REQUESTED ✓ |
| 844x390 | playerTwo/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess1Type | 53.45x17.91; enabled; label=Guess 1 against Daniel type |
| 844x390 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess1Value | 53.45x17.91; disabled; label=Guess 1 against Daniel value. Search FIFA 17 previous league |
| 844x390 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess2Type | 53.45x17.91; enabled; label=Guess 2 against Daniel type |
| 844x390 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess2Value | 53.45x17.91; disabled; label=Guess 2 against Daniel value. Search player nationality |
| 844x390 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess3Type | 53.45x17.91; enabled; label=Guess 3 against Daniel type |
| 844x390 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess3Value | 53.45x17.91; disabled; label=Guess 3 against Daniel value. Search player nationality |
| 844x390 | playerTwo/guesses-empty | Touch control below 44 px | #completeTransferChallenge | 107.47x18.86; enabled; label=LOCK MY GUESSES |
| 844x390 | playerTwo/guesses-empty | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/guesses-empty | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/guesses-empty | Main action occluded at center | #completeTransferChallenge | covered by #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) |
| 844x390 | playerTwo/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=493.73; right=601.2; top=353.03; bottom=371.89; viewport=844x390; enabled; text=LOCK MY GUESSES |
| 844x390 | playerTwo/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess1Type | 53.45x17.91; enabled; label=Guess 1 against Daniel type |
| 844x390 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess1Value | 53.45x17.91; enabled; label=Guess 1 against Daniel value. Search FIFA 17 previous league |
| 844x390 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-p1Guess1Value-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=35; overflowX=visible; text=Premier League |
| 844x390 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-p1Guess1Value-listbox-option-1 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=35; overflowX=visible; text=Russian Premier League |
| 844x390 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-p1Guess1Value-listbox-option-2 > strong:nth-of-type(1) | scrollWidth=64; clientWidth=35; overflowX=visible; text=Scottish Premiership |
| 844x390 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess2Type | 53.45x17.91; enabled; label=Guess 2 against Daniel type |
| 844x390 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess2Value | 53.45x17.91; disabled; label=Guess 2 against Daniel value. Search player nationality |
| 844x390 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess3Type | 53.45x17.91; enabled; label=Guess 3 against Daniel type |
| 844x390 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess3Value | 53.45x17.91; disabled; label=Guess 3 against Daniel value. Search player nationality |
| 844x390 | playerTwo/guess-league-listbox | Touch control below 44 px | #completeTransferChallenge | 107.47x18.86; enabled; label=LOCK MY GUESSES |
| 844x390 | playerTwo/guess-league-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/guess-league-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/guess-league-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | CLIPPED; box=53.45x153.05; left=434.24; top=343.13; bottom=496.18; visibleWithinViewportAndAncestors=53.45x46.87; options=3; scrollHeight=188; clientHeight=159 |
| 844x390 | playerTwo/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/guess-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) |
| 844x390 | playerTwo/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=493.73; right=601.2; top=353.03; bottom=371.89; viewport=844x390; enabled; text=LOCK MY GUESSES |
| 844x390 | playerTwo/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess1Type | 53.45x17.91; enabled; label=Guess 1 against Daniel type |
| 844x390 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess1Value | 53.45x17.91; enabled; label=Guess 1 against Daniel value. Search player nationality |
| 844x390 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #tw-p1Guess1Value-listbox-option-0 | 51.58x42.05; enabled; label=England |
| 844x390 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-p1Guess1Value-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=43; clientWidth=35; overflowX=visible; text=England |
| 844x390 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess2Type | 53.45x17.91; enabled; label=Guess 2 against Daniel type |
| 844x390 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess2Value | 53.45x17.91; disabled; label=Guess 2 against Daniel value. Search player nationality |
| 844x390 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess3Type | 53.45x17.91; enabled; label=Guess 3 against Daniel type |
| 844x390 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess3Value | 53.45x17.91; disabled; label=Guess 3 against Daniel value. Search player nationality |
| 844x390 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #completeTransferChallenge | 107.47x18.86; enabled; label=LOCK MY GUESSES |
| 844x390 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/guess-nationality-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=53.45x46.72; left=434.24; top=343.13; bottom=389.85; visibleWithinViewportAndAncestors=53.45x46.72; options=1; scrollHeight=45; clientHeight=45 |
| 844x390 | playerTwo/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/guess-nationality-listbox | Main action occluded at center | #completeTransferChallenge | covered by #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) |
| 844x390 | playerTwo/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=493.73; right=601.2; top=353.03; bottom=371.89; viewport=844x390; enabled; text=LOCK MY GUESSES |
| 844x390 | playerTwo/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess1Type | 53.45x17.91; disabled; label=Guess 1 against Daniel type |
| 844x390 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess1Value | 53.45x17.91; disabled; label=Guess 1 against Daniel value. Search player nationality |
| 844x390 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess2Type | 53.45x17.91; disabled; label=Guess 2 against Daniel type |
| 844x390 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess2Value | 53.45x17.91; disabled; label=Guess 2 against Daniel value. Search player nationality |
| 844x390 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess3Type | 53.45x17.91; disabled; label=Guess 3 against Daniel type |
| 844x390 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess3Value | 53.45x17.91; disabled; label=Guess 3 against Daniel value. Search player nationality |
| 844x390 | playerTwo/guesses-locked | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/guesses-locked | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 844x390 | playerTwo/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=8; overflowX=visible; text=01 |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing1Name | 55.18x17.8; enabled; label=Player Two signing 1 player name |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing1League | 49.75x17.8; enabled; label=Player Two signing 1 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing1Nationality | 46.44x17.8; enabled; label=Player Two signing 1 nationality. Search player nationality |
| 844x390 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=02 |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing2Name | 55.18x17.8; enabled; label=Player Two signing 2 player name |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing2League | 49.75x17.8; enabled; label=Player Two signing 2 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing2Nationality | 46.44x17.8; enabled; label=Player Two signing 2 nationality. Search player nationality |
| 844x390 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=03 |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing3Name | 55.18x17.8; enabled; label=Player Two signing 3 player name |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing3League | 49.75x17.8; enabled; label=Player Two signing 3 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing3Nationality | 46.44x17.8; enabled; label=Player Two signing 3 nationality. Search player nationality |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #completeTransferChallenge | 109.97x17.8; enabled; label=LOCK MY SIGNINGS |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/signings-empty | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=490.06; right=600.03; top=342.96; bottom=360.76; viewport=844x390; enabled; text=LOCK MY SIGNINGS |
| 844x390 | playerTwo/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=8; overflowX=visible; text=01 |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing1Name | 55.18x17.8; enabled; label=Player Two signing 1 player name |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing1League | 49.75x17.8; enabled; label=Player Two signing 1 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p2Signing1League-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=32; overflowX=visible; text=Premier League |
| 844x390 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p2Signing1League-listbox-option-1 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=32; overflowX=visible; text=Russian Premier League |
| 844x390 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p2Signing1League-listbox-option-2 > strong:nth-of-type(1) | scrollWidth=64; clientWidth=32; overflowX=visible; text=Scottish Premiership |
| 844x390 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p2Signing1League-listbox-option-2 > span:nth-of-type(1) | scrollWidth=34; clientWidth=32; overflowX=visible; text=Scotland |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing1Nationality | 46.44x17.8; enabled; label=Player Two signing 1 nationality. Search player nationality |
| 844x390 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=02 |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing2Name | 55.18x17.8; enabled; label=Player Two signing 2 player name |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing2League | 49.75x17.8; enabled; label=Player Two signing 2 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing2Nationality | 46.44x17.8; enabled; label=Player Two signing 2 nationality. Search player nationality |
| 844x390 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=03 |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing3Name | 55.18x17.8; enabled; label=Player Two signing 3 player name |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing3League | 49.75x17.8; enabled; label=Player Two signing 3 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing3Nationality | 46.44x17.8; enabled; label=Player Two signing 3 nationality. Search player nationality |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #completeTransferChallenge | 109.97x17.8; enabled; label=LOCK MY SIGNINGS |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/signing-league-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/signing-league-listbox | Open listbox visibility | #tw-p2Signing1League-listbox | CLIPPED; box=49.75x152.05; left=501.49; top=303.53; bottom=455.58; visibleWithinViewportAndAncestors=49.75x86.47; options=3; scrollHeight=188; clientHeight=159 |
| 844x390 | playerTwo/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p2Signing1League-listbox-option-0 |
| 844x390 | playerTwo/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=490.06; right=600.03; top=343.89; bottom=361.69; viewport=844x390; enabled; text=LOCK MY SIGNINGS |
| 844x390 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #p2Signing2League; intersection=47.89x14.26 |
| 844x390 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #p2Signing3League; intersection=47.89x17.8 |
| 844x390 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #completeTransferChallenge; intersection=47.89x17.13 |
| 844x390 | playerTwo/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=8; overflowX=visible; text=01 |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing1Name | 55.18x17.8; enabled; label=Player Two signing 1 player name |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing1League | 49.75x17.8; enabled; label=Player Two signing 1 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing1Nationality | 46.44x17.8; enabled; label=Player Two signing 1 nationality. Search player nationality |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #tw-p2Signing1Nationality-listbox-option-0 | 44.59x41.77; enabled; label=England |
| 844x390 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-p2Signing1Nationality-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=43; clientWidth=28; overflowX=visible; text=England |
| 844x390 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=02 |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing2Name | 55.18x17.8; enabled; label=Player Two signing 2 player name |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing2League | 49.75x17.8; enabled; label=Player Two signing 2 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing2Nationality | 46.44x17.8; enabled; label=Player Two signing 2 nationality. Search player nationality |
| 844x390 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=03 |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing3Name | 55.18x17.8; enabled; label=Player Two signing 3 player name |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing3League | 49.75x17.8; enabled; label=Player Two signing 3 previous league. Search FIFA 17 previous league |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing3Nationality | 46.44x17.8; enabled; label=Player Two signing 3 nationality. Search player nationality |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #completeTransferChallenge | 109.97x17.8; enabled; label=LOCK MY SIGNINGS |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/signing-nationality-listbox | Open listbox visibility | #tw-p2Signing1Nationality-listbox | FULL; box=46.44x46.41; left=553.57; top=303.53; bottom=349.94; visibleWithinViewportAndAncestors=46.44x46.41; options=1; scrollHeight=45; clientHeight=45 |
| 844x390 | playerTwo/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=490.06; right=600.03; top=343.89; bottom=361.69; viewport=844x390; enabled; text=LOCK MY SIGNINGS |
| 844x390 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #p2Signing2Nationality; intersection=44.59x14.26 |
| 844x390 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #p2Signing3Nationality; intersection=44.59x17.8 |
| 844x390 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=44.59x5.12 |
| 844x390 | playerTwo/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=844, clientWidth=844; overflowX=visible/hidden |
| 844x390 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 844x390 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=8; overflowX=visible; text=01 |
| 844x390 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=02 |
| 844x390 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=8; overflowX=visible; text=03 |
| 844x390 | playerTwo/signings-locked | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 844x390 | playerTwo/signings-locked | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 844x390 | playerTwo/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 844x390 | playerTwo/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 932x430 | playerOne/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=58; clientWidth=48; overflowX=visible; text=REPLAY |
| 932x430 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/replay-window | Touch control below 44 px | #continueFromTransfers | 149.84x14.71; enabled; label=CONTINUE REPLAY · WINDOW OPEN |
| 932x430 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerOne/replay-window | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/replay-window | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=242.29; right=392.13; top=363.7; bottom=378.41; viewport=932x430; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 932x430 | playerOne/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess1Type | 53.49x17.31; disabled; label=Guess 1 against Nik type |
| 932x430 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess1Value | 53.49x17.31; disabled; label=Guess 1 against Nik value. Search FIFA 17 previous league |
| 932x430 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #p2Guess1Value | scrollWidth=80; clientWidth=65; overflowX=clip; text=Premier League |
| 932x430 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess2Type | 53.5x17.31; disabled; label=Guess 2 against Nik type |
| 932x430 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess2Value | 53.5x17.31; disabled; label=Guess 2 against Nik value. Search player nationality |
| 932x430 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess3Type | 53.49x17.31; disabled; label=Guess 3 against Nik type |
| 932x430 | playerOne/replay-guesses | Touch control below 44 px | #p2Guess3Value | 53.49x17.31; disabled; label=Guess 3 against Nik value. Search player nationality |
| 932x430 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferGuessPrivacyNote | scrollWidth=29; clientWidth=20; overflowX=visible; text=Hidden from Nik until you both lock. |
| 932x430 | playerOne/replay-guesses | Touch control below 44 px | #continueFromTransfers | 146.48x14.71; enabled; label=CONTINUE REPLAY · GUESS ENTRY |
| 932x430 | playerOne/replay-guesses | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/replay-guesses | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=249.31; right=395.79; top=391.55; bottom=406.25; viewport=932x430; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 932x430 | playerOne/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=9; overflowX=visible; text=01 |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #p1Signing1Name | 55.39x17.2; disabled; label=Player One signing 1 player name |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #p1Signing1League | 49.94x17.2; disabled; label=Player One signing 1 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/replay-signings | Text scrollWidth > clientWidth | #p1Signing1League | scrollWidth=81; clientWidth=61; overflowX=clip; text=Primera División |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #p1Signing1Nationality | 46.41x17.2; disabled; label=Player One signing 1 nationality. Search player nationality |
| 932x430 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=02 |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #p1Signing2Name | 55.39x17.2; disabled; label=Player One signing 2 player name |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #p1Signing2League | 49.94x17.2; disabled; label=Player One signing 2 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #p1Signing2Nationality | 46.41x17.2; disabled; label=Player One signing 2 nationality. Search player nationality |
| 932x430 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=03 |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #p1Signing3Name | 55.39x17.2; disabled; label=Player One signing 3 player name |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #p1Signing3League | 49.94x17.2; disabled; label=Player One signing 3 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #p1Signing3Nationality | 46.41x17.2; disabled; label=Player One signing 3 nationality. Search player nationality |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #continueFromTransfers | 153x14.61; enabled; label=CONTINUE REPLAY · SIGNING ENTRY |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/replay-signings | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=243.26; right=396.25; top=364.27; bottom=378.88; viewport=932x430; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 932x430 | playerOne/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 932x430 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/completed-populated | Touch control below 44 px | #continueFromTransfers | 80.82x4.35; enabled; label=CONTINUE TO SHARED SEASON RESULTS |
| 932x430 | playerOne/completed-populated | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/completed-populated | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=683.94; right=764.77; top=358.08; bottom=362.43; viewport=932x430; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 932x430 | playerOne/ready | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=50; clientWidth=40; overflowX=visible; text=00:00 |
| 932x430 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/ready | Touch control below 44 px | #startTransferTimer | 185.72x18.22; enabled; label=START SHARED 15-MINUTE WINDOW |
| 932x430 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerOne/ready | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/ready | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/ready | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/ready | Main action in first screenful | #startTransferTimer | YES; left=206.41; right=392.13; top=359.37; bottom=377.59; viewport=932x430; enabled; text=START SHARED 15-MINUTE WINDOW |
| 932x430 | playerOne/window | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=50; clientWidth=40; overflowX=visible; text=14:57 |
| 932x430 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/window | Touch control below 44 px | #endTransferTimer | 115.38x18.22; enabled; label=REQUEST EARLY END |
| 932x430 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerOne/window | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/window | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/window | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/window | Main action in first screenful | #endTransferTimer | YES; left=276.76; right=392.13; top=359.37; bottom=377.59; viewport=932x430; enabled; text=REQUEST EARLY END |
| 932x430 | playerOne/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=50; clientWidth=40; overflowX=visible; text=14:56 |
| 932x430 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/early-end-requested | Touch control below 44 px | #endTransferTimer | 141.24x18.22; disabled; label=EARLY END REQUESTED ✓ |
| 932x430 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerOne/early-end-requested | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/early-end-requested | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=250.89; right=392.13; top=360.19; bottom=378.41; viewport=932x430; disabled; text=EARLY END REQUESTED ✓ |
| 932x430 | playerOne/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess1Type | 53.49x17.31; enabled; label=Guess 1 against Nik type |
| 932x430 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess1Value | 53.49x17.31; disabled; label=Guess 1 against Nik value. Search FIFA 17 previous league |
| 932x430 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess2Type | 53.5x17.31; enabled; label=Guess 2 against Nik type |
| 932x430 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess2Value | 53.5x17.31; disabled; label=Guess 2 against Nik value. Search player nationality |
| 932x430 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess3Type | 53.49x17.31; enabled; label=Guess 3 against Nik type |
| 932x430 | playerOne/guesses-empty | Touch control below 44 px | #p2Guess3Value | 53.49x17.31; disabled; label=Guess 3 against Nik value. Search player nationality |
| 932x430 | playerOne/guesses-empty | Touch control below 44 px | #completeTransferChallenge | 95.11x18.22; enabled; label=LOCK MY GUESSES |
| 932x430 | playerOne/guesses-empty | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/guesses-empty | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=300.68; right=395.79; top=361.5; bottom=379.73; viewport=932x430; enabled; text=LOCK MY GUESSES |
| 932x430 | playerOne/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess1Type | 53.49x17.31; enabled; label=Guess 1 against Nik type |
| 932x430 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess1Value | 53.49x17.31; enabled; label=Guess 1 against Nik value. Search FIFA 17 previous league |
| 932x430 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-p2Guess1Value-listbox-option-2 > strong:nth-of-type(1) | scrollWidth=64; clientWidth=43; overflowX=visible; text=Scottish Premiership |
| 932x430 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess2Type | 53.5x17.31; enabled; label=Guess 2 against Nik type |
| 932x430 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess2Value | 53.5x17.31; disabled; label=Guess 2 against Nik value. Search player nationality |
| 932x430 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess3Type | 53.49x17.31; enabled; label=Guess 3 against Nik type |
| 932x430 | playerOne/guess-league-listbox | Touch control below 44 px | #p2Guess3Value | 53.49x17.31; disabled; label=Guess 3 against Nik value. Search player nationality |
| 932x430 | playerOne/guess-league-listbox | Touch control below 44 px | #completeTransferChallenge | 95.11x18.22; enabled; label=LOCK MY GUESSES |
| 932x430 | playerOne/guess-league-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/guess-league-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/guess-league-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | CLIPPED; box=53.49x133.62; left=228.93; top=359.71; bottom=493.34; visibleWithinViewportAndAncestors=53.49x70.29; options=3; scrollHeight=188; clientHeight=158 |
| 932x430 | playerOne/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=300.68; right=395.79; top=361.5; bottom=379.73; viewport=932x430; enabled; text=LOCK MY GUESSES |
| 932x430 | playerOne/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess1Type | 53.49x17.31; enabled; label=Guess 1 against Nik type |
| 932x430 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess1Value | 53.49x17.31; enabled; label=Guess 1 against Nik value. Search player nationality |
| 932x430 | playerOne/guess-nationality-listbox | Touch control below 44 px | #tw-p2Guess1Value-listbox-option-0 | 51.85x36.8; enabled; label=England |
| 932x430 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess2Type | 53.5x17.31; enabled; label=Guess 2 against Nik type |
| 932x430 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess2Value | 53.5x17.31; disabled; label=Guess 2 against Nik value. Search player nationality |
| 932x430 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess3Type | 53.49x17.31; enabled; label=Guess 3 against Nik type |
| 932x430 | playerOne/guess-nationality-listbox | Touch control below 44 px | #p2Guess3Value | 53.49x17.31; disabled; label=Guess 3 against Nik value. Search player nationality |
| 932x430 | playerOne/guess-nationality-listbox | Touch control below 44 px | #completeTransferChallenge | 95.11x18.22; enabled; label=LOCK MY GUESSES |
| 932x430 | playerOne/guess-nationality-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/guess-nationality-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/guess-nationality-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=53.49x40.89; left=228.93; top=359.71; bottom=400.6; visibleWithinViewportAndAncestors=53.49x40.89; options=1; scrollHeight=45; clientHeight=45 |
| 932x430 | playerOne/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=300.68; right=395.79; top=361.5; bottom=379.73; viewport=932x430; enabled; text=LOCK MY GUESSES |
| 932x430 | playerOne/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess1Type | 53.49x17.31; disabled; label=Guess 1 against Nik type |
| 932x430 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess1Value | 53.49x17.31; disabled; label=Guess 1 against Nik value. Search player nationality |
| 932x430 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess2Type | 53.5x17.31; disabled; label=Guess 2 against Nik type |
| 932x430 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess2Value | 53.5x17.31; disabled; label=Guess 2 against Nik value. Search player nationality |
| 932x430 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess3Type | 53.49x17.31; disabled; label=Guess 3 against Nik type |
| 932x430 | playerOne/guesses-locked | Touch control below 44 px | #p2Guess3Value | 53.49x17.31; disabled; label=Guess 3 against Nik value. Search player nationality |
| 932x430 | playerOne/guesses-locked | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/guesses-locked | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 932x430 | playerOne/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=9; overflowX=visible; text=01 |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #p1Signing1Name | 55.39x17.2; enabled; label=Player One signing 1 player name |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #p1Signing1League | 49.94x17.2; enabled; label=Player One signing 1 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #p1Signing1Nationality | 46.41x17.2; enabled; label=Player One signing 1 nationality. Search player nationality |
| 932x430 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=02 |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #p1Signing2Name | 55.39x17.2; enabled; label=Player One signing 2 player name |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #p1Signing2League | 49.94x17.2; enabled; label=Player One signing 2 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #p1Signing2Nationality | 46.41x17.2; enabled; label=Player One signing 2 nationality. Search player nationality |
| 932x430 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=03 |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #p1Signing3Name | 55.39x17.2; enabled; label=Player One signing 3 player name |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #p1Signing3League | 49.94x17.2; enabled; label=Player One signing 3 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #p1Signing3Nationality | 46.41x17.2; enabled; label=Player One signing 3 nationality. Search player nationality |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #completeTransferChallenge | 97.29x17.2; enabled; label=LOCK MY SIGNINGS |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/signings-empty | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=298.96; right=396.25; top=362.17; bottom=379.37; viewport=932x430; enabled; text=LOCK MY SIGNINGS |
| 932x430 | playerOne/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=9; overflowX=visible; text=01 |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing1Name | 55.39x17.2; enabled; label=Player One signing 1 player name |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing1League | 49.94x17.2; enabled; label=Player One signing 1 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p1Signing1League-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=39; overflowX=visible; text=Premier League |
| 932x430 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p1Signing1League-listbox-option-1 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=39; overflowX=visible; text=Russian Premier League |
| 932x430 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p1Signing1League-listbox-option-2 > strong:nth-of-type(1) | scrollWidth=64; clientWidth=39; overflowX=visible; text=Scottish Premiership |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing1Nationality | 46.41x17.2; enabled; label=Player One signing 1 nationality. Search player nationality |
| 932x430 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=02 |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing2Name | 55.39x17.2; enabled; label=Player One signing 2 player name |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing2League | 49.94x17.2; enabled; label=Player One signing 2 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing2Nationality | 46.41x17.2; enabled; label=Player One signing 2 nationality. Search player nationality |
| 932x430 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=03 |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing3Name | 55.39x17.2; enabled; label=Player One signing 3 player name |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing3League | 49.94x17.2; enabled; label=Player One signing 3 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #p1Signing3Nationality | 46.41x17.2; enabled; label=Player One signing 3 nationality. Search player nationality |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #completeTransferChallenge | 97.29x17.2; enabled; label=LOCK MY SIGNINGS |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/signing-league-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/signing-league-listbox | Open listbox visibility | #tw-p1Signing1League-listbox | CLIPPED; box=49.94x132.75; left=297.63; top=325.61; bottom=458.35; visibleWithinViewportAndAncestors=49.94x104.39; options=3; scrollHeight=188; clientHeight=158 |
| 932x430 | playerOne/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=298.96; right=396.25; top=362.98; bottom=380.18; viewport=932x430; enabled; text=LOCK MY SIGNINGS |
| 932x430 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #p1Signing2League; intersection=48.32x13.43 |
| 932x430 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #p1Signing3League; intersection=48.32x17.2 |
| 932x430 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #completeTransferChallenge; intersection=47.8x12.95 |
| 932x430 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=47.8x4.25 |
| 932x430 | playerOne/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=9; overflowX=visible; text=01 |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing1Name | 55.39x17.2; enabled; label=Player One signing 1 player name |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing1League | 49.94x17.2; enabled; label=Player One signing 1 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing1Nationality | 46.41x17.2; enabled; label=Player One signing 1 nationality. Search player nationality |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #tw-p1Signing1Nationality-listbox-option-0 | 44.79x36.56; enabled; label=England |
| 932x430 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-p1Signing1Nationality-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=43; clientWidth=35; overflowX=visible; text=England |
| 932x430 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=02 |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing2Name | 55.39x17.2; enabled; label=Player One signing 2 player name |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing2League | 49.94x17.2; enabled; label=Player One signing 2 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing2Nationality | 46.41x17.2; enabled; label=Player One signing 2 nationality. Search player nationality |
| 932x430 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=03 |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing3Name | 55.39x17.2; enabled; label=Player One signing 3 player name |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing3League | 49.94x17.2; enabled; label=Player One signing 3 previous league. Search FIFA 17 previous league |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #p1Signing3Nationality | 46.41x17.2; enabled; label=Player One signing 3 nationality. Search player nationality |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #completeTransferChallenge | 97.29x17.2; enabled; label=LOCK MY SIGNINGS |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/signing-nationality-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/signing-nationality-listbox | Open listbox visibility | #tw-p1Signing1Nationality-listbox | FULL; box=46.41x40.62; left=349.83; top=325.61; bottom=366.23; visibleWithinViewportAndAncestors=46.41x40.62; options=1; scrollHeight=45; clientHeight=45 |
| 932x430 | playerOne/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=298.96; right=396.25; top=362.98; bottom=380.18; viewport=932x430; enabled; text=LOCK MY SIGNINGS |
| 932x430 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #p1Signing2Nationality; intersection=44.79x13.43 |
| 932x430 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #p1Signing3Nationality; intersection=44.79x17.2 |
| 932x430 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=44.79x2.44 |
| 932x430 | playerOne/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 932x430 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=9; overflowX=visible; text=01 |
| 932x430 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=02 |
| 932x430 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=03 |
| 932x430 | playerOne/signings-locked | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerOne/signings-locked | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerOne/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerOne/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 932x430 | playerTwo/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=58; clientWidth=48; overflowX=visible; text=REPLAY |
| 932x430 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/replay-window | Touch control below 44 px | #continueFromTransfers | 149.84x14.71; enabled; label=CONTINUE REPLAY · WINDOW OPEN |
| 932x430 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerTwo/replay-window | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/replay-window | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=485.73; right=635.57; top=378.73; bottom=393.44; viewport=932x430; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 932x430 | playerTwo/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess1Type | 51.68x17.31; disabled; label=Guess 1 against Daniel type |
| 932x430 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess1Value | 51.68x17.31; disabled; label=Guess 1 against Daniel value. Search FIFA 17 previous league |
| 932x430 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #p1Guess1Value | scrollWidth=80; clientWidth=63; overflowX=clip; text=Premier League |
| 932x430 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess2Type | 51.68x17.31; disabled; label=Guess 2 against Daniel type |
| 932x430 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess2Value | 51.68x17.31; disabled; label=Guess 2 against Daniel value. Search player nationality |
| 932x430 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess3Type | 51.68x17.31; disabled; label=Guess 3 against Daniel type |
| 932x430 | playerTwo/replay-guesses | Touch control below 44 px | #p1Guess3Value | 51.68x17.31; disabled; label=Guess 3 against Daniel value. Search player nationality |
| 932x430 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferGuessPrivacyNote | scrollWidth=29; clientWidth=14; overflowX=visible; text=Hidden from Daniel until you both lock. |
| 932x430 | playerTwo/replay-guesses | Touch control below 44 px | #continueFromTransfers | 146.48x14.71; enabled; label=CONTINUE REPLAY · GUESS ENTRY |
| 932x430 | playerTwo/replay-guesses | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/replay-guesses | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/replay-guesses | Main action occluded at center | #continueFromTransfers | covered by #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) |
| 932x430 | playerTwo/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=492.75; right=639.23; top=413.42; bottom=428.13; viewport=932x430; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 932x430 | playerTwo/replay-guesses | Replay pointer activation blocked | #continueFromTransfers | Pointer click timed out after 1500ms; <ol class="rail" id="tw-transferPhaseNavigator" aria-label="Transfer Challenge progress">…</ol> from <footer data-sd-enter="panel" class="hud-footer sd-entered">…</footer> subtree intercepts pointer events; keyboard Enter used to reach next state |
| 932x430 | playerTwo/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=9; overflowX=visible; text=01 |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing1Name | 53.33x17.2; disabled; label=Player Two signing 1 player name |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing1League | 48.09x17.2; disabled; label=Player Two signing 1 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #p2Signing1League | scrollWidth=81; clientWidth=59; overflowX=clip; text=Primera División |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing1Nationality | 44.89x17.2; disabled; label=Player Two signing 1 nationality. Search player nationality |
| 932x430 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=02 |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing2Name | 53.33x17.2; disabled; label=Player Two signing 2 player name |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing2League | 48.09x17.2; disabled; label=Player Two signing 2 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing2Nationality | 44.89x17.2; disabled; label=Player Two signing 2 nationality. Search player nationality |
| 932x430 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=03 |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing3Name | 53.33x17.2; disabled; label=Player Two signing 3 player name |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing3League | 48.09x17.2; disabled; label=Player Two signing 3 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #p2Signing3Nationality | 44.89x17.2; disabled; label=Player Two signing 3 nationality. Search player nationality |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #continueFromTransfers | 153x14.61; enabled; label=CONTINUE REPLAY · SIGNING ENTRY |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/replay-signings | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; disabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=485.1; right=638.1; top=382.02; bottom=396.63; viewport=932x430; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 932x430 | playerTwo/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 932x430 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/completed-populated | Touch control below 44 px | #continueFromTransfers | 80.82x4.35; enabled; label=CONTINUE TO SHARED SEASON RESULTS |
| 932x430 | playerTwo/completed-populated | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/completed-populated | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=683.94; right=764.77; top=358.08; bottom=362.43; viewport=932x430; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 932x430 | playerTwo/ready | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=50; clientWidth=40; overflowX=visible; text=00:00 |
| 932x430 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerTwo/ready | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/ready | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/ready | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/ready | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 932x430 | playerTwo/window | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=50; clientWidth=40; overflowX=visible; text=14:56 |
| 932x430 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/window | Touch control below 44 px | #endTransferTimer | 115.38x18.22; enabled; label=REQUEST EARLY END |
| 932x430 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerTwo/window | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/window | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/window | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/window | Main action in first screenful | #endTransferTimer | YES; left=520.2; right=635.57; top=374.4; bottom=392.62; viewport=932x430; enabled; text=REQUEST EARLY END |
| 932x430 | playerTwo/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=50; clientWidth=40; overflowX=visible; text=14:55 |
| 932x430 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/early-end-requested | Touch control below 44 px | #endTransferTimer | 141.24x18.22; disabled; label=EARLY END REQUESTED ✓ |
| 932x430 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 932x430 | playerTwo/early-end-requested | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/early-end-requested | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=494.33; right=635.57; top=375.21; bottom=393.44; viewport=932x430; disabled; text=EARLY END REQUESTED ✓ |
| 932x430 | playerTwo/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess1Type | 51.68x17.31; enabled; label=Guess 1 against Daniel type |
| 932x430 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess1Value | 51.68x17.31; disabled; label=Guess 1 against Daniel value. Search FIFA 17 previous league |
| 932x430 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess2Type | 51.68x17.31; enabled; label=Guess 2 against Daniel type |
| 932x430 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess2Value | 51.68x17.31; disabled; label=Guess 2 against Daniel value. Search player nationality |
| 932x430 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess3Type | 51.68x17.31; enabled; label=Guess 3 against Daniel type |
| 932x430 | playerTwo/guesses-empty | Touch control below 44 px | #p1Guess3Value | 51.68x17.31; disabled; label=Guess 3 against Daniel value. Search player nationality |
| 932x430 | playerTwo/guesses-empty | Touch control below 44 px | #completeTransferChallenge | 95.11x18.22; enabled; label=LOCK MY GUESSES |
| 932x430 | playerTwo/guesses-empty | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/guesses-empty | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=544.12; right=639.23; top=389.69; bottom=407.91; viewport=932x430; enabled; text=LOCK MY GUESSES |
| 932x430 | playerTwo/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess1Type | 51.68x17.31; enabled; label=Guess 1 against Daniel type |
| 932x430 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess1Value | 51.68x17.31; enabled; label=Guess 1 against Daniel value. Search FIFA 17 previous league |
| 932x430 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-p1Guess1Value-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=41; overflowX=visible; text=Premier League |
| 932x430 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-p1Guess1Value-listbox-option-1 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=41; overflowX=visible; text=Russian Premier League |
| 932x430 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-p1Guess1Value-listbox-option-2 > strong:nth-of-type(1) | scrollWidth=64; clientWidth=41; overflowX=visible; text=Scottish Premiership |
| 932x430 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess2Type | 51.68x17.31; enabled; label=Guess 2 against Daniel type |
| 932x430 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess2Value | 51.68x17.31; disabled; label=Guess 2 against Daniel value. Search player nationality |
| 932x430 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess3Type | 51.68x17.31; enabled; label=Guess 3 against Daniel type |
| 932x430 | playerTwo/guess-league-listbox | Touch control below 44 px | #p1Guess3Value | 51.68x17.31; disabled; label=Guess 3 against Daniel value. Search player nationality |
| 932x430 | playerTwo/guess-league-listbox | Touch control below 44 px | #completeTransferChallenge | 95.11x18.22; enabled; label=LOCK MY GUESSES |
| 932x430 | playerTwo/guess-league-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/guess-league-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/guess-league-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | CLIPPED; box=51.68x133.62; left=477.84; top=381.59; bottom=515.21; visibleWithinViewportAndAncestors=51.68x48.41; options=3; scrollHeight=188; clientHeight=158 |
| 932x430 | playerTwo/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=544.12; right=639.23; top=388.87; bottom=407.1; viewport=932x430; enabled; text=LOCK MY GUESSES |
| 932x430 | playerTwo/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess1Type | 51.68x17.31; enabled; label=Guess 1 against Daniel type |
| 932x430 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess1Value | 51.68x17.31; enabled; label=Guess 1 against Daniel value. Search player nationality |
| 932x430 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #tw-p1Guess1Value-listbox-option-0 | 50.04x36.8; enabled; label=England |
| 932x430 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-p1Guess1Value-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=43; clientWidth=41; overflowX=visible; text=England |
| 932x430 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess2Type | 51.68x17.31; enabled; label=Guess 2 against Daniel type |
| 932x430 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess2Value | 51.68x17.31; disabled; label=Guess 2 against Daniel value. Search player nationality |
| 932x430 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess3Type | 51.68x17.31; enabled; label=Guess 3 against Daniel type |
| 932x430 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #p1Guess3Value | 51.68x17.31; disabled; label=Guess 3 against Daniel value. Search player nationality |
| 932x430 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #completeTransferChallenge | 95.11x18.22; enabled; label=LOCK MY GUESSES |
| 932x430 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/guess-nationality-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/guess-nationality-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=51.68x40.89; left=477.84; top=381.59; bottom=422.48; visibleWithinViewportAndAncestors=51.68x40.89; options=1; scrollHeight=45; clientHeight=45 |
| 932x430 | playerTwo/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=544.12; right=639.23; top=388.87; bottom=407.1; viewport=932x430; enabled; text=LOCK MY GUESSES |
| 932x430 | playerTwo/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess1Type | 51.68x17.31; disabled; label=Guess 1 against Daniel type |
| 932x430 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess1Value | 51.68x17.31; disabled; label=Guess 1 against Daniel value. Search player nationality |
| 932x430 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess2Type | 51.68x17.31; disabled; label=Guess 2 against Daniel type |
| 932x430 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess2Value | 51.68x17.31; disabled; label=Guess 2 against Daniel value. Search player nationality |
| 932x430 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess3Type | 51.68x17.31; disabled; label=Guess 3 against Daniel type |
| 932x430 | playerTwo/guesses-locked | Touch control below 44 px | #p1Guess3Value | 51.68x17.31; disabled; label=Guess 3 against Daniel value. Search player nationality |
| 932x430 | playerTwo/guesses-locked | Touch control below 44 px | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/guesses-locked | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 932x430 | playerTwo/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=9; overflowX=visible; text=01 |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing1Name | 53.33x17.2; enabled; label=Player Two signing 1 player name |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing1League | 48.09x17.2; enabled; label=Player Two signing 1 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing1Nationality | 44.89x17.2; enabled; label=Player Two signing 1 nationality. Search player nationality |
| 932x430 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=02 |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing2Name | 53.33x17.2; enabled; label=Player Two signing 2 player name |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing2League | 48.09x17.2; enabled; label=Player Two signing 2 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing2Nationality | 44.89x17.2; enabled; label=Player Two signing 2 nationality. Search player nationality |
| 932x430 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=03 |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing3Name | 53.33x17.2; enabled; label=Player Two signing 3 player name |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing3League | 48.09x17.2; enabled; label=Player Two signing 3 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #p2Signing3Nationality | 44.89x17.2; enabled; label=Player Two signing 3 nationality. Search player nationality |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #completeTransferChallenge | 97.29x17.2; enabled; label=LOCK MY SIGNINGS |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/signings-empty | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=540.81; right=638.1; top=380.73; bottom=397.93; viewport=932x430; enabled; text=LOCK MY SIGNINGS |
| 932x430 | playerTwo/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=9; overflowX=visible; text=01 |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing1Name | 53.33x17.2; enabled; label=Player Two signing 1 player name |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing1League | 48.09x17.2; enabled; label=Player Two signing 1 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p2Signing1League-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=37; overflowX=visible; text=Premier League |
| 932x430 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p2Signing1League-listbox-option-1 > strong:nth-of-type(1) | scrollWidth=42; clientWidth=37; overflowX=visible; text=Russian Premier League |
| 932x430 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-p2Signing1League-listbox-option-2 > strong:nth-of-type(1) | scrollWidth=64; clientWidth=37; overflowX=visible; text=Scottish Premiership |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing1Nationality | 44.89x17.2; enabled; label=Player Two signing 1 nationality. Search player nationality |
| 932x430 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=02 |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing2Name | 53.33x17.2; enabled; label=Player Two signing 2 player name |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing2League | 48.09x17.2; enabled; label=Player Two signing 2 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing2Nationality | 44.89x17.2; enabled; label=Player Two signing 2 nationality. Search player nationality |
| 932x430 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=03 |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing3Name | 53.33x17.2; enabled; label=Player Two signing 3 player name |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing3League | 48.09x17.2; enabled; label=Player Two signing 3 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #p2Signing3Nationality | 44.89x17.2; enabled; label=Player Two signing 3 nationality. Search player nationality |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #completeTransferChallenge | 97.29x17.2; enabled; label=LOCK MY SIGNINGS |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/signing-league-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/signing-league-listbox | Open listbox visibility | #tw-p2Signing1League-listbox | CLIPPED; box=48.09x132.75; left=542.85; top=344.16; bottom=476.91; visibleWithinViewportAndAncestors=48.09x85.84; options=3; scrollHeight=188; clientHeight=158 |
| 932x430 | playerTwo/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p2Signing1League-listbox-option-0 |
| 932x430 | playerTwo/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=540.81; right=638.1; top=381.54; bottom=398.74; viewport=932x430; enabled; text=LOCK MY SIGNINGS |
| 932x430 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #p2Signing2League; intersection=46.46x13.43 |
| 932x430 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #p2Signing3League; intersection=46.46x17.2 |
| 932x430 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #completeTransferChallenge; intersection=46.46x12.95 |
| 932x430 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=46.46x4.25 |
| 932x430 | playerTwo/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=9; overflowX=visible; text=01 |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing1Name | 53.33x17.2; enabled; label=Player Two signing 1 player name |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing1League | 48.09x17.2; enabled; label=Player Two signing 1 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing1Nationality | 44.89x17.2; enabled; label=Player Two signing 1 nationality. Search player nationality |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #tw-p2Signing1Nationality-listbox-option-0 | 43.26x36.56; enabled; label=England |
| 932x430 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-p2Signing1Nationality-listbox-option-0 > strong:nth-of-type(1) | scrollWidth=43; clientWidth=33; overflowX=visible; text=England |
| 932x430 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=02 |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing2Name | 53.33x17.2; enabled; label=Player Two signing 2 player name |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing2League | 48.09x17.2; enabled; label=Player Two signing 2 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing2Nationality | 44.89x17.2; enabled; label=Player Two signing 2 nationality. Search player nationality |
| 932x430 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=03 |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing3Name | 53.33x17.2; enabled; label=Player Two signing 3 player name |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing3League | 48.09x17.2; enabled; label=Player Two signing 3 previous league. Search FIFA 17 previous league |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #p2Signing3Nationality | 44.89x17.2; enabled; label=Player Two signing 3 nationality. Search player nationality |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #completeTransferChallenge | 97.29x17.2; enabled; label=LOCK MY SIGNINGS |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/signing-nationality-listbox | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/signing-nationality-listbox | Open listbox visibility | #tw-p2Signing1Nationality-listbox | FULL; box=44.89x40.62; left=593.2; top=344.16; bottom=384.79; visibleWithinViewportAndAncestors=44.89x40.62; options=1; scrollHeight=45; clientHeight=45 |
| 932x430 | playerTwo/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=540.81; right=638.1; top=381.54; bottom=398.74; viewport=932x430; enabled; text=LOCK MY SIGNINGS |
| 932x430 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #p2Signing2Nationality; intersection=43.26x13.43 |
| 932x430 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #p2Signing3Nationality; intersection=43.26x17.2 |
| 932x430 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=43.26x2.44 |
| 932x430 | playerTwo/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=932, clientWidth=932; overflowX=visible/hidden |
| 932x430 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 932x430 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=10; clientWidth=9; overflowX=visible; text=01 |
| 932x430 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=02 |
| 932x430 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > span:nth-of-type(1) | scrollWidth=11; clientWidth=9; overflowX=visible; text=03 |
| 932x430 | playerTwo/signings-locked | Touch control below 44 px | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1) | 66.25x26; enabled; label=BACK TO SHOWDOWN HOME |
| 932x430 | playerTwo/signings-locked | Touch control below 44 px | #refreshSharedTransferChallenge | 87.55x26; enabled; label=REFRESH SHARED CHALLENGE |
| 932x430 | playerTwo/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 932x430 | playerTwo/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 768x1024 | playerOne/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/replay-window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerOne/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=14; right=746; top=916; bottom=964; viewport=760x1014; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 768x1024 | playerOne/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/replay-guesses | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 768x1024 | playerOne/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/replay-signings | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerOne/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 768x1024 | playerOne/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 768x1024 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/completed-populated | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerOne/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerOne/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 768x1024 | playerOne/ready | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/ready | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerOne/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/ready | Main action in first screenful | #startTransferTimer | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=START SHARED 15-MINUTE WINDOW |
| 768x1024 | playerOne/window | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerOne/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/window | Main action in first screenful | #endTransferTimer | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=REQUEST EARLY END |
| 768x1024 | playerOne/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/early-end-requested | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=14; right=746; top=916; bottom=964; viewport=760x1014; disabled; text=EARLY END REQUESTED ✓ |
| 768x1024 | playerOne/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/guesses-empty | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=LOCK MY GUESSES |
| 768x1024 | playerOne/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/guess-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/guess-league-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=740x140; left=10; top=862; bottom=1002; visibleWithinViewportAndAncestors=740x140; options=3; scrollHeight=135; clientHeight=135 |
| 768x1024 | playerOne/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/guess-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p2Guess1Value-listbox-option-1 > span:nth-of-type(1) |
| 768x1024 | playerOne/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=916; bottom=964; viewport=760x1014; enabled; text=LOCK MY GUESSES |
| 768x1024 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-1 | with #completeTransferChallenge; intersection=732x40 |
| 768x1024 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #completeTransferChallenge; intersection=732x8 |
| 768x1024 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 768x1024 | playerOne/guess-league-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 768x1024 | playerOne/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/guess-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/guess-nationality-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=740x50; left=10; top=952; bottom=1002; visibleWithinViewportAndAncestors=740x50; options=1; scrollHeight=45; clientHeight=45 |
| 768x1024 | playerOne/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=LOCK MY GUESSES |
| 768x1024 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #completeTransferChallenge; intersection=732x7 |
| 768x1024 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 768x1024 | playerOne/guess-nationality-listbox | Enabled controls overlap | #tw-p2Guess1Value-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 768x1024 | playerOne/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/guesses-locked | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 768x1024 | playerOne/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/signings-empty | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerOne/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=LOCK MY SIGNINGS |
| 768x1024 | playerOne/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/signing-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/signing-league-listbox | Open listbox visibility | #tw-p1Signing1League-listbox | FULL; box=740x140; left=10; top=862; bottom=1002; visibleWithinViewportAndAncestors=740x140; options=3; scrollHeight=135; clientHeight=135 |
| 768x1024 | playerOne/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p1Signing1League-listbox-option-1 > span:nth-of-type(1) |
| 768x1024 | playerOne/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=916; bottom=964; viewport=760x1014; enabled; text=LOCK MY SIGNINGS |
| 768x1024 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=732x40 |
| 768x1024 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=732x8 |
| 768x1024 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 768x1024 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 768x1024 | playerOne/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/signing-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/signing-nationality-listbox | Open listbox visibility | #tw-p1Signing1Nationality-listbox | FULL; box=740x50; left=10; top=952; bottom=1002; visibleWithinViewportAndAncestors=740x50; options=1; scrollHeight=45; clientHeight=45 |
| 768x1024 | playerOne/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=916; bottom=964; viewport=760x1014; enabled; text=LOCK MY SIGNINGS |
| 768x1024 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=732x8 |
| 768x1024 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 768x1024 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 768x1024 | playerOne/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerOne/signings-locked | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerOne/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerOne/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerOne/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 768x1024 | playerTwo/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/replay-window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerTwo/replay-window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=14; right=746; top=916; bottom=964; viewport=760x1014; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 768x1024 | playerTwo/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/replay-guesses | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 768x1024 | playerTwo/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/replay-signings | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 768x1024 | playerTwo/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 768x1024 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/completed-populated | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerTwo/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 768x1024 | playerTwo/ready | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/ready | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerTwo/ready | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/ready | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 768x1024 | playerTwo/window | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/window | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerTwo/window | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/window | Main action in first screenful | #endTransferTimer | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=REQUEST EARLY END |
| 768x1024 | playerTwo/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/early-end-requested | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 768x1024 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=14; right=746; top=916; bottom=964; viewport=760x1014; disabled; text=EARLY END REQUESTED ✓ |
| 768x1024 | playerTwo/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/guesses-empty | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=LOCK MY GUESSES |
| 768x1024 | playerTwo/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/guess-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/guess-league-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=740x140; left=10; top=862; bottom=1002; visibleWithinViewportAndAncestors=740x140; options=3; scrollHeight=135; clientHeight=135 |
| 768x1024 | playerTwo/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/guess-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p1Guess1Value-listbox-option-1 > span:nth-of-type(1) |
| 768x1024 | playerTwo/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=916; bottom=964; viewport=760x1014; enabled; text=LOCK MY GUESSES |
| 768x1024 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-1 | with #completeTransferChallenge; intersection=732x40 |
| 768x1024 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #completeTransferChallenge; intersection=732x8 |
| 768x1024 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 768x1024 | playerTwo/guess-league-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 768x1024 | playerTwo/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/guess-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/guess-nationality-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=740x50; left=10; top=952; bottom=1002; visibleWithinViewportAndAncestors=740x50; options=1; scrollHeight=45; clientHeight=45 |
| 768x1024 | playerTwo/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=LOCK MY GUESSES |
| 768x1024 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #completeTransferChallenge; intersection=732x7 |
| 768x1024 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 768x1024 | playerTwo/guess-nationality-listbox | Enabled controls overlap | #tw-p1Guess1Value-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 768x1024 | playerTwo/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/guesses-locked | Element wider than window | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(3) > span:nth-of-type(2) | scrollWidth=44; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Signings |
| 768x1024 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 768x1024 | playerTwo/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/signings-empty | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=915; bottom=963; viewport=760x1014; enabled; text=LOCK MY SIGNINGS |
| 768x1024 | playerTwo/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/signing-league-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/signing-league-listbox | Open listbox visibility | #tw-p2Signing1League-listbox | FULL; box=740x140; left=10; top=862; bottom=1002; visibleWithinViewportAndAncestors=740x140; options=3; scrollHeight=135; clientHeight=135 |
| 768x1024 | playerTwo/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/signing-league-listbox | Main action occluded at center | #completeTransferChallenge | covered by #tw-p2Signing1League-listbox-option-1 > span:nth-of-type(1) |
| 768x1024 | playerTwo/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=916; bottom=964; viewport=760x1014; enabled; text=LOCK MY SIGNINGS |
| 768x1024 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=732x40 |
| 768x1024 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=732x8 |
| 768x1024 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 768x1024 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 768x1024 | playerTwo/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/signing-nationality-listbox | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/signing-nationality-listbox | Open listbox visibility | #tw-p2Signing1Nationality-listbox | FULL; box=740x50; left=10; top=952; bottom=1002; visibleWithinViewportAndAncestors=740x50; options=1; scrollHeight=45; clientHeight=45 |
| 768x1024 | playerTwo/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=14; right=746; top=916; bottom=964; viewport=760x1014; enabled; text=LOCK MY SIGNINGS |
| 768x1024 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #completeTransferChallenge; intersection=732x8 |
| 768x1024 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > footer:nth-of-type(1) > button:nth-of-type(1); intersection=59.25x31 |
| 768x1024 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #refreshSharedTransferChallenge; intersection=80.55x31 |
| 768x1024 | playerTwo/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=760, clientWidth=760; overflowX=visible/hidden |
| 768x1024 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > h1:nth-of-type(1) > span:nth-of-type(1) | scrollWidth=228; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=TRANSFER WAR |
| 768x1024 | playerTwo/signings-locked | Element wider than window | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) | width=1198.78; window=760; left=-234.59; right=964.19; classes=plane |
| 768x1024 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=39; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Window |
| 768x1024 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(2) > span:nth-of-type(2) | scrollWidth=42; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Guesses |
| 768x1024 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #tw-transferPhaseNavigator > li:nth-of-type(4) > span:nth-of-type(2) | scrollWidth=43; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=Verdicts |
| 768x1024 | playerTwo/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | NONE |
| 768x1024 | playerTwo/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1280x650 | playerOne/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=80; clientWidth=66; overflowX=visible; text=REPLAY |
| 1280x650 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerOne/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=338.32; right=519.19; top=567.24; bottom=585.94; viewport=1280x650; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 1280x650 | playerOne/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=348.29; right=525.16; top=556.06; bottom=574.77; viewport=1280x650; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 1280x650 | playerOne/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=341.29; right=525.91; top=562.86; bottom=581.44; viewport=1280x650; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 1280x650 | playerOne/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 1280x650 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=996.51; right=1128.75; top=523.24; bottom=554.14; viewport=1280x650; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 1280x650 | playerOne/ready | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=69; clientWidth=55; overflowX=visible; text=00:00 |
| 1280x650 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerOne/ready | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/ready | Main action in first screenful | #startTransferTimer | YES; left=291.45; right=519.19; top=555.15; bottom=584.97; viewport=1280x650; enabled; text=START SHARED 15-MINUTE WINDOW |
| 1280x650 | playerOne/window | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=69; clientWidth=55; overflowX=visible; text=14:56 |
| 1280x650 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerOne/window | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/window | Main action in first screenful | #endTransferTimer | YES; left=375.26; right=519.19; top=555.15; bottom=584.97; viewport=1280x650; enabled; text=REQUEST EARLY END |
| 1280x650 | playerOne/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=69; clientWidth=55; overflowX=visible; text=14:55 |
| 1280x650 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerOne/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=344.45; right=519.19; top=556.12; bottom=585.94; viewport=1280x650; disabled; text=EARLY END REQUESTED ✓ |
| 1280x650 | playerOne/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=407.01; right=525.16; top=551.36; bottom=581.18; viewport=1280x650; enabled; text=LOCK MY GUESSES |
| 1280x650 | playerOne/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/guess-league-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | CLIPPED; box=87.52x187.62; left=252.2; top=550.05; bottom=737.67; visibleWithinViewportAndAncestors=87.52x99.95; options=3; scrollHeight=188; clientHeight=188 |
| 1280x650 | playerOne/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=407.01; right=525.16; top=551.36; bottom=581.18; viewport=1280x650; enabled; text=LOCK MY GUESSES |
| 1280x650 | playerOne/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/guess-nationality-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=87.52x48.7; left=252.2; top=550.05; bottom=598.76; visibleWithinViewportAndAncestors=87.52x48.7; options=1; scrollHeight=45; clientHeight=45 |
| 1280x650 | playerOne/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=407.01; right=525.16; top=551.36; bottom=581.18; viewport=1280x650; enabled; text=LOCK MY GUESSES |
| 1280x650 | playerOne/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1280x650 | playerOne/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=405.2; right=525.91; top=558.08; bottom=586.22; viewport=1280x650; enabled; text=LOCK MY SIGNINGS |
| 1280x650 | playerOne/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/signing-league-listbox | Open listbox visibility | #tw-p1Signing1League-listbox | CLIPPED; box=96.77x186.39; left=343.63; top=497.92; bottom=684.31; visibleWithinViewportAndAncestors=96.77x152.08; options=3; scrollHeight=188; clientHeight=188 |
| 1280x650 | playerOne/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=405.2; right=525.91; top=559.05; bottom=587.19; viewport=1280x650; enabled; text=LOCK MY SIGNINGS |
| 1280x650 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #p1Signing2League; intersection=94.84x23.95 |
| 1280x650 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #p1Signing3League; intersection=94.84x28.14 |
| 1280x650 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=34.23x28.14 |
| 1280x650 | playerOne/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/signing-nationality-listbox | Open listbox visibility | #tw-p1Signing1Nationality-listbox | FULL; box=96.77x48.39; left=444.09; top=497.92; bottom=546.3; visibleWithinViewportAndAncestors=96.77x48.39; options=1; scrollHeight=45; clientHeight=45 |
| 1280x650 | playerOne/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=405.2; right=525.91; top=559.05; bottom=587.19; viewport=1280x650; enabled; text=LOCK MY SIGNINGS |
| 1280x650 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #p1Signing2Nationality; intersection=94.84x23.95 |
| 1280x650 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #p1Signing3Nationality; intersection=94.84x17.01 |
| 1280x650 | playerOne/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1280x650 | playerOne/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerOne/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerOne/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1280x650 | playerTwo/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=80; clientWidth=66; overflowX=visible; text=REPLAY |
| 1280x650 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerTwo/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=736.52; right=917.4; top=591.83; bottom=610.54; viewport=1280x650; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 1280x650 | playerTwo/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=746.49; right=923.36; top=590.87; bottom=609.58; viewport=1280x650; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 1280x650 | playerTwo/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #p2Signing1Name | scrollWidth=71; clientWidth=70; overflowX=clip; text=Player B |
| 1280x650 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #p2Signing2Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #p2Signing3Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=736.89; right=921.51; top=593.45; bottom=612.03; viewport=1280x650; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 1280x650 | playerTwo/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 1280x650 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=996.51; right=1128.75; top=523.24; bottom=554.14; viewport=1280x650; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 1280x650 | playerTwo/ready | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=69; clientWidth=55; overflowX=visible; text=00:00 |
| 1280x650 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerTwo/ready | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/ready | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1280x650 | playerTwo/window | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=69; clientWidth=55; overflowX=visible; text=14:56 |
| 1280x650 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerTwo/window | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/window | Main action in first screenful | #endTransferTimer | YES; left=773.46; right=917.4; top=579.75; bottom=609.56; viewport=1280x650; enabled; text=REQUEST EARLY END |
| 1280x650 | playerTwo/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=69; clientWidth=55; overflowX=visible; text=14:55 |
| 1280x650 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1280x650 | playerTwo/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=742.66; right=917.4; top=580.72; bottom=610.54; viewport=1280x650; disabled; text=EARLY END REQUESTED ✓ |
| 1280x650 | playerTwo/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=805.21; right=923.36; top=587.14; bottom=616.96; viewport=1280x650; enabled; text=LOCK MY GUESSES |
| 1280x650 | playerTwo/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/guess-league-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | CLIPPED; box=84.53x187.62; left=659.36; top=585.83; bottom=773.45; visibleWithinViewportAndAncestors=84.53x64.17; options=3; scrollHeight=188; clientHeight=188 |
| 1280x650 | playerTwo/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=805.21; right=923.36; top=587.14; bottom=616.96; viewport=1280x650; enabled; text=LOCK MY GUESSES |
| 1280x650 | playerTwo/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/guess-nationality-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=84.53x48.7; left=659.36; top=585.83; bottom=634.54; visibleWithinViewportAndAncestors=84.53x48.7; options=1; scrollHeight=45; clientHeight=45 |
| 1280x650 | playerTwo/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=805.21; right=923.36; top=587.14; bottom=616.96; viewport=1280x650; enabled; text=LOCK MY GUESSES |
| 1280x650 | playerTwo/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1280x650 | playerTwo/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #p2Signing1Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #p2Signing2Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #p2Signing3Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=800.8; right=921.51; top=588.46; bottom=616.6; viewport=1280x650; enabled; text=LOCK MY SIGNINGS |
| 1280x650 | playerTwo/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #p2Signing1Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #p2Signing2Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #p2Signing3Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/signing-league-listbox | Open listbox visibility | #tw-p2Signing1League-listbox | CLIPPED; box=96.77x186.39; left=746.63; top=528.29; bottom=714.68; visibleWithinViewportAndAncestors=96.77x121.71; options=3; scrollHeight=188; clientHeight=188 |
| 1280x650 | playerTwo/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=800.8; right=921.51; top=589.43; bottom=617.57; viewport=1280x650; enabled; text=LOCK MY SIGNINGS |
| 1280x650 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #p2Signing2League; intersection=94.84x23.95 |
| 1280x650 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #p2Signing3League; intersection=94.84x28.14 |
| 1280x650 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=41.63x28.14 |
| 1280x650 | playerTwo/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #p2Signing1Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #p2Signing2Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #p2Signing3Name | scrollWidth=71; clientWidth=70; overflowX=clip; text= |
| 1280x650 | playerTwo/signing-nationality-listbox | Open listbox visibility | #tw-p2Signing1Nationality-listbox | FULL; box=96.77x48.39; left=847.09; top=528.29; bottom=576.68; visibleWithinViewportAndAncestors=96.77x48.39; options=1; scrollHeight=45; clientHeight=45 |
| 1280x650 | playerTwo/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=800.8; right=921.51; top=589.43; bottom=617.57; viewport=1280x650; enabled; text=LOCK MY SIGNINGS |
| 1280x650 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #p2Signing2Nationality; intersection=94.84x23.95 |
| 1280x650 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #p2Signing3Nationality; intersection=94.84x17.01 |
| 1280x650 | playerTwo/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1280, clientWidth=1280; overflowX=visible/hidden |
| 1280x650 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1280x650 | playerTwo/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 1280x650 | playerTwo/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1280x650 | playerTwo/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1366x768 | playerOne/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=85; clientWidth=70; overflowX=visible; text=REPLAY |
| 1366x768 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerOne/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=364.33; right=550.64; top=632.16; bottom=651.67; viewport=1366x768; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 1366x768 | playerOne/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=374.97; right=557.17; top=618.13; bottom=637.64; viewport=1366x768; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 1366x768 | playerOne/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=365.77; right=557.17; top=631.64; bottom=651.16; viewport=1366x768; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 1366x768 | playerOne/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 1366x768 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=1075.14; right=1220.58; top=586.83; bottom=618.98; viewport=1366x768; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 1366x768 | playerOne/ready | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=73; clientWidth=59; overflowX=visible; text=00:00 |
| 1366x768 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerOne/ready | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/ready | Main action in first screenful | #startTransferTimer | YES; left=301.23; right=550.64; top=618; bottom=650.67; viewport=1366x768; enabled; text=START SHARED 15-MINUTE WINDOW |
| 1366x768 | playerOne/window | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=73; clientWidth=59; overflowX=visible; text=14:56 |
| 1366x768 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerOne/window | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/window | Main action in first screenful | #endTransferTimer | YES; left=393.05; right=550.64; top=618; bottom=650.67; viewport=1366x768; enabled; text=REQUEST EARLY END |
| 1366x768 | playerOne/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=73; clientWidth=59; overflowX=visible; text=14:55 |
| 1366x768 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerOne/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=359.3; right=550.64; top=619; bottom=651.67; viewport=1366x768; disabled; text=EARLY END REQUESTED ✓ |
| 1366x768 | playerOne/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=427.7; right=557.17; top=613.45; bottom=646.13; viewport=1366x768; enabled; text=LOCK MY GUESSES |
| 1366x768 | playerOne/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/guess-league-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | CLIPPED; box=95.86x192.61; left=258.16; top=611.73; bottom=804.34; visibleWithinViewportAndAncestors=95.86x156.27; options=3; scrollHeight=188; clientHeight=188 |
| 1366x768 | playerOne/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=427.7; right=557.17; top=613.45; bottom=646.13; viewport=1366x768; enabled; text=LOCK MY GUESSES |
| 1366x768 | playerOne/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/guess-nationality-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=95.86x50; left=258.16; top=611.73; bottom=661.73; visibleWithinViewportAndAncestors=95.86x50; options=1; scrollHeight=45; clientHeight=45 |
| 1366x768 | playerOne/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=427.7; right=557.17; top=613.45; bottom=646.13; viewport=1366x768; enabled; text=LOCK MY GUESSES |
| 1366x768 | playerOne/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1366x768 | playerOne/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=424.02; right=557.17; top=624.89; bottom=655.92; viewport=1366x768; enabled; text=LOCK MY SIGNINGS |
| 1366x768 | playerOne/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/signing-league-listbox | Open listbox visibility | #tw-p1Signing1League-listbox | FULL; box=100x192.61; left=353.08; top=558.25; bottom=750.86; visibleWithinViewportAndAncestors=100x192.61; options=3; scrollHeight=188; clientHeight=188 |
| 1366x768 | playerOne/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=424.02; right=557.17; top=625.89; bottom=656.92; viewport=1366x768; enabled; text=LOCK MY SIGNINGS |
| 1366x768 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #p1Signing2League; intersection=98x26.89 |
| 1366x768 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #p1Signing3League; intersection=98x28.19 |
| 1366x768 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #p1Signing3League; intersection=98x2.84 |
| 1366x768 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=28.06x31.03 |
| 1366x768 | playerOne/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/signing-nationality-listbox | Open listbox visibility | #tw-p1Signing1Nationality-listbox | FULL; box=100x50; left=457.16; top=558.25; bottom=608.25; visibleWithinViewportAndAncestors=100x50; options=1; scrollHeight=45; clientHeight=45 |
| 1366x768 | playerOne/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=424.02; right=557.17; top=625.89; bottom=656.92; viewport=1366x768; enabled; text=LOCK MY SIGNINGS |
| 1366x768 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #p1Signing2Nationality; intersection=98x26.89 |
| 1366x768 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #p1Signing3Nationality; intersection=98x15.25 |
| 1366x768 | playerOne/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1366x768 | playerOne/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerOne/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerOne/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1366x768 | playerTwo/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=85; clientWidth=70; overflowX=visible; text=REPLAY |
| 1366x768 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerTwo/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=800.61; right=986.92; top=659.11; bottom=678.63; viewport=1366x768; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 1366x768 | playerTwo/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=811.25; right=993.45; top=656.33; bottom=675.84; viewport=1366x768; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 1366x768 | playerTwo/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=802.05; right=993.45; top=664.13; bottom=683.64; viewport=1366x768; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 1366x768 | playerTwo/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 1366x768 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=1075.14; right=1220.58; top=586.83; bottom=618.98; viewport=1366x768; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 1366x768 | playerTwo/ready | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=73; clientWidth=59; overflowX=visible; text=00:00 |
| 1366x768 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerTwo/ready | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/ready | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1366x768 | playerTwo/window | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=73; clientWidth=59; overflowX=visible; text=14:56 |
| 1366x768 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerTwo/window | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/window | Main action in first screenful | #endTransferTimer | YES; left=829.33; right=986.92; top=644.95; bottom=677.63; viewport=1366x768; enabled; text=REQUEST EARLY END |
| 1366x768 | playerTwo/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=73; clientWidth=59; overflowX=visible; text=14:55 |
| 1366x768 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1366x768 | playerTwo/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=795.58; right=986.92; top=645.95; bottom=678.63; viewport=1366x768; disabled; text=EARLY END REQUESTED ✓ |
| 1366x768 | playerTwo/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=863.98; right=993.45; top=652.66; bottom=685.33; viewport=1366x768; enabled; text=LOCK MY GUESSES |
| 1366x768 | playerTwo/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/guess-league-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | CLIPPED; box=92.59x192.61; left=704.23; top=650.94; bottom=843.55; visibleWithinViewportAndAncestors=92.59x117.06; options=3; scrollHeight=188; clientHeight=188 |
| 1366x768 | playerTwo/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=863.98; right=993.45; top=652.66; bottom=685.33; viewport=1366x768; enabled; text=LOCK MY GUESSES |
| 1366x768 | playerTwo/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/guess-nationality-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=92.59x50; left=704.23; top=650.94; bottom=700.94; visibleWithinViewportAndAncestors=92.59x50; options=1; scrollHeight=45; clientHeight=45 |
| 1366x768 | playerTwo/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=863.98; right=993.45; top=652.66; bottom=685.33; viewport=1366x768; enabled; text=LOCK MY GUESSES |
| 1366x768 | playerTwo/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1366x768 | playerTwo/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=860.3; right=993.45; top=658.38; bottom=689.41; viewport=1366x768; enabled; text=LOCK MY SIGNINGS |
| 1366x768 | playerTwo/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/signing-league-listbox | Open listbox visibility | #tw-p2Signing1League-listbox | CLIPPED; box=100x192.61; left=797.45; top=591.73; bottom=784.34; visibleWithinViewportAndAncestors=100x176.27; options=3; scrollHeight=188; clientHeight=188 |
| 1366x768 | playerTwo/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=860.3; right=993.45; top=659.38; bottom=690.41; viewport=1366x768; enabled; text=LOCK MY SIGNINGS |
| 1366x768 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #p2Signing2League; intersection=98x26.89 |
| 1366x768 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #p2Signing3League; intersection=98x28.19 |
| 1366x768 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #p2Signing3League; intersection=98x2.84 |
| 1366x768 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=36.16x31.03 |
| 1366x768 | playerTwo/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/signing-nationality-listbox | Open listbox visibility | #tw-p2Signing1Nationality-listbox | FULL; box=100x50; left=901.53; top=591.73; bottom=641.73; visibleWithinViewportAndAncestors=100x50; options=1; scrollHeight=45; clientHeight=45 |
| 1366x768 | playerTwo/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=860.3; right=993.45; top=659.38; bottom=690.41; viewport=1366x768; enabled; text=LOCK MY SIGNINGS |
| 1366x768 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #p2Signing2Nationality; intersection=98x26.89 |
| 1366x768 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #p2Signing3Nationality; intersection=98x15.25 |
| 1366x768 | playerTwo/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1366, clientWidth=1366; overflowX=visible/hidden |
| 1366x768 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1366x768 | playerTwo/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 1366x768 | playerTwo/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1366x768 | playerTwo/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1920x1080 | playerOne/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=120; clientWidth=99; overflowX=visible; text=REPLAY |
| 1920x1080 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerOne/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=531.94; right=773.97; top=869.59; bottom=894.88; viewport=1920x1080; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 1920x1080 | playerOne/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=546.44; right=783.16; top=848.58; bottom=873.86; viewport=1920x1080; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 1920x1080 | playerOne/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=534.52; right=783.16; top=867.83; bottom=893.11; viewport=1920x1080; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 1920x1080 | playerOne/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 1920x1080 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=1511.17; right=1715.59; top=807.25; bottom=848.94; viewport=1920x1080; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 1920x1080 | playerOne/ready | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=103; clientWidth=83; overflowX=visible; text=00:00 |
| 1920x1080 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerOne/ready | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/ready | Main action in first screenful | #startTransferTimer | YES; left=424.06; right=773.97; top=847.95; bottom=893.88; viewport=1920x1080; enabled; text=START SHARED 15-MINUTE WINDOW |
| 1920x1080 | playerOne/window | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=103; clientWidth=83; overflowX=visible; text=14:54 |
| 1920x1080 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerOne/window | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/window | Main action in first screenful | #endTransferTimer | YES; left=553.19; right=773.97; top=847.95; bottom=893.88; viewport=1920x1080; enabled; text=REQUEST EARLY END |
| 1920x1080 | playerOne/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=103; clientWidth=83; overflowX=visible; text=14:53 |
| 1920x1080 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerOne/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=505.73; right=773.97; top=848.95; bottom=894.88; viewport=1920x1080; disabled; text=EARLY END REQUESTED ✓ |
| 1920x1080 | playerOne/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=601.11; right=783.16; top=841.58; bottom=887.5; viewport=1920x1080; enabled; text=LOCK MY GUESSES |
| 1920x1080 | playerOne/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/guess-league-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=134.75x152.94; left=362.84; top=837.55; bottom=990.48; visibleWithinViewportAndAncestors=134.75x152.94; options=3; scrollHeight=148; clientHeight=148 |
| 1920x1080 | playerOne/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=601.11; right=783.16; top=841.58; bottom=887.5; viewport=1920x1080; enabled; text=LOCK MY GUESSES |
| 1920x1080 | playerOne/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/guess-nationality-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=134.75x50; left=362.84; top=837.55; bottom=887.55; visibleWithinViewportAndAncestors=134.75x50; options=1; scrollHeight=45; clientHeight=45 |
| 1920x1080 | playerOne/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=601.11; right=783.16; top=841.58; bottom=887.5; viewport=1920x1080; enabled; text=LOCK MY GUESSES |
| 1920x1080 | playerOne/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1920x1080 | playerOne/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=595.94; right=783.16; top=857.66; bottom=901.28; viewport=1920x1080; enabled; text=LOCK MY SIGNINGS |
| 1920x1080 | playerOne/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/signing-league-listbox | Open listbox visibility | #tw-p1Signing1League-listbox | FULL; box=130.63x165.88; left=537.55; top=762.36; bottom=928.23; visibleWithinViewportAndAncestors=130.63x165.88; options=3; scrollHeight=161; clientHeight=161 |
| 1920x1080 | playerOne/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=595.94; right=783.16; top=858.66; bottom=902.28; viewport=1920x1080; enabled; text=LOCK MY SIGNINGS |
| 1920x1080 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #p1Signing2League; intersection=128.63x40.64 |
| 1920x1080 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #p1Signing3League; intersection=128.63x43.28 |
| 1920x1080 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=71.23x10.64 |
| 1920x1080 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=71.23x32.98 |
| 1920x1080 | playerOne/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/signing-nationality-listbox | Open listbox visibility | #tw-p1Signing1Nationality-listbox | FULL; box=109.23x50; left=673.91; top=762.36; bottom=812.36; visibleWithinViewportAndAncestors=109.23x50; options=1; scrollHeight=45; clientHeight=45 |
| 1920x1080 | playerOne/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=595.94; right=783.16; top=858.66; bottom=902.28; viewport=1920x1080; enabled; text=LOCK MY SIGNINGS |
| 1920x1080 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #p1Signing2Nationality; intersection=107.23x40.64 |
| 1920x1080 | playerOne/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 1920x1080 | playerOne/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerOne/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerOne/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1920x1080 | playerTwo/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=120; clientWidth=99; overflowX=visible; text=REPLAY |
| 1920x1080 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerTwo/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=1145.16; right=1387.19; top=907.48; bottom=932.77; viewport=1920x1080; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 1920x1080 | playerTwo/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=1159.66; right=1396.38; top=902.69; bottom=927.97; viewport=1920x1080; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 1920x1080 | playerTwo/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=1147.73; right=1396.38; top=913.91; bottom=939.19; viewport=1920x1080; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 1920x1080 | playerTwo/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 1920x1080 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=1511.17; right=1715.59; top=807.25; bottom=848.94; viewport=1920x1080; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 1920x1080 | playerTwo/ready | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=103; clientWidth=83; overflowX=visible; text=00:00 |
| 1920x1080 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerTwo/ready | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/ready | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1920x1080 | playerTwo/window | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=103; clientWidth=83; overflowX=visible; text=14:54 |
| 1920x1080 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerTwo/window | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/window | Main action in first screenful | #endTransferTimer | YES; left=1166.41; right=1387.19; top=885.84; bottom=931.77; viewport=1920x1080; enabled; text=REQUEST EARLY END |
| 1920x1080 | playerTwo/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=103; clientWidth=83; overflowX=visible; text=14:53 |
| 1920x1080 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 1920x1080 | playerTwo/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=1118.95; right=1387.19; top=886.84; bottom=932.77; viewport=1920x1080; disabled; text=EARLY END REQUESTED ✓ |
| 1920x1080 | playerTwo/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=1214.33; right=1396.38; top=896.69; bottom=942.61; viewport=1920x1080; enabled; text=LOCK MY GUESSES |
| 1920x1080 | playerTwo/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/guess-league-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=130.16x165.88; left=989.84; top=892.66; bottom=1058.53; visibleWithinViewportAndAncestors=130.16x165.88; options=3; scrollHeight=161; clientHeight=161 |
| 1920x1080 | playerTwo/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=1214.33; right=1396.38; top=896.69; bottom=942.61; viewport=1920x1080; enabled; text=LOCK MY GUESSES |
| 1920x1080 | playerTwo/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/guess-nationality-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=130.16x50; left=989.84; top=892.66; bottom=942.66; visibleWithinViewportAndAncestors=130.16x50; options=1; scrollHeight=45; clientHeight=45 |
| 1920x1080 | playerTwo/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=1214.33; right=1396.38; top=896.69; bottom=942.61; viewport=1920x1080; enabled; text=LOCK MY GUESSES |
| 1920x1080 | playerTwo/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 1920x1080 | playerTwo/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=1209.16; right=1396.38; top=904.73; bottom=948.36; viewport=1920x1080; enabled; text=LOCK MY SIGNINGS |
| 1920x1080 | playerTwo/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/signing-league-listbox | Open listbox visibility | #tw-p2Signing1League-listbox | FULL; box=125.95x165.88; left=1159.34; top=809.44; bottom=975.31; visibleWithinViewportAndAncestors=125.95x165.88; options=3; scrollHeight=161; clientHeight=161 |
| 1920x1080 | playerTwo/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=1209.16; right=1396.38; top=905.73; bottom=949.36; viewport=1920x1080; enabled; text=LOCK MY SIGNINGS |
| 1920x1080 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #p2Signing2League; intersection=123.95x40.64 |
| 1920x1080 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #p2Signing3League; intersection=123.95x43.28 |
| 1920x1080 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #completeTransferChallenge; intersection=75.14x10.64 |
| 1920x1080 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=75.14x32.98 |
| 1920x1080 | playerTwo/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/signing-nationality-listbox | Open listbox visibility | #tw-p2Signing1Nationality-listbox | FULL; box=105.33x50; left=1291.03; top=809.44; bottom=859.44; visibleWithinViewportAndAncestors=105.33x50; options=1; scrollHeight=45; clientHeight=45 |
| 1920x1080 | playerTwo/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=1209.16; right=1396.38; top=905.73; bottom=949.36; viewport=1920x1080; enabled; text=LOCK MY SIGNINGS |
| 1920x1080 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #p2Signing2Nationality; intersection=103.33x40.64 |
| 1920x1080 | playerTwo/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=1920, clientWidth=1920; overflowX=visible/hidden |
| 1920x1080 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 1920x1080 | playerTwo/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 1920x1080 | playerTwo/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 1920x1080 | playerTwo/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 2560x1080 | playerOne/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=159; clientWidth=132; overflowX=visible; text=REPLAY |
| 2560x1080 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerOne/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerOne/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=709.72; right=1031.97; top=925.34; bottom=958.39; viewport=2560x1080; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 2560x1080 | playerOne/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=729.08; right=1044.22; top=896.97; bottom=930.02; viewport=2560x1080; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 2560x1080 | playerOne/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=713.16; right=1044.22; top=922.64; bottom=955.69; viewport=2560x1080; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 2560x1080 | playerOne/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 2560x1080 | playerOne/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=2014.91; right=2287.47; top=842.2; bottom=897.14; viewport=2560x1080; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 2560x1080 | playerOne/ready | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=138; clientWidth=110; overflowX=visible; text=00:00 |
| 2560x1080 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerOne/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerOne/ready | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/ready | Main action in first screenful | #startTransferTimer | YES; left=566.16; right=1031.97; top=896.16; bottom=957.39; viewport=2560x1080; enabled; text=START SHARED 15-MINUTE WINDOW |
| 2560x1080 | playerOne/window | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=138; clientWidth=110; overflowX=visible; text=14:52 |
| 2560x1080 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerOne/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerOne/window | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/window | Main action in first screenful | #endTransferTimer | YES; left=738.3; right=1031.97; top=896.16; bottom=957.39; viewport=2560x1080; enabled; text=REQUEST EARLY END |
| 2560x1080 | playerOne/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=138; clientWidth=110; overflowX=visible; text=14:51 |
| 2560x1080 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerOne/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerOne/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=675.02; right=1031.97; top=897.16; bottom=958.39; viewport=2560x1080; disabled; text=EARLY END REQUESTED ✓ |
| 2560x1080 | playerOne/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=801.5; right=1044.22; top=887.64; bottom=948.88; viewport=2560x1080; enabled; text=LOCK MY GUESSES |
| 2560x1080 | playerOne/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/guess-league-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=179.66x140; left=483.81; top=880.94; bottom=1020.94; visibleWithinViewportAndAncestors=179.66x140; options=3; scrollHeight=135; clientHeight=135 |
| 2560x1080 | playerOne/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=801.5; right=1044.22; top=887.64; bottom=948.88; viewport=2560x1080; enabled; text=LOCK MY GUESSES |
| 2560x1080 | playerOne/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/guess-nationality-listbox | Open listbox visibility | #tw-p2Guess1Value-listbox | FULL; box=179.66x50; left=483.81; top=880.94; bottom=930.94; visibleWithinViewportAndAncestors=179.66x50; options=1; scrollHeight=45; clientHeight=45 |
| 2560x1080 | playerOne/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=801.5; right=1044.22; top=887.64; bottom=948.88; viewport=2560x1080; enabled; text=LOCK MY GUESSES |
| 2560x1080 | playerOne/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 2560x1080 | playerOne/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=794.61; right=1044.22; top=909.08; bottom=967.25; viewport=2560x1080; enabled; text=LOCK MY SIGNINGS |
| 2560x1080 | playerOne/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/signing-league-listbox | Open listbox visibility | #tw-p1Signing1League-listbox | FULL; box=174.17x140; left=716.73; top=780.7; bottom=920.7; visibleWithinViewportAndAncestors=174.17x140; options=3; scrollHeight=135; clientHeight=135 |
| 2560x1080 | playerOne/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=794.61; right=1044.22; top=910.08; bottom=968.25; viewport=2560x1080; enabled; text=LOCK MY SIGNINGS |
| 2560x1080 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-0 | with #p1Signing2League; intersection=172.17x45 |
| 2560x1080 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #p1Signing2League; intersection=172.17x11.52 |
| 2560x1080 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-1 | with #p1Signing3League; intersection=172.17x28.14 |
| 2560x1080 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #p1Signing3League; intersection=172.17x30.03 |
| 2560x1080 | playerOne/signing-league-listbox | Enabled controls overlap | #tw-p1Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=95.3x9.63 |
| 2560x1080 | playerOne/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/signing-nationality-listbox | Open listbox visibility | #tw-p1Signing1Nationality-listbox | FULL; box=145.67x50; left=898.55; top=780.7; bottom=830.7; visibleWithinViewportAndAncestors=145.67x50; options=1; scrollHeight=45; clientHeight=45 |
| 2560x1080 | playerOne/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=794.61; right=1044.22; top=910.08; bottom=968.25; viewport=2560x1080; enabled; text=LOCK MY SIGNINGS |
| 2560x1080 | playerOne/signing-nationality-listbox | Enabled controls overlap | #tw-p1Signing1Nationality-listbox-option-0 | with #p1Signing2Nationality; intersection=143.67x45 |
| 2560x1080 | playerOne/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerOne/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=53; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=DANIEL |
| 2560x1080 | playerOne/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerOne/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerOne/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 2560x1080 | playerTwo/replay-window | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=159; clientWidth=132; overflowX=visible; text=REPLAY |
| 2560x1080 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerTwo/replay-window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerTwo/replay-window | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/replay-window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/replay-window | Main action in first screenful | #continueFromTransfers | YES; left=1527.31; right=1849.56; top=975.86; bottom=1008.91; viewport=2560x1080; enabled; text=CONTINUE REPLAY · WINDOW OPEN |
| 2560x1080 | playerTwo/replay-guesses | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/replay-guesses | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/replay-guesses | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/replay-guesses | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/replay-guesses | Main action in first screenful | #continueFromTransfers | YES; left=1546.67; right=1861.81; top=969.45; bottom=1002.5; viewport=2560x1080; enabled; text=CONTINUE REPLAY · GUESS ENTRY |
| 2560x1080 | playerTwo/replay-signings | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/replay-signings | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/replay-signings | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/replay-signings | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/replay-signings | Main action in first screenful | #continueFromTransfers | YES; left=1530.75; right=1861.81; top=984.42; bottom=1017.47; viewport=2560x1080; enabled; text=CONTINUE REPLAY · SIGNING ENTRY |
| 2560x1080 | playerTwo/completed-populated | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallengeResults > h3:nth-of-type(1) | scrollWidth=67; clientWidth=1; overflowX=visible; text=TRANSFER VERDICTS |
| 2560x1080 | playerTwo/completed-populated | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/completed-populated | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/completed-populated | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/completed-populated | Main action in first screenful | #continueFromTransfers | YES; left=2014.91; right=2287.47; top=842.2; bottom=897.14; viewport=2560x1080; enabled; text=CONTINUE TO SHARED SEASON RESULTS |
| 2560x1080 | playerTwo/ready | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/ready | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=138; clientWidth=110; overflowX=visible; text=00:00 |
| 2560x1080 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerTwo/ready | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerTwo/ready | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/ready | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/ready | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 2560x1080 | playerTwo/window | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/window | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=138; clientWidth=110; overflowX=visible; text=14:52 |
| 2560x1080 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerTwo/window | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerTwo/window | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/window | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/window | Main action in first screenful | #endTransferTimer | YES; left=1555.89; right=1849.56; top=946.67; bottom=1007.91; viewport=2560x1080; enabled; text=REQUEST EARLY END |
| 2560x1080 | playerTwo/early-end-requested | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferTimerDisplay | scrollWidth=138; clientWidth=110; overflowX=visible; text=14:50 |
| 2560x1080 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(2) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerTwo/early-end-requested | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1) > span:nth-of-type(4) | scrollWidth=3; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=· |
| 2560x1080 | playerTwo/early-end-requested | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/early-end-requested | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/early-end-requested | Main action in first screenful | #endTransferTimer | YES; left=1492.61; right=1849.56; top=947.67; bottom=1008.91; viewport=2560x1080; disabled; text=EARLY END REQUESTED ✓ |
| 2560x1080 | playerTwo/guesses-empty | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/guesses-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/guesses-empty | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/guesses-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/guesses-empty | Main action in first screenful | #completeTransferChallenge | YES; left=1619.09; right=1861.81; top=961.13; bottom=1022.36; viewport=2560x1080; enabled; text=LOCK MY GUESSES |
| 2560x1080 | playerTwo/guess-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/guess-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/guess-league-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | CLIPPED; box=173.53x140; left=1319.78; top=954.42; bottom=1094.42; visibleWithinViewportAndAncestors=173.53x125.58; options=3; scrollHeight=135; clientHeight=135 |
| 2560x1080 | playerTwo/guess-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/guess-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/guess-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=1619.09; right=1861.81; top=961.13; bottom=1022.36; viewport=2560x1080; enabled; text=LOCK MY GUESSES |
| 2560x1080 | playerTwo/guess-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/guess-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/guess-nationality-listbox | Open listbox visibility | #tw-p1Guess1Value-listbox | FULL; box=173.53x50; left=1319.78; top=954.42; bottom=1004.42; visibleWithinViewportAndAncestors=173.53x50; options=1; scrollHeight=45; clientHeight=45 |
| 2560x1080 | playerTwo/guess-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/guess-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/guess-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=1619.09; right=1861.81; top=961.13; bottom=1022.36; viewport=2560x1080; enabled; text=LOCK MY GUESSES |
| 2560x1080 | playerTwo/guesses-locked | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/guesses-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(12) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/guesses-locked | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/guesses-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/guesses-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |
| 2560x1080 | playerTwo/signings-empty | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/signings-empty | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/signings-empty | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/signings-empty | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/signings-empty | Main action in first screenful | #completeTransferChallenge | YES; left=1612.2; right=1861.81; top=971.86; bottom=1030.03; viewport=2560x1080; enabled; text=LOCK MY SIGNINGS |
| 2560x1080 | playerTwo/signing-league-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/signing-league-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/signing-league-listbox | Open listbox visibility | #tw-p2Signing1League-listbox | FULL; box=167.94x140; left=1545.78; top=843.48; bottom=983.48; visibleWithinViewportAndAncestors=167.94x140; options=3; scrollHeight=135; clientHeight=135 |
| 2560x1080 | playerTwo/signing-league-listbox | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/signing-league-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/signing-league-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=1612.2; right=1861.81; top=972.86; bottom=1031.03; viewport=2560x1080; enabled; text=LOCK MY SIGNINGS |
| 2560x1080 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-0 | with #p2Signing2League; intersection=165.94x45 |
| 2560x1080 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #p2Signing2League; intersection=165.94x11.52 |
| 2560x1080 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-1 | with #p2Signing3League; intersection=165.94x28.14 |
| 2560x1080 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #p2Signing3League; intersection=165.94x30.03 |
| 2560x1080 | playerTwo/signing-league-listbox | Enabled controls overlap | #tw-p2Signing1League-listbox-option-2 | with #completeTransferChallenge; intersection=100.52x9.63 |
| 2560x1080 | playerTwo/signing-nationality-listbox | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/signing-nationality-listbox | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/signing-nationality-listbox | Open listbox visibility | #tw-p2Signing1Nationality-listbox | FULL; box=140.44x50; left=1721.36; top=843.48; bottom=893.48; visibleWithinViewportAndAncestors=140.44x50; options=1; scrollHeight=45; clientHeight=45 |
| 2560x1080 | playerTwo/signing-nationality-listbox | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/signing-nationality-listbox | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/signing-nationality-listbox | Main action in first screenful | #completeTransferChallenge | YES; left=1612.2; right=1861.81; top=972.86; bottom=1031.03; viewport=2560x1080; enabled; text=LOCK MY SIGNINGS |
| 2560x1080 | playerTwo/signing-nationality-listbox | Enabled controls overlap | #tw-p2Signing1Nationality-listbox-option-0 | with #p2Signing2Nationality; intersection=138.44x45 |
| 2560x1080 | playerTwo/signings-locked | Horizontal scrollbar | html / body | NO; scrollWidth=2560, clientWidth=2560; overflowX=visible/hidden |
| 2560x1080 | playerTwo/signings-locked | Text scrollWidth > clientWidth | #transferChallenge > div:nth-of-type(11) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1) | scrollWidth=25; clientWidth=1; overflowX=hidden; intentional 1px assistive text; text=NIK |
| 2560x1080 | playerTwo/signings-locked | Elements wider than window | #transferChallenge * | NONE |
| 2560x1080 | playerTwo/signings-locked | Touch controls below 44 px | #transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option]) | N/A (desktop) |
| 2560x1080 | playerTwo/signings-locked | Main action in first screenful | #transferChallenge | N/A; no rendered main action in this waiting state (REFRESH is secondary) |

## Unreachable states and runtime limits

All scripted states were reached at all ten sizes for both roles.

Page errors: 0.

Total measured states: 300. Raw DOM records and screenshots: `/tmp/job1584-transfer-evidence` (generated, not committed).

## Verification

- Saved-script syntax and coverage checks passed: 300 unique measured states, 15 for each role at each requested window; all V10 mounts and screenshots present; zero unreachable scripted states and zero page errors.
- `node tests/contracts/v10-transfer-contracts.cjs` failed on the unchanged game at its WINDOW_OPEN 1440 px browser case: `endTransferTimer@1347` is outside that check’s viewport. Its first five checks passed. This existing check uses a different fixture from this report and is not claimed as passing.
- Only this report and `measure-transfer.cjs` are included in the change.
