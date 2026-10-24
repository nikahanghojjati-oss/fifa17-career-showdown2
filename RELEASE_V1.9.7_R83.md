# Career Mode Showdown — r83: bug fixes, draws without tiebreaks, real-only play (v1.9.7 runtime r83)

Application version: `v1.9.7`  
Runtime asset revision: `1.9.7-r83`  
Previous known-good runtime: `1.9.6-r82`

r83 is a bug-fix release on top of r82. The application version moves to 1.9.7 and the runtime revision to r83.

## What changed

- No tiebreak anywhere: an equal season score is a season DRAW, an equal Showdown total is a DRAW, and equal career points
  stay level. League position never decides anything (code, Rule Book and screens).
- Career totals count finished Showdowns only; a live Showdown adds nothing to completed-career totals.
- Test mode is removed: START TEST RUN, JOIN TEST RUN, the TEST RUN label and FORGET THIS DEVICE are gone. Every new
  Showdown is real. Old stored games stay hidden behind the career start marker; r79-onward real games stay visible.
- Fifteen fixes from the Codex audits, among them: waiting resumes after a long sleep; a hidden Transfer Window stops
  retrying its expiry; one failed read no longer hides a real game or opens a second session; reloads during Results return
  to Results; pasted signing corrections survive reload; a failed CONTINUE keeps the live Home tile; slow reloads show
  CHECKING… instead of START; Final Winner history retries after reconnecting; replacement-session saves clear the other
  page; the Home JOIN window is 29 minutes and turns into CHECK STATUS when it ends; session expiry keeps paired players
  paired; an interrupted first pairing can be restored; cold career visits load seasons in parallel and keep them.
- Double-load on startup fixed.
- Gallery fixes: desktop Season Results shows the shared score and result, phone Trophy Room BACK shows its label.

## Update safety

- The shell and service worker advance to r83 in a fresh `career-mode-showdown-shell-1.9.7-r83` cache, and r82 is retained
  for rollback.

## What did not change

- The scoring formula and Remote Joining protocol stay as they were. No stored document shape changes.
- The no-flash rules, the Reus Gate, preload and decode are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Firestore Rules

- No Rules change.

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r83.
