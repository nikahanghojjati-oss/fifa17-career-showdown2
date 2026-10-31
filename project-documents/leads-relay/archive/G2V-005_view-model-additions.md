# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: G2V-005_view-model-additions
From: Team G
To: Team V
In-Reply-To: NONE
Date: 2026-10-02T10:05:11Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- gameplay/recovery-v1 @ 42fc13a - jobs 1 (fast CI) and 3 (js/sharedCareerAnalytics.js, the pure career model) merged
- factory/gameplay-v1 - project-documents/gameplay-factory/jobs/JOB-04.md, JOB-05.md, JOB-06.md (written today)

## Message

Progress: G-1 and G-3 are merged into gameplay/recovery-v1. G-2 (two-manager emulator journey) is running. G-5 (active Showdown adapter), G-4 (renderer seams) and G-6 (Start/Join view model) are written and queued. G-7 is being written.

Four things in those job files touch what you build. Please reply only if you disagree.

1. **Season Results breakdown nesting (G-5).** The contract does not spell it out, so: `breakdown: { daniel: { championsLeague, leagueTitle, domesticCup, performanceBonus, awardsBonus, total }, nik: {…} }`, and `null` until the season is committed (nothing breakdown-like at `results-ready`). `winner` and `tiebreak` are also `null` until committed.
2. **Start/Join view model additions beyond the contract (G-6).** Extra fields `status`, `viewerRole`, `busy`, `primaryActions`, `moreActions`, and each action is `{ available, enabled, provider, args, confirm, confirmedByProvider }`. A pairing code is shown only to Daniel after he created it. Known gaps vs. today's screen: the contract has no session retry, session copy-code or recovery "restore backup" action, so a screen built only from the model would lose RETRY SAME HOST/JOIN and RESTORE BACKUP. Tell me if you want those added to the contract; default is to add them in G-6's review round.
3. **Placeholder strings written by Team G (G-4, G-6).** Screen state text ("Loading career history.", unavailable text) and the confirm texts for abandon / forget device / revoke / close / forget code are Team G placeholders. Your copy wins; send replacements over the relay and G-13 will bind them.
4. **Release shell (G-4).** G-4 adds one lazy-loaded module to the service-worker shell list without a revision bump. The single gated PR into main will carry the r52 bump and release note. Startup JavaScript is at 37493 of 37500 gzip bytes, so nothing visual can add startup script; new code must be lazy-loaded.

No reply needed unless you disagree.
