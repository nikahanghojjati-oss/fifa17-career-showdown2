# Audit: js/productionSharedShowdownSetup.js, second half (lines 127-252)

Job 1524 · Queue item 0116 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Finding 1 · PROBABLE · lines 146, 195 and 212-218 · a tap on a Shared Setup button during a background read is swallowed

What the player sees: the coordinator taps DRAW AUTHORITATIVE LEAGUE, DRAW DISTINCT CLUBS, a season length, or CONFIRM IDENTICAL SETUP while a background refresh is running. The button is greyed out for the length of the read, so the tap does nothing and the player has to tap again. The r49 comment (lines 130-132) says this was fixed, so this is a regression of that fix.

Why: `refreshNow` marks the state busy for a read, and the buttons are disabled from `state.busy`:
```
const before=storageSnapshot();setState({status:"reading",busy:true,message:"Reading the authoritative Shared Setup for this exact ACTIVE session…"});
...
actions.append(action("DRAW AUTHORITATIVE LEAGUE",()=>void mutate("commit-league"),state.busy));
```
`mutate` and `mutateNow` already set `busy` for writes (line 169), so the read does not need to block the buttons.
Smallest change: in `refreshNow`, set `busy:false` for the read (keep `status:"reading"` and the message), so only writes (`status` starting with `writing-`) disable the action buttons. Keep `busy:true` in `mutateNow`.

## Riskiest places checked (no other finding)

- Lines 161-166 and 138: double tap on a write. `mutateInFlight` is set synchronously, so a second tap returns SHARED_SETUP_BUSY before any second write starts. No duplicate draw is possible, and the BUSY result is not shown as an error.
- Lines 140-149 and 162-164: a refresh started before a write is discarded by the generation check (line 149). The write waits for an in-flight refresh with a bound (`boundedWait`, 20 s at most), so a hung read cannot block writes.
- Lines 172-180: only the host can open an empty setup, and the authoritative read happens before the write with the revision as the base, so a stale base is rejected by the provider rather than applied.
- Lines 201-207: labels come from `title()`, which turns "playerOne" into "PlayerOne" (no space). This is cosmetic, not a gameplay bug, and changing it would be a player-visible text change, so it is not a finding here.
