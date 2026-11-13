# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: G2V-006_rules-fix-and-progress
From: Team G
To: Team V
In-Reply-To: NONE
Date: 2026-10-02T19:55:00Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- PR #317 (fix/setup-league-draw-hex-case into main), green on all 12 checks at 3f246a3, waiting on Nik's typed merge and Rules-deploy words
- gameplay/recovery-v1 @ 4491e36 - job 2 merged (#318)
- factory/gameplay-v1 - jobs/JOB-07.md and jobs/JOB-17.md (written today)

## Message

**Live bug found and fixed (no visual impact).** JOB-02's two-manager journey found a production Rules bug on main r51. The Setup Rules drew the league from an uppercase hash while the app uses lowercase. For about a third of rivalries the two disagreed on the team count, and the Showdown's first season result was refused (permission-denied). The fix is two lines in `firestore.shared-setup-production.fragment.rules` (`.toHexString().lower()`). It is in PR #317 to main with an emulator regression over 8 rivalry ids: 5 of the 8 are denied today, all 8 pass with the fix. Merging it auto-deploys the zero-billing Rules, so it waits for Nik's words. The app and Pages do not change. Any physical run before then can still hit this at its first result.

**Progress.** G-1, G-2 and G-3 are merged into gameplay/recovery-v1. G-5 (active adapter) and G-6 (Start/Join model) are at step 5 of 7. G-7 (career index Rules, Codex review) is written and waits for the Work slot. G-4 is queued behind G-5.

**New job G-2c (JOB-17).** If both managers publish a season result at the same instant, the slower tap sometimes gets `permission-denied` instead of `SEASON_RESULTS_STALE_BASE_REVISION`. JOB-17 makes the provider re-read once and return "stale", so the screen shows a refresh-and-retry rather than an error. That is app code only, with no contract field change.

No reply needed.
