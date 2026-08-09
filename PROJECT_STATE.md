# PROJECT STATE — Career Mode Showdown

## Purpose

This file is the continuation authority for the current implementation. It exists to prevent future development sessions from restarting planning, mistaking historical documentation for current code, or allowing bug-fix/build numbers to replace the original path to Version 1.0.

The project is already designed. Development should continue from the current source, preserve locked decisions, close remaining blueprint gaps, and finish the original Version 1.0 vision.

---

## Current implementation

**Application version:** v0.16.0 — Smart Navigation & Lightweight Runtime  
**Current release asset revision:** `0.16.0-r2`  
**Hosting:** GitHub Pages  
**Technology:** one-page HTML application, CSS, vanilla JavaScript, browser localStorage  
**Product mode:** two managers, one device, one browser, one active showdown  
**Current phase:** stabilization + original-roadmap re-alignment  
**Feature expansion:** frozen until the v0.16.0-r2 owner regression passes

`0.16.0-r2` is a cache/deployment revision of the existing v0.16.0 stabilization build. It is not a new gameplay milestone.

---

## Authority hierarchy

When sources conflict, use this order:

1. **Current source code on `main`** — what the application actually does now.
2. **Explicit owner amendments recorded in this current Project State** — later decisions that intentionally supersede older Bible text.
3. **This `PROJECT_STATE.md`.**
4. **`NEXT_TASK.md`.**
5. **Original Project Bible / architecture / release documentation.**
6. **Older conversations and historical implementation notes.**

Do not revert working current systems merely because an older design document names a different file, layout, screen placement, or superseded gameplay rule.

The original Project Bible remains the design blueprint where it has not been explicitly superseded.

---

# 1. Project mission

Career Mode Showdown is a football-game companion for two friends playing separate FIFA 17 Career Mode saves.

The application should turn those separate saves into one persistent rivalry by guiding the players through:

Main Menu  
→ Create Showdown  
→ League Selection  
→ Permanent Club Assignment  
→ Showdown Home  
→ Season Cycle  
→ Results / Scoring  
→ Next Season  
→ Final Winner  
→ Permanent History / Legacy

The product is not intended to feel like an administrative website. The original design philosophy is that it should feel like a natural football-game menu companion: quick, obvious, immersive, persistent, and visually coherent.

The Version 1.0 objective is still the original one: a complete local rivalry experience that can create, play, track, calculate, finish and preserve a showdown reliably.

---

# 2. Locked product scope

These decisions remain locked unless the owner explicitly changes them:

- Exactly two managers in Version 1.0.
- One device and one browser.
- One active showdown at a time.
- Each manager plays a separate FIFA 17 Career Mode save.
- Both managers use clubs from the same selected league.
- League is selected once per showdown.
- Two different clubs are assigned once per showdown.
- The club pairing is permanent for every season in that showdown.
- Club reuse across separate showdowns is allowed.
- Showdown length is 1, 3, 5 or 10 seasons.
- Top-five FIFA-17-era European league pool remains the current selection database.
- Results are entered manually from FIFA 17.
- No screenshots or match notes are required.
- Browser localStorage is the Version 1.0 persistence layer.
- No accounts, backend, cloud synchronization, QR pairing or real-time two-device mode in Version 1.0.

Deferred until after Version 1.0:

- online multiplayer
- two-device synchronization
- cloud saves
- accounts
- community features
- advanced public rankings

Those deferred ideas must not interrupt the Version 1.0 release path.

---

# 3. Locked gameplay amendments

Some gameplay decisions were finalized after the original Project Bible was written. These later owner-approved rules supersede conflicting historical Bible text.

## Scoring — FINAL CURRENT RULE

Per manager, per season:

- Champions League winner: **+5**
- Domestic league winner: **+3**
- Main domestic cup winner: **+1**
- 100 league points and/or 100 league goals: **+1 maximum for the pair**
- League Top Scorer and/or Top Assist: **+1 maximum for the pair**

**Maximum possible score: 11 points per manager per season.**

Do not restore the older four-independent-bonus interpretation or a maximum of 13.

## Season winner — FINAL CURRENT RULE

1. Higher season scoring total wins.
2. If the scoring totals are equal and non-zero, the season is a **draw**.
3. Only when both managers score 0:
   - better league finishing position wins;
   - if position is equal, more league points wins;
   - otherwise draw.

Do not introduce goal difference, league goals, head-to-head, or another tiebreak without owner approval.

## Transfer Challenge — OWNER-APPROVED ADDITION

Every season includes the current Transfer Challenge:

- 15-minute transfer window
- maximum three signings per manager
- opponent receives three guesses
- every guess is either **league** or **nationality**
- a correctly guessed signing must be released before the season begins

The Transfer Challenge is now part of the established season cycle and must be preserved.

## Match-play rule

Current Rule Book behavior remains:

- Career Mode matches are simulated except approved final exceptions.
- Champions League final may be played or simulated.
- Main domestic cup final may be played or simulated.

---

# 4. Current implemented experience

The following systems exist in current source and must be treated as implemented, not re-planned:

## Core flow

- Loading / application bootstrap
- Main Menu
- Create New Showdown
- manager names
- showdown name
- 1 / 3 / 5 / 10 season selection
- League Wheel
- saved league lock
- Club Assignment / FUT-inspired reveal
- two-different-club validation
- permanent club lock
- Showdown Home
- Continue Career
- Transfer Challenge
- transfer timer with real persisted deadline
- transfer draft persistence
- guess evaluation and required-release verdicts
- Season Results entry
- automatic scoring
- Season Summary
- multi-season progression
- final-showdown completion
- completed-showdown recovery hub

## Historical / read-only systems

- Legacy archive
- season-by-season Legacy history
- specific Legacy deletion
- delete-all Legacy history
- full local-data reset
- current-rivalry statistics
- cumulative analytics engine
- Trophy Room / manager records
- Rule Book

## Presentation systems

- original FIFA-17-era-inspired tile presentation
- unified current visual system
- generated local club identities rather than official club badges
- soundtrack/trailer selector through user-initiated YouTube embeds
- Marco Reus menu treatment using separately licensed Wikimedia imagery
- responsive layouts
- visible runtime error/success notices

Later presentation features such as Trophy Room, Rule Book and menu media are now current-source features. Preserve them while completing the original core blueprint.

---

# 5. Current application flow

## No active save

Application  
→ Main Menu  
→ New Showdown  
→ League Wheel  
→ Club Assignment  
→ Showdown Home

## Active showdown

Application  
→ Main Menu  
→ Continue Career  
→ state-aware canonical destination

The canonical destination depends on actual persisted state:

- no selected league → League Wheel
- selected league but no valid locked club pair → Club Assignment
- active/recording Transfer Challenge → Transfer Challenge
- otherwise active showdown → Showdown Home
- completed showdown → completed Showdown Home

## Current season cycle

Showdown Home  
→ Transfer Challenge  
→ Season Results  
→ Season Summary  
→ next Transfer Challenge / completed Showdown Home

## Completed showdown

Final Season Summary  
→ Completed Showdown Home

The completed hub provides valid onward routes to:

- Final Season Summary
- Legacy
- Trophy Room
- Rivalry Statistics
- New Showdown
- Main Menu

This completed hub intentionally supersedes the older specification that forced the user immediately into Legacy after the final season. It protects the user from a terminal/dead-end screen while still creating the Legacy record automatically.

---

# 6. Navigation architecture — CURRENT LOCK

`js/screens.js` is the single route/history authority in the current implementation.

The original blueprint called this responsibility a Router and expected a separate `router.js`. During implementation the responsibility settled in `screens.js`. **Do not recreate `router.js` merely to match the historical filename.** The responsibility, not the filename, is the architectural contract.

Current navigation guarantees:

- Every ordinary `.backButton` is intercepted centrally at document capture phase.
- `.dangerButton` controls are excluded from Back behavior.
- `screenHistory` is advisory, not blindly authoritative.
- Every screen has a finite legal set of logical parents.
- A history entry must also be valid for the current showdown state before Back can use it.
- If history is stale, the router derives a deterministic safe fallback.
- Pending transfer/storage writes are flushed before a route leaves an entry screen.
- A critical failed flush blocks navigation rather than silently discarding data.
- Club lock invalidates obsolete League/Club setup routes.
- Completed Transfer Challenge invalidates the obsolete transfer route.
- Completed showdown invalidates League, Club, Transfer and Season Results-entry routes.
- Completed showdown resumes to Showdown Home.
- Legacy, Trophy Room and New Showdown can return to Completed Showdown Home when they were opened from that hub; when opened from Main Menu, they return to Main Menu.

No feature module may directly manipulate `screenHistory`. CI enforces this.

### Historical header deviation

The original screen specification placed Back and Settings in a global header. Current source uses centrally controlled per-screen Back controls instead. Because the owner explicitly required the Back system to be made smarter and because the current routing architecture is now state-aware and guarded, **do not revert to the old placement as an architectural rewrite**.

A future Settings entry may be surfaced consistently without weakening the current Back authority.

---

# 7. Persistence architecture — CURRENT LOCK

The application currently stores:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

`js/storage.js` remains the browser-storage authority.

Current persistence guarantees:

- critical state transitions save immediately;
- transfer typing uses debounced/deduplicated draft persistence;
- pending writes flush on route leave and page/tab lifecycle events;
- failed critical writes roll back the affected in-memory transition where practical;
- active-save presence is cached but invalidated on storage events;
- Legacy reads use a revisioned cache;
- completed-showdown archiving is idempotent by showdown ID/revision;
- destructive operations check storage success;
- full reset attempts rollback if the second destructive storage operation fails;
- completed active save remains safe if Legacy synchronization fails;
- UI must say `Legacy sync pending` instead of falsely claiming archive success when that happens.

The original Bible says completed history must be protected and not silently overwritten. That remains a core release requirement.

---

# 8. Performance architecture — CURRENT LOCK

v0.16 replaced accumulated visual/runtime layers with a smaller deterministic shell.

## Initial shell

Only these local application assets are loaded at startup:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

Current CI allows:

- exactly one initial core stylesheet
- no more than seven initial JavaScript files
- initial local CSS/JS below the configured byte ceiling

## Lazy gameplay package

Only when gameplay is started/resumed:

- `data/leagues.js`
- `data/clubs.js`
- `js/dataEngine.js`
- `js/visualIdentity.js`
- `js/showdownUI.js`
- `js/leagueWheel.js`
- `js/clubAssignment.js`
- `js/transferChallenge.js`
- `js/seasonEngine.js`

## Lazy secondary modules

Loaded only when requested / idle diagnostics:

- Legacy
- analytics
- Rivalry Statistics
- Trophy Room
- Rule Book
- diagnostics
- optional view styles

## Runtime discipline

- one transfer timer interval maximum
- no off-screen transfer timer loop
- one YouTube iframe maximum
- no media iframe before explicit Play
- avoid full-showdown normalization on keypress/timer ticks
- avoid localStorage writes on every keypress
- async league/club callbacks must be showdown/operation identity-safe
- avoid unnecessary DOM replacement when text/state has not changed

---

# 9. Release-cache architecture

`index.html` owns one authoritative deployment asset revision through:

`<meta name="app-asset-revision" ...>`

Current revision: **`0.16.0-r2`**

All initial local assets use that revision. `js/optionalModules.js` reads the same shell value for dynamically loaded gameplay/history assets. `js/diagnostics.js` validates loaded assets against the same value. CI derives its expected revision from the shell instead of maintaining another independent hard-coded copy.

This rule exists because earlier v0.16 source changes reused `r1`, creating a possible stale-cache/mixed-build path. Future deployed-byte changes within the same application version must receive a new asset revision.

---

# 10. Original roadmap alignment

The original release plan remains the destination. Later build numbers represent implementation/stabilization work between those planned milestones; they do **not** create a replacement roadmap.

| Original milestone | Blueprint intent | Current reality |
| --- | --- | --- |
| v0.1 | Project foundation | Complete historically |
| v0.2 | Experience design | Complete historically |
| v0.3 | FIFA-17-inspired UI direction | Complete historically |
| v0.4 | Functional prototype | Complete historically |
| v0.5 | League/data foundation | Complete historically |
| v0.6 | League wheel | Complete |
| v0.6.1 | Application framework, navigation, storage | Complete and later hardened |
| v0.7 | Full showdown creation, league/club setup/reveal | Functionally complete |
| v0.8 | Season management, result entry, progression | Functionally complete and expanded with the approved Transfer Challenge |
| v0.9 | Scoring, statistics, Legacy/history | Functionally complete |
| v0.95 | Polish, feedback, transitions, UI refinement, performance | **Substantially implemented, but not yet declared complete** |
| v1.0 | Complete reliable local rivalry product | **Not yet declared complete** |

### What v0.10 through v0.16 mean

These are real implementation/stabilization builds created while the application moved from the v0.9 functional core toward the original v0.95 quality target.

They should not cause future development to invent an endless sequence of unrelated features. After v0.16 regression is accepted, development should rejoin the original roadmap at **v0.95**, then move to **v1.0**.

---

# 11. Blueprint items already satisfied or superseded

## Satisfied

- one-page SPA model
- persistent application shell
- logical routing
- Back behavior
- local persistence
- showdown creation
- league selection
- permanent club assignment
- season progression
- automatic scoring
- persistent history
- Legacy details
- individual Legacy deletion
- cumulative statistics
- destructive confirmations
- FIFA-17-era-inspired presentation
- responsive treatment
- error feedback
- performance work

## Intentionally superseded by later owner decisions/current implementation

### Old bonus interpretation
Superseded by grouped max-11 scoring.

### No Transfer Challenge in early Bible
Superseded by the approved Transfer Challenge system.

### Separate `router.js`
Superseded by the established route authority in `screens.js`.

### Forced final-season jump directly to Legacy
Superseded by automatic Legacy creation plus a completed Showdown Home hub.

### Multi-file core CSS plan
Superseded by the v0.16 unified visual system for performance and consistency.

### Original content set
Current source also includes approved Trophy Room, Rule Book, generated visual identities and user-initiated menu media. Preserve them.

---

# 12. Remaining blueprint-alignment gaps

These are the finite areas to inspect/close in the original **v0.95 Polish / Blueprint Alignment** milestone after v0.16 owner regression succeeds.

## Gap A — Settings surface

The original Screen Specifications define a Settings screen and describe preferences such as:

- animation preference
- application information
- reset/data management
- possible theme preference

Current source has no Settings screen/module/menu entry.

This is a real blueprint gap. It should be handled during v0.95 without changing gameplay rules or introducing accounts/cloud features.

A Settings implementation should reuse existing safe reset/data-management logic rather than duplicate destructive storage code.

## Gap B — Main-menu Statistics blueprint

The original navigation design exposed Statistics from Main Menu.

Current source separates historical/career information into:

- Trophy Room from Main Menu
- Rivalry Statistics from an active/completed Showdown Home
- analytics engine underneath both

This is not a data-system failure; the statistics capability exists. During v0.95, inspect whether the current Trophy Room sufficiently fulfills the original cumulative-Statistics entry or whether the existing analytics should receive a clearer Main Menu statistics surface. Preserve Trophy Room and avoid duplicate calculation engines.

## Gap C — Pre-final season confirmation/review

The original Season Engine describes showing the entered results and points before finalizing a season, followed by confirmation.

Current source uses an explicit `COMPLETE SEASON` action and then shows the read-only Season Summary after persistence.

During v0.95, inspect this against the owner experience. If no equivalent safety confirmation exists in browser behavior, add a lightweight review/confirmation step before the irreversible season commit. Do not permit editing of already completed historical seasons.

## Gap D — final v0.95 experiential regression

The original v0.95 goal is not more feature breadth. It is:

- improved feedback
- coherent transitions
- responsive usability
- visual consistency
- performance
- reliable navigation
- no major regressions

v0.16 has already completed substantial work here. Owner browser regression is still required before declaring this complete.

---

# 13. Items that are NOT current gaps

Do not invent work for these:

- backend
- cloud backup
- online multiplayer
- QR joining
- accounts
- community systems
- screenshot uploads
- match notes
- official club logos
- copied EA graphics/fonts
- new leagues
- public rankings
- completed-season editing

Those are either explicitly deferred, unnecessary for Version 1.0, or contrary to the current scope.

---

# 14. Automated validation status

GitHub Actions is the machine-validation environment for the exact repository head.

The assistant's local container has previously been unable to resolve/clone GitHub reliably. Do **not** claim a local repository `node --check` unless it actually becomes available.

Instead, the repository workflow validates the exact pushed source using GitHub's runner.

Current automated checks include:

- `node --check` on every JavaScript file in `js/` and `data/`
- locked scoring regression cases
- perfect-season maximum of 11
- grouped performance/awards bonuses
- equal non-zero scoring draw behavior
- 0-0 tiebreak behavior
- canonical showdown route matrix
- completed-showdown route restrictions
- contextual Back parents from completed hub
- one initial stylesheet
- maximum seven initial JavaScript files
- no eager gameplay package in `index.html`
- startup local-byte ceiling
- release-revision coherence from the shell-owned meta value
- centralized Back interception
- no direct `screenHistory` access outside `screens.js`
- required completion recovery UI
- absence of obsolete prototype files

Automated validation supplements browser testing. It does not replace the owner regression through the actual gameplay flow.

---

# 15. Current manual validation gate

Before starting the v0.95 alignment build, the owner should test `v0.16.0-r2` through a disposable rivalry.

The test should concentrate on:

- New Showdown → League → Club → Showdown Home
- Back before/after permanent locks
- transfer timer leaving/resuming
- transfer draft persistence
- season results leaving/reopening
- Complete Season
- multi-season progression
- final completion
- completed hub
- contextual Back from Legacy/Trophy Room/New Showdown
- refresh/Continue at multiple states
- menu media
- Legacy deletion/reset with disposable data
- general responsiveness/visual regressions

Any defect found during this gate is a **v0.16 stabilization bug**, not justification for a new feature branch.

---

# 16. What happens next

## Immediate

Finish and owner-test **v0.16.0-r2 stabilization**.

## After owner regression passes

Rejoin the original roadmap at:

### **v0.95 — Polish / Blueprint Alignment Release Candidate**

Finite objective:

1. close the Settings blueprint gap without changing gameplay;
2. resolve the original Main Menu Statistics surface against the existing Trophy Room/Rivalry Statistics architecture without duplicating analytics;
3. resolve the original pre-final season review/confirmation safety requirement if no equivalent experience exists;
4. fix owner-discovered visual/navigation/accessibility/performance regressions;
5. run the complete cross-screen and persistence regression;
6. synchronize Project State, Next Task, README and Changelog.

Do not add unrelated features to v0.95.

## After v0.95 acceptance

Move directly to:

### **v1.0 — Complete Release Candidate / Final Release**

v1.0 is a release-completion phase, not an excuse for more feature expansion.

The release gate is:

- core rivalry can be created and completed end-to-end;
- progress survives browser close/refresh;
- permanent league/club invariants hold;
- Transfer Challenge works every season;
- scoring is correct;
- full multi-season progression works;
- completed history is preserved;
- statistics/history are coherent;
- deletion is explicit/safe;
- navigation never strands the user;
- no major browser regression remains;
- interface is responsive and coherent;
- automated validation and owner regression pass;
- documentation describes the current application accurately.

---

# 17. Development philosophy — KEEP THIS IN EVERY CONTINUATION

**IMPLEMENTATION MODE**

- The project design phase is complete.
- Do not restart planning.
- Do not redesign architecture because a file name differs from old documentation.
- Do not repeatedly explain settled decisions.
- Do not ask for approval for decisions already locked.
- Do not get trapped in planning or debugging loops.
- Inspect current source first.
- Determine actual current state.
- Fix the root cause.
- Test it.
- Regression-check previously working systems.
- Update Project State / Next Task / Changelog when reality changes.
- Then continue the current milestone.
- Ask the owner only when a genuinely new product decision is required.
- Preserve working systems.
- Prefer finite, testable implementation over speculative improvement.
- The objective is to finish the original Version 1.0 vision, not endlessly extend the application.
