# screens.js audit, second half (lines 407-813)

no findings

Riskiest places checked:
1. Lines 541-584 (`navigateBackSmart`): one `navigationBusy` flag guards back navigation, and the Continue and Start buttons also check it (lines 644 and 725). A second tap while a navigation runs does nothing, and the flag is cleared in `finally`.
2. Lines 643-706 (`resumeSavedShowdown`): the saved route is chosen from the canonical route. Transfer and club routes go to their own openers and return early. Any other failure reports the error and falls back to the main menu.
3. Lines 753-765 (back delegation): one capture-phase listener handles every enabled `.backButton` click and stops the event, so screen-specific back handlers never run for these buttons. Buttons with `dangerButton` are excluded. This looked correct.
