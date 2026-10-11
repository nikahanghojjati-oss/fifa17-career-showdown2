# JOB-1494 · persistentNikDanielPair.js second half audit

Read: `js/persistentNikDanielPair.js` lines 162 to 323 (the second half of 323 lines).

## Finding 1 · PROBABLE · CHECK STATUS stays tappable while a Showdown close is running

- **File and line:** `js/persistentNikDanielPair.js` line 319 (the pending-code branch of `pairRender`, `refresh` button) and line 192 (`pairInitialize`, its success path sets `busy:false`).
- **What the player sees:** Daniel or Nik taps a button that closes a Showdown (DELETE OLD CONNECTION, or a close from the recovery panel), and while the close is still running they tap CHECK STATUS. CHECK STATUS is not disabled on the pending-code panel, so `pairInitialize` runs. Its success path clears `busy`, so the close loses its guard and the same close button can be tapped again, starting a second close.
- **Why the code does it:**
  ```
  refresh.addEventListener("click",()=>void pairInitialize({force:true}));
  ...
  return pairSetState({status:active?...,initialized:true,busy:false,...});
  ```
  The guard at line 192 only waits on `pairBusyAction`, and a close does not set it, so the refresh ignores the close's `busy` flag.
- **Smallest change:** set `refresh.disabled=state.busy` on that button and return early in its click handler when `state.busy` is true. Do the same for the other CHECK STATUS buttons on the pending panels. Optionally, make `pairAbandonCurrentShowdown` register a busy action so `pairInitialize` waits for it.
- **Confidence limit:** PROBABLE. Both closes converge on `already-closed` (line 148), so the damage is probably limited to a repeated close and a flickering message, not lost data.

## Finding 2 · PROBABLE · after a refresh, a legacy pending connection shows a raw code that Nik cannot join

- **File and line:** `js/persistentNikDanielPair.js` line 192 (`capability` in `pairInitialize`, the fallback `catch(_error){return link.rivalryId;}`), with the parser at line 203 (`pairParsePlayerJoinCode`) and line 204 (`pairProvisionJoinerBinding`).
- **What the player sees:** before a refresh, Daniel sees a `CMS17-pair_…` code, and Nik's join works. After a refresh on a pending link whose Showdown ID has no season marker (a legacy pairing), Daniel's panel shows the bare `pair_…` value. Nik pastes it and gets "Ask Daniel to create a new connection code", even though Daniel just sent that code.
- **Why the code does it:**
  ```
  capability:...?(()=>{try{return pairBuildPlayerJoinCode(link.rivalryId);}catch(_error){return link.rivalryId;}})():null
  ```
  `pairBuildPlayerJoinCode` throws for IDs without a season marker, and the fallback returns the bare ID. Nik's parser treats a bare ID as legacy (`totalRounds:null`), which fails at line 204.
- **Smallest change:** on that fallback, do not show a join code. Set `capability:null` and show the NEW CODE path (the `pairStartPairing` button already exists on that panel) so Daniel creates a seasonal code instead.
- **Confidence limit:** PROBABLE. It needs a legacy pending link, which is a pre-seasonal pairing, so this may be rare in practice.

## Riskiest places checked (no other real bug found)

1. Lines 215-216 (`pairJoinPairing` committed-join read-back): a lost reply is checked against the committed link, and the code only returns "paired" when the save and profile IDs match, so an unrelated link cannot be shown as joined.
2. Lines 258-266 (`pairDiscardStalePendingConnection`): the state is re-read after the confirm dialog and compared to the reviewed IDs before the close, so a stale confirmation cannot delete a different connection. Local shell deletion happens only after the close succeeds.
3. Lines 197-203 (season marker and pasted-code parsing): the capability marker maps 1, 3, 5 and a (10) both ways, and a pasted message with two different codes is rejected without echoing the input.

No game file was edited. This job adds one audit file only.
