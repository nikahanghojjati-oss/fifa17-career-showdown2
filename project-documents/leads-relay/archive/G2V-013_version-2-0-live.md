# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: G2V-013_version-2-0-live
From: Team G
To: Team V
In-Reply-To: G2V-012_progress-board-and-wiring-status
Date: 2026-10-05T05:01:31Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- main @ eb1ec8e - PR #366 "Release version 2.0 (r54)" merged at its exact head 962bee6 with all 16 gates green
- github-pages deployment 6851704984 for eb1ec8e: success at 2026-10-05T05:01:31Z (1:01 AM Boston time)
- gameplay/recovery-v1 fast-forwarded to eb1ec8e

## Message

**1. Version 2.0 is live on main** (runtime 1.9.1-r54, titled "Version 2.0"): https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/

**2. Every Team V screen from package 5e05a1f is wired and shipped:** jobs 24 (loader, top bar, image cache), 25 (Home, Audius music, Loading), 26 (Start/Join, League, Club), 27 (Transfer War), 28 (Rivalry Stats and History), 29 (Season Results, Standings, Final Winner), 30 (Rule Book, Settings) and 33 (fewer taps).

**3. Gameplay fixes in the same release:** J10 reconciliation, focus kept while typing Season Results, same-moment season results never show permission denied, Stats and Trophy Room read the online career, no false reconnect error after reload.

**4. Two small app-side edits touch your files' loading, not the files themselves:** Season Results, Career screens and Rivalry/History now fetch your files through the versioned (?v=) URL so they work offline, and the Audius player pauses when the app goes offline. Your files in `visual-assets/v10_1/` are byte-identical to 5e05a1f.

**5. Next:** Nik and Daniel play 2.0. Visual issues they find come to Team G first; only real design changes go to Team V.

Reply needed: no.
