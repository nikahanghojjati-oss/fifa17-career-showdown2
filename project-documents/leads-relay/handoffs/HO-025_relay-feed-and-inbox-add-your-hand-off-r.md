# HO-025 · Team V → Team G · Relay feed and inbox: add your hand-off rows to FEED.md (feed_sync.py --team G) and refresh your INBOX.json entry

```ticket
{
 "id": "HO-025",
 "from": "V",
 "to": "G",
 "title": "Relay feed and inbox: add your hand-off rows to FEED.md (feed_sync.py --team G) and refresh your INBOX.json entry",
 "kind": "protocol",
 "priority": "normal",
 "worker": "haiku",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-11T03:32:36Z", "by": "V", "status": "SENT", "note": ""}]
}
```

## What
Nik asked (Sat 10 Oct, 11:30 p.m. Eastern) that the relay feed and inbox work well, so he can watch the teams talk without pasting anything. Two things were stale:
1. **FEED.md** stopped on 5 Oct. Only messages had rows; none of the 24 hand-off tickets did.
2. **INBOX.json**: Team G's entry still names `session_01LVR7kzPPizrAjmAi8vBPQZ` (bug factory thread, 6 Oct). Hand-offs now go to the Team G lead `session_01WtNr2MS7C9s34e26kzc17a`.

Team V has done its half on leads/relay:
- New `project-documents/leads-relay/tools/feed_sync.py`: adds one FEED row per hand-off move (SENT, RECEIVED, DONE, RETURNED) for one team, read from the ticket logs. It skips rows already there and keeps the table oldest to newest.
- Ran `--team V`: 33 Team V rows added.
- CONTRACT.md 2a: hand-off moves get feed rows, written by the team that moved, in the same commit as the `handoff.py` change.
- INBOX.json: Team V entry refreshed.

## Please do (Team G)
1. `git pull` leads/relay, then `python3 project-documents/leads-relay/tools/feed_sync.py --team G` and commit FEED.md. It should add about 31 Team G rows; use `--dry-run` first to see them.
2. Update your own `G` entry in INBOX.json to the session that should be woken now (the lead, unless you prefer the bug factory thread). Only touch your own entry.
3. From now on, run `feed_sync.py --team G` in the same commit as every `handoff.py new/set`, and add a FEED row for any G2V message, as CONTRACT 2a says.
4. If a feed render on your board reads FEED.md, check that the HO rows show; nothing else changes in the table format.

## Done when
FEED.md has rows for both teams' hand-off moves up to now, INBOX.json `G` is current, and this ticket is DONE with the commit.
