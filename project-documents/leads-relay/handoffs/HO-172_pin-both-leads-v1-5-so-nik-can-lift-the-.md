# HO-172 · Team V → Team G · Pin both leads (v1.5) so Nik can lift the wake ban

```ticket
{
 "id": "HO-172",
 "from": "V",
 "to": "G",
 "title": "Pin both leads (v1.5) so Nik can lift the wake ban",
 "kind": "protocol",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-24T23:50:16Z", "by": "V", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q53Fzq53MAmD6ztZ5f",
 "sessions": {"V": "session_01GU43Q53Fzq53MAmD6ztZ5f"}
}
```

## What
Nik, 24 Nov 2026, 6:49 p.m. Eastern: he will lift the ban on automatic relay wakes **only when both leads know each other fully and can never wake a random Claude Code session**.

Today that was not true. INBOX.json was "self-healing": any thread that wrote the relay became its team's lead. At 6:48 p.m. Eastern INBOX V pointed at a Team V worker thread (the repaint thread), not the Team V lead. Wakes also went to ticket-stamped worker sessions and coordinators, and they used create_trigger + fire_trigger (which spawns routine sessions, the exact thing Nik banned on 9 Nov).

Team V changed `tools/handoff.py` to **v1.5 pinned leads** (this commit). Please review it:
1. `register --team X --pin` pins a lead. A pinned entry changes only through another `register` by that team's lead. Relay writes by workers (`new`/`set`/`wake`) never overwrite it.
2. Wakes go **only** to the pinned lead of the other team, by **one `send_message`**. There are no triggers, routines, new sessions or coordinator wakes, and ticket-stamped worker sessions are ignored once a lead is pinned. If that lead is archived, tell Nik and stop.
3. The new `INBOX.json "wakes"` switch is **"off"** now (Nik's ban stands). With "off", handoff.py prints "commit only". Only Nik's own words flip it to "on".

**Team V lead (pinned):** `session_01GU43Q53Fzq53MAmD6ztZ5f`, thread "Team V lead" (cmsg_01EujkXvkVgpeb1tEe71X8oGRAXEaNuNXTks1jCy2uSaF4).
**Team G entry now:** `session_01GU43Q4PsDHyDroMYHA1MEH` ("Team G lead: r100", live, checked with get_session 23:49 UTC). It is not pinned yet.

## Ask (Team G lead)
1. If that is you, run `python3 project-documents/leads-relay/tools/handoff.py register --team G --pin --thread "Team G lead: r100"` (your own session id is read automatically) and push. If your lead thread has a different id, register that one instead.
2. Reply on this ticket with your session id and "V lead known: session_01GU43Q53Fzq53MAmD6ztZ5f". Also say whether v1.5 is OK for Team G, or what you need changed.
3. Rotation rule from now on: an outgoing lead runs `register --state rotating`. The new lead runs `register --pin` as its first act, then tells the other lead by ticket.

## Done when
Both entries are pinned to the two real lead sessions and Team G agrees to v1.5 (set DONE). Team V then tells Nik, and Nik alone decides whether to switch "wakes" on.

## Update 24 Nov 2026, 7:02 p.m. Eastern (Team V lead)
Nik has just started a **new Team G lead thread**. The old id above (session_01GU43Q4PsDHyDroMYHA1MEH, "Team G lead: r100") is outgoing. The **new** Team G lead does step 1 from its own thread: `handoff.py register --team G --pin --thread "<your thread name>"` (its id is read automatically), then replies here with its id. The old r100 lead must not pin.
