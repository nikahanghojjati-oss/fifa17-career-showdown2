# HO-171 · Team V → Team G · Actions queue check (Nik): Physio loop fills the queue; Team V cancelled its 2 runs

```ticket
{
 "id": "HO-171",
 "from": "V",
 "to": "G",
 "title": "Actions queue check (Nik): Physio loop fills the queue; Team V cancelled its 2 runs",
 "kind": "check",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-24T20:55:48Z", "by": "V", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q53Fzq53MAmD6ztZ5f",
 "sessions": {"V": "session_01GU43Q53Fzq53MAmD6ztZ5f"}
}
```

## What
Nik, 24 Nov 2026 3:55 p.m. Eastern, asked each team to check the Actions queue of every repo it pushes to, because Team G's checks are starved (only 3-9 jobs running since ~18:40 UTC).

Team V pushes only to fifa17-career-showdown2. Snapshot at 20:56 UTC (3:56 p.m. Eastern): **3 runs in progress, 55 queued**.

**In progress (3), all Team G's Showdown Gate on PRs:** #1599 W4 remember sign-in (started 18:23 UTC), #1592 Phoenix W3 tap memory (17:33 UTC), #1607 HO-161 Platinum name (17:14 UTC). Each has been running for 2-4 hours.

**Queued (55):**
- **30 x "Showdown Gate Physio" (event workflow_run, branch main)**, queued 4 to 119 minutes ago, about one every 2-5 minutes, plus 1 workflow_dispatch Physio run. This looks like a self-feeding loop: every finished Gate run starts a Physio run, and the Physio runs pile up. This is the biggest item. Your PR "Physio: one queue for every run" (claude-gameplay/r100-physio-one-queue) seems to target exactly this. Until it lands, cancelling the queued Physio runs except the newest would free the queue.
- 19 x Showdown Gate on PRs. The oldest are 5-6 hours old: pos1m-ring3 (383 min), premium-clubhouse-ui, the "Throwaway: draft-PR proof (do not merge)" run (340 min, a clear cancel candidate), premium-pilot-rooms (now superseded by the desktop-rooms PR?) and main-suites. Then about 14 r100 Phoenix/B6/W8/W9 PRs and the two new B7/Duet Platinum room PRs.
- 1 x Ironman full matrix (push gameplay/r100, 207 min).
- 1 x Gameplay factory progress poller and 1 x Gameplay factory board auto-update (workflow_dispatch, factory/gameplay-v1).
- **Team V's own: 2 runs, both CANCELLED by Team V:** "Leads relay ping" (push leads/relay, HO-117 DONE, 60 min) and "Validate POS20" on PR #312 leads/relay (219 min).

**Team V does not cancel Team G runs.** Your call on the Physio pile, the throwaway proof run and any superseded PR gates.

**Note:** every Team V relay commit (handoff.py set DONE) starts one "Leads relay ping" run plus one "Validate POS20" run on PR #312. With about 70 premium tickets closing this week, that's up to about 140 small runs. If you want, disable those two on leads/relay until the freeze (relay wakes are off anyway). Say so here and Team V will do it, or do it yourselves.

## Done when
Team G has read this and chosen what to cancel (set DONE).
