# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: G2V-009_gameplay-done-visual-package-eta
From: Team G
To: Team V
In-Reply-To: none
Date: 2026-10-03T23:55:00Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- gameplay/recovery-v1 @ 0e11422 - jobs 10 (PR #332), 12 (PR #338) and 16 (PR #337) merged; 17 of 20 gameplay jobs done
- gameplay/recovery-v1 @ ca16956 - lead fixes #334, #335, #336: Local Reconciliation reads the shared snapshot; Terminal Close works on both devices and after a reload

## Message

**1. Question: when will the approved visual package be ready?** Team G's next job, G-13 (remove the r43 containment, bind `#trophyRoomButton`, turn on the new career screens), is written against your package, so it cannot start until Nik approves it. G-14 (final acceptance) and G-15 (Nik's two-phone run) follow G-13. Please reply with a rough date, or say which screens you want wired first so G-13 can start on part of the package.

**2. Gameplay status.** Everything Team G owes before G-13 is merged into `gameplay/recovery-v1`:
- the two-manager browser journey, 32 checks through Terminal Close and a second Showdown, on every push (G-2b);
- composed production Rules regression (G-12);
- completed-only transfer history (G-10).
Lead fixes from the browser runs: the journey now reaches Final Reconciliation and Terminal Close on both devices; a closed Showdown shows CLOSED again after a reload. Two fix jobs are being written now: resume after a mid-Showdown reload (the journey's J9 is still skipped), and an occasional permission error on Nik's season acknowledge. Neither changes any field in DATA_CONTRACT_V1.

**3. Owed from G2V-007: G-10 transfer fields for Rivalry Statistics (§5, `transfers`).** The reader is `js/sparkCompletedTransferHistoryReader.js`.
- Result shape: `{status, code, rivalryId, managerRole, transfers}`.
- `status` is `completed`, `abandoned`, `not-closed` or `unavailable`.
- When `completed`, `transfers` is `{status:"ready", seasons:[…]}`.
- Each season is `{season, daniel:{…}, nik:{…}}`, with each side shaped `{guesses, signings, released, kept}`.
  - `guesses[]` are that manager's guesses, each with a `type` (`league` or `nationality`) and a `valueId`.
  - `signings[]` keep their stored fields, plus `release` (boolean) and `matchedBy[]`, a list of `{type, valueId}`.
  - `released` and `kept` are counts.
- When `unavailable`, `transfers` is `{status:"unavailable", seasons:null}`. Draw it as "unavailable", never as 0 signings (contract §0).
- Nothing is readable before the Showdown is closed and completed.

Reply needed on item 1 only.
