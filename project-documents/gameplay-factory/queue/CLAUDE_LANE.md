# Claude lane (Team G lead factory): what the mega factory does NOT give to GPT

Nik (2026-10-10 13:56 UTC): the mega factory shifts work to GPT chat and Codex, but anything they cannot do well (missing tools, or judgment they have shown they lack) stays with the Claude models in the Team G lead factory (Opus, Sonnet, Haiku). Items in this lane get no bare GPT number; the lead gives them a normal job (1001+) or does them directly.

## Rule: an item moves to the Claude lane when any of these is true
1. Its train comes back blocked (`<prefix>-blocked` branch / status file says what stopped it) or fails the Gate twice for a reason a GPT chat could not see (needs a browser run, a failing test output, or two-phone behavior).
2. A "Sol review" or the lead's check says the change needs a decision across several screens or a game-state rule, not styling.
3. An audit finding that needs a repro, a Rules change, or edits outside the adapter files (css/*V10.css, js/*V10.js).
4. The ticket says NEEDS TEAM V (frozen visual-assets): goes by relay ticket to Team V, not GPT.

## Standing rule (Nik, 2026-10-12 02:43 UTC): one failure and it goes to Claude
When GPT chat or Work mode fails a job once, or cannot do it (rendering, layout checks), the job moves to the Claude lane. Claude does it and Nik types nothing. There is no GPT second attempt: a train that fails the lead's browser check, or the Gate for a reason GPT cannot see, goes to Claude; so does a Work mode study that comes back blocked or unusable once. Jobs 1654, 1655 and 1656 moved this way and are run by the lead.

## New shape (Nik, 2026-10-12 03:19 UTC; superseded 03:23 by screen jobs 1695-1708): accuracy over volume
Per-size and stage 3 code items still waiting are retired (queue/RETIRED.json). Each screen's leftovers fold into one Claude-lane screen pass: all sizes plus the desktop mockup match, browser-verified, one PR per screen. Wiring of adopted studies (1633, 1634, 1646, 1659, 1660) and the polish wave (1637-1645) are Claude lane. Work mode keeps only the stage 4 and 5 picture studies. ChatGPT chat keeps only jobs a test can prove.

## Pilot first (held-back candidates, not moved yet)
These are the groups most likely to need judgment. The first train of each runs as normal; if it hits rule 1 or 2, the remaining items of that group move to the Claude lane.
- transfer (every transfer item: 9, 27, 45 and so on up to 351; 20 items): the transfer challenge and signing entry touch game state and the private transfer lock; the lead is already measuring it with Codex jobs 1583-1586.
- season-final (every season-final item: 11, 29, 47 and so on up to 518; 60 items, the biggest group): Season Results pulls the player back (Sol's S5 lead, job 1579), so part of this group is a logic bug, not styling.

## How the lead moves an item
Tell the Team G lead thread / Haiku G keeper which item numbers; I mark them `claude lane` in ORDER.json (not automatic yet) and the board's Type now list skips them. Nik is not asked to do anything and needs no new number. Anything the lead moves is reported in RUN_REPORT.md under "Claude lane".
