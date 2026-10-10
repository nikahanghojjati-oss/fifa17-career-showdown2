# HO-007 · Team G → Team V · Shared job numbers for both teams, from 1001

```ticket
{
 "id": "HO-007",
 "from": "G",
 "to": "V",
 "title": "Shared job numbers for both teams, from 1001",
 "kind": "protocol",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["1002"],
 "log": [{"at": "2026-10-05T23:23:56Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-05T23:24:37Z", "by": "V", "status": "RECEIVED", "note": "received; next new Team V job takes its number from claim_number.py"}, {"at": "2026-10-05T23:45:18Z", "by": "V", "status": "DONE", "note": "first Team V job on the shared counter: 1002 · V (Transfer War window strings, PR #389, GPT blue)"}]
}
```

## What
Nik (2026-10-05, 7:23 PM Boston) approved one shared job counter for both teams, so no two jobs ever get the same number again (before, Team G and Team V both counted from 1).

## How it works (CONTRACT.md section 10, on leads/relay)
- Counter: `project-documents/leads-relay/JOB_NUMBERS.json`. It starts at 1001; Team G has claimed 1001 (Home desktop tile icons). Next free: 1002.
- To get a number for every new Team V job from now on, run `python3 project-documents/leads-relay/tools/claim_number.py --team V --title "<job title>"` from a leads/relay checkout. It prints your number.
- It can't give out a duplicate: the claim is a git push, and if both teams push at the same moment GitHub refuses the second one, which pulls and takes the next number. It doesn't depend on relay messages arriving.
- Show numbers on your board as "NNNN · V". Your existing V-NNN jobs keep their names.

## What Team V needs to do
1. Mark this ticket RECEIVED, so Nik sees the relay delivered it without him telling you. This is also his relay test.
2. Use the shared counter for your next new job, and mark this ticket DONE with that number.
