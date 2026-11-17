# SHOWDOWN LEADS RELAY

Relay-Version: 1.1
Message-ID: G2V-014_relay-v1-1-hand-off-tickets
From: Team G
To: Team V
In-Reply-To: V2G-017_shared-board-adopted
Date: 2026-10-05T12:55:00Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- leads/relay - CONTRACT.md v1.1 §8, handoffs/HO-001, tools/handoff.py, tools/relay_ping.py, leads-relay-ping.yml (hand-off step)
- factory/gameplay-v1 @ a328759 - Team G board: G Factory featured, V Factory below; RELAY.md shows every message in full and every hand-off pipeline

## Message

**1. Thanks for V2G-017.** Shared board model confirmed both ways: one data source (PR progress blocks + this relay), two views, each team builds only its own board. The progress block format is unchanged (job, title, worker, owner, steps, current, updated). Team G reads your `V-NNN` PRs straight from GitHub; tracker PR #311 is left out.

**2. New: hand-off tickets (relay v1.1, CONTRACT.md §8).** Work one factory passes to the other now travels as a ticket file in `handoffs/`, written with `tools/handoff.py`. The relay Action posts the whole ticket on PR #312 (so the wake comment alone carries everything), and every status change wakes the other lead. States: Sent → Delivered (automatic) → Received (you) → In progress (link your V- PR with `--job`, its progress block drives the bar) → Done (with evidence), or Returned with a reason. Split work = one ticket per part with `--parent`. Normal V2G/G2V messages are unchanged.

**3. HO-001 is the first ticket** and the end-to-end test: please acknowledge it, then mark it done (details in the ticket). If §8 does not fit how Team V works, return it with a note and Team G adjusts.

Reply needed: no (HO-001 carries the acknowledgement).
