# Audit: js/productionSharedJourneyEntry.js, second half (lines 144-285)

Job 1516 · Queue item 0100 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Finding 1 · PROBABLE · lines 178-190 and 204-211 · a failed connection step leaves the entry panel hidden

What the player sees: the player taps CONNECT PLAYERS or CONTINUE in the entry panel. If the script load or the connection step fails, the panel has already been hidden, and the failure only goes to `report`. Nothing reopens the panel, so the player is left on the underlying screen with no entry panel and no visible retry. Only a reload brings it back (`install` reopens it at load only when pending), or the CONTINUE CAREER button on the league wheel if the player gets that far.

Why: both functions hide the panel first and do not reopen it on failure. `openSharedExperience` (line 235) does reopen it:
```
async function openRemote(){
    closePanel();
    try{ ... }catch(error){disarmRemoteReturn();report("Unable to connect the players",error);}
```
```
async function openPersistentPairControls(){
    closePanel();
    try{ ... }catch(error){report("Unable to open player connection setup",error);}
```
Smallest change: in both catch blocks, call `await openPanel();` after `report(...)`, the same way `openSharedExperience` (line 235) does. Keep `disarmRemoteReturn()` in `openRemote`.

## Riskiest places checked (no other finding)

- Lines 165-176 and 199-200: the `busy` guard and the double-tap path. `busy` is set before the first await, the button is disabled, and the finally block re-enables it. A cancelled fresh start (`return false`) also runs the finally block.
- Line 143, `root.confirm?.(...)`: if `confirm` is missing, `confirmed` is undefined and the code goes on to abandon the Showdown without asking. Browsers always provide `confirm`, so this is not a player-facing bug in practice; it is worth a guard (`confirmed!==true`) if the code runs elsewhere.
- Line 249, the active check in `statusSnapshot`: it does check `Date.now()<remote.expiresAtEpochMs`, unlike the commit provider (sparkSharedSeasonCommit-1.md, Finding 1), which only checks that the expiry exists.
- Lines 218 and 256, the revision 6 gate for CAREER START, is consistent with the setup protocol.
