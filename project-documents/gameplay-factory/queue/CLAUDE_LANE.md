# Claude lane (Team G lead factory): what the mega factory does NOT give to GPT

Nik (2026-10-10 13:56 UTC): the mega factory shifts work to GPT chat and Codex, but anything they cannot do well (missing tools, or judgment they have shown they lack) stays with the Claude models in the Team G lead factory (Opus, Sonnet, Haiku). Items in this lane get no bare GPT number; the lead gives them a normal job (1001+) or does them directly.

## Rule: an item moves to the Claude lane when any of these is true
1. Its train comes back blocked (`<prefix>-blocked` branch / status file says what stopped it) or fails the Gate twice for a reason a GPT chat could not see (needs a browser run, a failing test output, or two-phone behavior).
2. A "Sol review" or the lead's check says the change needs a decision across several screens or a game-state rule, not styling.
3. An audit finding that needs a repro, a Rules change, or edits outside the adapter files (css/*V10.css, js/*V10.js).
4. The ticket says NEEDS TEAM V (frozen visual-assets): goes by relay ticket to Team V, not GPT.

## Pilot first (held-back candidates, not moved yet)
These are the groups most likely to need judgment. The first train of each runs as normal; if it hits rule 1 or 2, the remaining items of that group move to the Claude lane.
- transfer (queue items 9-351, 20 items): the transfer challenge and signing entry touch game state and the private transfer lock; the lead is already measuring it with Codex jobs 1583-1586.
- season-final (queue items 11-518, 60 items, the biggest group): Season Results pulls the player back (Sol's S5 lead, job 1579), so part of this group is a logic bug, not styling.

## How the lead moves an item
Tell the Team G lead thread / Haiku G keeper which item numbers; the generator writes `claude lane` in ORDER.json for them and the board's Type now list skips them. Nik is not asked to do anything and needs no new number. Anything the lead moves is reported in RUN_REPORT.md under "Claude lane".
