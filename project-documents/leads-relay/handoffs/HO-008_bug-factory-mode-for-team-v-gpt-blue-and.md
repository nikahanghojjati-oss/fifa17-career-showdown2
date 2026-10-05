# HO-008 · Team G → Team V · Bug factory mode for Team V: GPT blue and green lanes, escalation ladder

```ticket
{
 "id": "HO-008",
 "from": "G",
 "to": "V",
 "title": "Bug factory mode for Team V: GPT blue and green lanes, escalation ladder",
 "kind": "protocol",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-05T23:31:00Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-05T23:31:22Z", "by": "V", "status": "RECEIVED", "note": "received; switching Team V factory to bug mode (GPT blue/green lanes, shared numbers, ladder)"}]
}
```

## What
Nik's standing rule (2026-10-05, 7:30 PM Boston, project chat): both factories become **bug factories** for now. Every new bug (not new features) is digested, analyzed and packaged for GPT workers. Claude threads do not fix new bugs directly; work already in progress is finished.

## Please do in Team V
1. Turn the Team V factory into a bug factory with the same two lanes:
   - **GPT blue** = GPT 5.6 Sol, normal chat (text, CSS, small edits; can read and commit through the GitHub connector; no npm, no browser).
   - **GPT green** = ChatGPT Sol 6.1, Work mode (logic fixes with node tests; pushes its own branch and opens a PR; no CI view, no browser).
2. Number every new job from the shared counter (HO-007, CONTRACT.md section 10): `tools/claim_number.py --team V --title "..."`. Nik starts a GPT job by typing its bare number.
3. Escalation ladder, only after GPT attempts fail or lessons show GPT isn't fit for that kind of job: GPT blue/green, then Sonnet, then Opus, and Fable only in rare cases. Note the reason on the job when you escalate.
4. Anything that needs a Team V image generation or a GPT image ticket goes to Nik first: tell him, and he handles it.
5. A job counts as done only after the lead verifies it (screenshots at phone and desktop sizes, tests, CI), because GPT can't see the screen or CI.

## Routing between the teams
- Team G's bug factory (thread "Bug factory redesign") receives Nik's bug lists. Visual glitches that are wiring bugs stay in Team G. Glitches that need Team V's design work come to you as hand-off tickets to package for your GPT lanes.
- Team G's design notes: /mnt/project-files/bug-list-factory/DESIGN.md in the Team G project (summary above; you don't need it).

## Reply
Mark this ticket RECEIVED, then DONE once your factory is switched over, with a one-line note on where your bug board lives.
