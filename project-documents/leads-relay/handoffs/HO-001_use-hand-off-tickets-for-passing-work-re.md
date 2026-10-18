# HO-001 · Team G → Team V · Use hand-off tickets for passing work (relay v1.1)

```ticket
{
 "id": "HO-001",
 "from": "G",
 "to": "V",
 "title": "Use hand-off tickets for passing work (relay v1.1)",
 "kind": "protocol",
 "priority": "normal",
 "worker": "opus",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [{"name": "Acknowledge (RECEIVED)", "done": true}, {"name": "Show hand-offs on Team V's board (optional)", "done": true}, {"name": "Mark DONE with evidence", "done": true}],
 "evidence": ["factory/v1-wtt5ye @ db382a2 - Team V BOARD.md shows a Hand-offs to Team V table read from handoffs/*.md"],
 "log": [{"at": "2026-10-05T12:51:48Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-05T15:46:05Z", "by": "V", "status": "RECEIVED", "note": "read; Team V adopts hand-off tickets"}, {"at": "2026-10-05T15:47:52Z", "by": "V", "status": "DONE", "note": "tickets shown on Team V board"}]
}
```

## What
Start using hand-off tickets (CONTRACT.md §8, relay v1.1) for any work one factory passes to the other. This ticket is the first one and doubles as the end-to-end test: Nik watches it move Sent → Delivered → Received → In progress → Done on Team G's board.

## Why
Nik (2026-10-05): work for Team V must reach it automatically, in full, in a cheap compact reliable format, and he must see each transfer and its progress. Messages alone could not show "received" or "in progress".

## Where
- Branch `leads/relay`: `project-documents/leads-relay/CONTRACT.md` §8, `handoffs/`, `tools/handoff.py` (writes and updates tickets), `tools/relay_ping.py` (the Action that posts each new ticket in full on PR #312 and announces every status change).
- Team G's views (read-only for you): `factory/gameplay-v1` → `project-documents/gameplay-factory/RELAY.md` (every message in full plus every ticket's pipeline), `BOARD.md` and `CUSTOM_VIEW.html`.
- Nothing changes for normal V2G/G2V messages, the progress block format or your V- PR titles.

## Steps for Team V
1. On this wake, acknowledge: `python3 project-documents/leads-relay/tools/handoff.py set HO-001 RECEIVED --by V --note "read"`, commit, push leads/relay.
2. Add a "Hand-offs" line to your own board that reads `handoffs/*.md` headers (optional, your board, your look).
3. Finish: `handoff.py set HO-001 DONE --by V --evidence "<your branch> @ <sha> - tickets shown on Team V board"` (or evidence "leads/relay @ <sha> - acknowledged" if you skip step 2), commit, push.

## Done when
HO-001 shows Done on Team G's board and RELAY.md. If anything in §8 does not fit how Team V works, return it with `RETURNED --note "<why>"` instead; Team G will adjust.
