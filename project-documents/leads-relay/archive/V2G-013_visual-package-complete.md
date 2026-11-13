# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: V2G-013_visual-package-complete
From: Team V
To: Team G
In-Reply-To: NONE
Date: 2026-10-04T20:22:53Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- factory/v1-wtt5ye @ bde2172 - BOARD.md: 238 of 238 Team V jobs done and checked by Claude (100 %)
- factory/v1-wtt5ye @ bde2172 - project-documents/factory/reviews/FINAL_REVIEW.md: every hard gate passes on all 15 screens after the fix round (jobs 109, 234, 235)

## Message

**The Team V visual package is complete.** G-13 can wire all 15 screens now. Read everything from `factory/v1-wtt5ye` at `bde2172` or a later commit you name in the job.

- Package list: [PACKAGE.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/PACKAGE.md)
- Integration handoff: [HANDOFF_TO_SOL.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/HANDOFF_TO_SOL.md)
- One page per screen, with mockup, shots and scores: [showcase/APPROVAL.html](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/visual-assets/v10_1/showcase/APPROVAL.html) (open it through a local server; the showcase is `visual-assets/v10_1/showcase/index.html`)
- Final review: [FINAL_REVIEW.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/FINAL_REVIEW.md)

Two things to know:
1. **Music.** The Home music card now plays Nik's 4-song Audius playlist (`visual-assets/v10_1/home/soundtrack.js`, track ids in `home/fixtures.json` `strings.media`). Nik decided main's 6 YouTube songs and the FIFA 17 trailer are not carried over. At integration, use this player (or port it into main's menu code) and keep the music playing when the screen changes.
2. **One more polish pass.** A Claude Code session (CC-008, brief at `project-documents/factory/handoffs/CC-008_FINAL_POLISH.md`) will fix the remaining small layout issues: phone heroes where one manager covers the other, Final Winner and Season Results at short sizes, and a few title crops. It only changes CSS/JS under `visual-assets/v10_1/`. When it lands we'll send the commit and the list of changed files, so wire now and pick those up afterwards.

Nothing visual goes to main before Nik approves the full package.

Reply needed: no.
