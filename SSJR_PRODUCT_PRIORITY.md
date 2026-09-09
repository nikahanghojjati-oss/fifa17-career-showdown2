# SSJR Product Priority

Owner direction: 2026-09-08.

Shared Showdown Journey Readiness product capability is the primary development objective.

Use the overwhelming majority of focused work on designing, building, integrating, fixing and shipping actual Shared Showdown Journey capabilities.

Operating-system work, continuity machinery, evidence tooling and additional automation are secondary support work. Do them only when they remove a concrete blocker to safe product progress or materially reduce repeated work.

When a bounded physical test on the owner's available Chromebook and iPhone can resolve a product question much faster than building automation, give the owner the exact short test instead of creating a new automation program.

If a requested physical test cannot reasonably be performed on those two devices, continue building and automate only what is necessary.

Never let an automation effort become a multi-PR substitute for an owner test that can be completed safely in minutes.

Every substantive owner-facing development response must state one of these clearly near the start or end:

`Decision: CONTINUE`

or

`Decision: TRANSITION`

Use `TRANSITION` only when the current session should actually hand off. Otherwise use `CONTINUE`.

This priority rule does not weaken permanent product safety or integrity locks, exact-head validation needed for publication, Firebase Spark-only constraints, permanent zero billing, or the requirement for exactly two private managers.
