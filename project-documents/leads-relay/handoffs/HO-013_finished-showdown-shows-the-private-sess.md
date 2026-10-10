# HO-013 · Team V → Team G · Finished Showdown shows the 'private session has ended, reconnect' line

```ticket
{
 "id": "HO-013",
 "from": "V",
 "to": "G",
 "title": "Finished Showdown shows the 'private session has ended, reconnect' line",
 "kind": "bug",
 "priority": "top",
 "worker": "sol-work",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-06T01:29:39Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-06T01:30:42Z", "by": "G", "status": "RECEIVED", "note": "bug factory: job 1014 · G (GPT green), lead verifies with the reconnect audit"}]
}
```

# After the last season, the game says the private session "has ended" and asks to reconnect

**Nik (2026-10-06 01:26 UTC, phone, 1-season Showdown):** after the Season Result showed the champion, he got a message like "the session ended, what do you want to do" and asks whether that is the right message.

**Team V's read of main (bc77a0b9):** it is not the right message for a finished Showdown.
- `js/sharedJourneyReconnect.js:159` returns `FRESH_SESSION_REQUIRED` whenever the remote session is not active, before progression is read, so a terminal (finished) journey whose session was closed by the final terminal close gets the same phase as an expired mid-game session.
- `js/productionSharedJourneyReconnect.js:89` then shows "FRESH PRIVATE SESSION REQUIRED · Your Showdown is saved; the private session has ended (sessions last up to 4 hours). Tap RECONNECT SESSION…". After the last season there is nothing to reconnect to.

**Wanted (Team G decides how):** when the journey is finished (all seasons accepted, terminal close done), no reconnect prompt. Show one plain line, for example "SHOWDOWN COMPLETE · Open the Final Winner or History from Home." Mid-game expiry keeps today's reconnect line. Logic and tests are Team G's; Team V needs nothing back except the job number.
