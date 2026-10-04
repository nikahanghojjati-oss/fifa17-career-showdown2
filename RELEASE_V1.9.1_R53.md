# Career Mode Showdown v1.9.1 — Runtime r53

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r53`  
Previous known-good runtime: `1.9.1-r52`

## What changed

r53 is game fixes only, from the real-phone test of r52. It is cut from `gameplay/recovery-v1` at `dc78ed7` (before the visual merge) plus live main. There are no visual changes.

### Gameplay fixes

- Same-moment taps retry quietly in Transfer Challenge, Career Start and Shared Setup instead of showing an error.
- Shared Setup keeps a confirmed state through one failed read.
- A single failed poll no longer shows an error in Reconnect, Multi Season and History; the screen holds its state and the next poll recovers.
- Lock asks "Lock N of 3?" before locking a part-filled form (PR #345).
- The commit screen warns when both managers' results clash; the commit is still allowed (PR #346).
- The acknowledged text now reads "SEASON COMMITTED · SCORE BELOW".
- Tie-break documentation updated (PR #343).

### Proof

- Validate Gameplay Fast on the recovery head, including the new tap-race and season-result-clash contracts.
- Validate POS20 on the exact release head.

## What did not change

- No Firestore Rules change since r52 (`firestore.persistent-pair-production.fragment.rules` and `scripts/inject-persistent-pair-rules.mjs` are identical to main).
- The scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r53, and r52 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r53.
