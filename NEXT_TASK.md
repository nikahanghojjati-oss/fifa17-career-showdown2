# CURRENT TASK — PUBLISH ACCEPTED RJR100 THEN GENERATE SNS

Current environment: `we-2026-09-05-pr196-publication-physical-acceptance-e9072`
Starting independently verified live main: `2302e8daba6c9417954bc610f537aba41c4d3d87`

Production is independently proven `v1.9.1 / 1.9.1-r2`; previous known-good whole-shell recovery target is `1.9.1-r1`. Fixed `RJR-1` is complete at `100/100` with domain vector `20/20`, `20/20`, `20/20`, `30/30`, `10/10`. The physical Chromebook/Home WiFi + iPhone/cellular Remote Joining acceptance and final stable release acceptance are consumed evidence. Do not repeat or re-credit them.

PR #198, `Publish final fixed RJR-1 100/100 acceptance`, is evidence/continuity publication only. It changes no runtime, Rules, Firebase provider state, IAM or billing and earns zero RJR credit.

Work Environment Continuity remains mandatory. Reassess only this environment's own live status; do not inherit the predecessor's transition decision.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Fetch live PR #198 and require every applicable permanent workflow family green on one unchanged final head.
2. Review the exact final diff. Reject any runtime/provider/Rules/billing mutation or historical provenance rewrite.
3. Merge only with expected-head protection.
4. Fetch the resulting live `main` and require the complete permanent main-push publication set green. Production must remain `v1.9.1 / 1.9.1-r2` and Firebase Spark with billing permanently off.
5. Reassess this WEC. If and only if publication is clean and there is no unresolved failure, set `Handoff proximity: 100%`, generate the SNS/SLE successor package and stop before implementing another substantial milestone.
6. The SNS must route the new session directly into codifying the owner's post-RJR100 end-to-end shared gameplay roadmap as a fixed numerical 0–100 program, provisionally `Shared Showdown Journey Readiness (SSJR-1)`, with milestones, evidence rules, anti-double-counting and a state-machine/process map.

The next major product goal is not more generic Remote Joining infrastructure. It is the complete supported remote Showdown journey: select both managers → private pair → exact Connected Rivalry → Host → Join → ACTIVE → authoritative shared setup → one authoritative League Wheel result → authoritative club assignments → authoritative season length → Showdown confirmation → both players run their matching FIFA 17 Career Modes locally → supported season results/scoring/history/progression synchronize → final season reconciles → Showdown closes terminally without resurrection.

League Wheel and club assignment should be designed to happen after both legitimate managers are attached to the exact Connected Rivalry and the Remote Joining session is ACTIVE, so the setup is committed once under shared authority instead of reconciling two independently randomized local setups.

Career Mode Showdown synchronizes the supported competitive Showdown state; it does not stream, network or control the FIFA 17 match engine itself.

The Installable Offline App, v1.3.0 Recovery & Device Resilience baseline, Local Profiles / Save Library and all canonical local-first guarantees remain protected.

Permanent locks: Billing must never be activated. Firebase remains Spark. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Canonical localStorage is exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`. Candidate A remains non-mutating; Candidate B remains read-only; Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned strict exact raw-snapshot rollback. Exactly two private managers remain mandatory. No public discovery/listing/lobby/matchmaking/community/rankings/global leaderboards. Never durably retain raw private capabilities or raw account/device/rivalry/session authority IDs. Never destructively test the protected historical rivalry.
