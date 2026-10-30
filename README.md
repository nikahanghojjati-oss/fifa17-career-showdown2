# Career Mode Showdown

A private two-manager FIFA Career Mode companion, built with HTML, CSS and JavaScript. Local saves and recovery remain available alongside optional private Connected Rivalry and Shared Showdown Journey features.

[Open the application](https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/).

## 🏆 Officially launched: SSJR 100/100 (2026-10-29)

On 2026-10-29 the game earned **Shared Showdown Journey Readiness 100/100** and launched as fully playable. Daniel (Chromebook, Wi-Fi) and Nik (iPhone, mobile data) played a real 3-season Shared Showdown on live production r85 (`1.9.9-r85`). It went from setup through every season, offline and back online, reload, and the closed Showdown confirmed after a reload. Both device exports passed the validator with zero issues, and Nik confirmed the run and accepted the build as stable. The run took 54 days from the first SSJR model (2026-09-05). Record: `SHARED_SHOWDOWN_JOURNEY_READINESS_SSJR2.json`, evidence in `acceptance/ssjr2-runs/2026-10-29/`, full story in `SSJR100_OFFICIAL_LAUNCH_2026-10-29.md`.

## Development

Start with 00_DEVELOPER_START_HERE.md and POS10_CURRENT_FILE_INDEX.json. POS10 is the sole process authority. The current index identifies the active recovery packet and exact next action. NEXT_TASK.md owns the current product dependency. Recorded release notes are historical; verify current source and live deployment when release authority matters.

The active acceptance milestone is Shared Showdown Journey. SHARED_SHOWDOWN_JOURNEY_READINESS.json measures accepted evidence; MILESTONE_DELIVERY_PROGRESS.json measures the engineering lifecycle. Process work earns neither score.

Run npm run test:contracts for deterministic product validation and npm run test:ops for operations validation. POS10_IMPACT_GRAPH.json selects exact affected invariants, transitive consumers and heavy proofs; unknown executable risk requires the full seal. See PROJECT_OPERATING_SYSTEM_POS10.md for recovery, publication and current commands.

## Permanent product boundaries

Exactly two private managers; pairing and exact ACTIVE before league/club selection. Same league, distinct permanent clubs and 1/3/5/10 season plans. Candidate C alone may destructively Apply remote state to local gameplay, with transaction-owned exact rollback. Billing permanently OFF, Firebase Spark only. CURRENT_PRODUCT_GUARDS.json owns all preserved infrastructure, privacy and data locks.
