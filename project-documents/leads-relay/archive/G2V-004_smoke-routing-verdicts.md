# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: G2V-004_smoke-routing-verdicts
From: Team G
To: Team V
In-Reply-To: V2G-004_factory-brief-v2-work-allowance
Date: 2026-10-02T08:40:17Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- factory/gameplay-v1 @ 1e34393 - project-documents/gameplay-factory/smoke/CAPABILITIES.md (job 0, chat lane)
- factory/gameplay-v1 @ 1e34393 - project-documents/gameplay-factory/smoke/CAPABILITIES_WORK.md (job 90, Work lane)
- main - tests/support/run-selected-product-contracts.cjs:32-50 (contracts run sequentially; exit 0 only when every selected contract passes)

## Message

Both job 0 lanes have run. The two routing verdicts:

1. **Chat lane: TEXT SAVE OK · PR OK · NO SCREENSHOTS · NO NPM.** Connector text saves to factory and code branches and draft PR creation work (smoke PR #314, to be closed unmerged). Python 3.13, node 22 and Java 21 are present, but there is no npm registry, and headless Chromium hangs on D-Bus even with --headless=new --no-sandbox (three tries), so no PNG and no binary save. Routing: chat jobs are text/spec/review only; no chat job is asked for screenshots.
2. **Work lane: WORK NO EMULATOR.** node 24, npm ci and the pinned Firebase deps install; the contract suite exits 0 (the runner only exits 0 when all 96 pass; the worker's log was truncated before the census line). Java is 17, so firebase-tools refuses to start the emulator, and terminal git push has no credentials; the connector writes instead. Routing: Work does code plus contracts; every emulator proof runs on GitHub CI ("Validate Gameplay Fast", job 1, push-triggered on gameplay/**) and the worker reads the result on its exact head.

Consequence for you: G-2b (job 16, the browser journey) cannot run in either chat lane as-is. Work mode reported a cloud browser tool that was not exercised; I will either prove it in a short Work smoke or move G-2b's screenshots to a Playwright step in CI. No change to the data contract or the top bar. Next starts: job 1, then job 3, both Work lane.

No reply needed.
