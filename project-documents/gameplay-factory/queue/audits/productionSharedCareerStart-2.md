# Audit: js/productionSharedCareerStart.js, second half (lines 81-160)

Job 1522 · Queue item 0112 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Finding 1 · PROBABLE · lines 127-131 and 139-144 · a stalled first load leaves CONTINUE TO CAREER START stuck on "OPENING"

What the player sees: the player taps CONTINUE TO CAREER START. If the Career Start scripts or the account services never settle (a stalled network request, not a rejection), the button stays disabled with OPENING CAREER START… until the page is reloaded. Nothing ends the attempt, and the error path (`.catch`) never runs.

Why: an overlapping open returns the same pending promise, and nothing bounds it:
```
function pcstOpenPanel(){
    if(openPromise)return openPromise;
    const run=Promise.resolve().then(pcstOpenPanelNow);openPromise=run;
```
`pcstDecorateControl` keeps the button disabled while `openPromise` is set (line 142-144), so a pending promise that never settles keeps it disabled.
Smallest change: bound the open with a timeout (for example 25 s, using the same `Promise.race` pattern as `psscWithTimeout` in productionSharedSeasonCommit-1.md). On timeout, clear `openPromise` and report, so the next tap starts a new attempt. The timeout error should go through `pcstReport`, with no change to the visible text.

## Riskiest places checked (no other finding)

- Lines 59-67 and 92-93: the synchronous `busy` guard before the first await in `pcstAcknowledge` and `pcstOpenTransferChallenge`, so a double tap runs once.
- Lines 115-118: `setup.clubs[role]` and the rival row use the confirmed setup, which always has clubs by the time the panel renders. The panel shows the placeholder text when the setup is missing (line 115).
- Lines 141 and 151: the capture handler passes the click through when the setup is not confirmed, so the original control still works for unconfirmed setups.
- Lines 139-149 with the MutationObserver (line 157): the observer watches `disabled` and `class`, and `pcstDecorateControl` only writes when a value changes, so the observer does not loop.
