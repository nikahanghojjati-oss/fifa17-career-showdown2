# HO-023 · Team V → Team G · Five fixes to the 126 study tickets before Nik types them (missing art folders, mockup path, phone size, product rules, 4 already-decided studies)

```ticket
{
 "id": "HO-023",
 "from": "V",
 "to": "G",
 "title": "Five fixes to the 126 study tickets before Nik types them (missing art folders, mockup path, phone size, product rules, 4 already-decided studies)",
 "kind": "protocol",
 "priority": "top",
 "worker": "",
 "parent": "HO-022",
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-10T15:30:21Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-10T15:30:54Z", "by": "G", "status": "RECEIVED", "note": "Team G lead: forwarded to the mega factory, which owns the study tickets (items 226-476); it will apply the five fixes before Nik types them"}]
}
```

## From the Team V lead: five fixes to the 126 study tickets before Nik types them

I checked every study ticket (queue items 226 to 476, stages 4 and 5) against `study/mega-queue` at fe1eef9a. None has run yet: all 251 items in that range were `waiting` in QUEUE_STATE.json at 15:24 UTC. Fixing the tickets now saves Nik from typing studies that come back unusable. You own the ticket files; please regenerate them with these changes.

### 1. 36 tickets point to an artwork folder that does not exist (must fix)
Every stage 4 and 5 ticket for these four screens links `visual-assets/v10_1/<screen>/assets/`, which is missing on `study/mega-queue`:
- **Transfer challenge and Signing Entry** (`transfer/assets/`, 9 tickets): the real art is `visual-assets/v10_1/tr2/slice-02-plate/assets/`.
- **Rule Book, Settings, Standings** (`rule-book/assets/`, `settings/assets/`, `standings/assets/`, 27 tickets): these screens have no art folder. Point them to `visual-assets/v10_1/shared/` (wordmarks, plates, trophies, navbar, fonts, art/home-tiles).

### 2. The desktop mockups are not on the study branch
The tickets say "the screen's desktop mockup in this ChatGPT project's files". The real reference set is in the repo at `project-documents/factory/mockups/` on `factory/v1-wtt5ye` (GOAL_HOME, GOAL_LEAGUE, GOAL_CLUB, GOAL_TRANSFER_PLATE_G, MOCKUP_CAREER_STATISTICS, MOCKUP_LEGACY_V2, MOCKUP_RIVALRY_STATISTICS, MOCKUP_SEASON_RESULTS, MOCKUP_START_JOIN, MOCKUP_TROPHY_ROOM). Name that path and file in each ticket. Final Winner, Rule Book, Settings and Standings have no mockup, so for those the live screen is the reference.

### 3. The phone size is incomplete
"390x844 upright phone" is the device, not the space. In Safari the visible area is about **393x660**. Each phone study must fit with **no scroll at 393x660 and 360x640**, with the main button visible at **375x553**. The bottom tab bar (HOME, CAREER, STANDINGS, STATS, RULES) shows at 900px wide or less, on hub screens only.

### 4. Product rules the tickets leave out
Add these lines to every study ticket:
- Daniel is always on the LEFT and Nik on the RIGHT. Never mirror them.
- No player photos (the only exception is the Reus photo on Loading). No real club crests, league logos or trophies; use our own art only.
- Home tiles: the big art fills the right side of each tile, centred and fully inside, never small or clipped in a corner.

### 5. Four studies are already decided
Team V already designed and checked these in HO-021 (jobs 1035 and 1036, waiting for your port to main):
- items **316** (Home, sideways phone) and **334** (Transfer, sideways phone): job 1035.
- items **344** (Home, upright tablet) and **362** (Transfer, upright tablet): job 1036.

Please drop these four, or change each one to "start from the 1035 or 1036 design" so they don't redo it. Evidence: `visual-assets/v10_1/tr2/evidence/1035/`, `.../1036/` and `visual-assets/v10_1/home/evidence/1036/` on `factory/v1-wtt5ye`.

### Connection check
Team V's INBOX entry points to this session (session_013pn5j1NjipzmcDNVpF7Fd3), and HO-022 reached me about a minute after you sent it. Reply on this ticket with the regenerated item range when it's done. I'll judge each study as its draft PR opens and log it in `queue/V_ADOPTION.md`.
