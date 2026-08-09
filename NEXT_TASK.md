# NEXT TASK

## Current gate: v0.16.0-r3 Chromebook / responsive stabilization regression

Do **not** begin another feature/build-number sequence yet.

The immediate task remains validating the deployed `v0.16.0-r3` stabilization build in the real browser, especially on the owner's Chromebook, and fixing any remaining regression while preserving current architecture, all working patches and locked gameplay rules.

After this gate passes, development rejoins the original Project Bible roadmap at **v0.95 Polish / Blueprint Alignment Release Candidate**, followed directly by **v1.0**.

A roadmap audit has identified one important correction: the current club-assignment **mechanics** are complete, but the original v0.7 **FUT-style reveal and final rivalry-confirmation experience are not complete**. That carried-forward v0.7 obligation is now the first v0.95 workstream.

---

# Part A — v0.16.0-r3 owner regression

Hard refresh once so Chrome loads asset revision `0.16.0-r3`.

## Chromebook / Home

Confirm:

- Home has no overlapping sections;
- Continue Career remains the large primary tile;
- New Showdown, Legacy, Trophy Room and Rule Book form a clean supporting navigation block;
- soundtrack/trailer media sits below core navigation;
- all media choices remain readable;
- Play expands the media row rather than covering another tile;
- Pause/Mute/trailer still work;
- a short Chromebook window scrolls naturally instead of overlapping;
- mobile remains clean and single-column at the established breakpoint.

## Core rivalry regression

Run a disposable rivalry through:

Main Menu  
→ New Showdown  
→ League Wheel  
→ current Club Assignment  
→ Showdown Home  
→ Transfer Challenge  
→ Season Results  
→ Season Summary  
→ next season / final completion.

### League Wheel

Verify:

- one spin only;
- selected league persists;
- stale delayed callbacks cannot mutate a replacement showdown;
- locked league cannot be re-spun.

### Current Club Assignment — mechanics regression only

Do **not** mistake this check for FUT-reveal acceptance. The current presentation is known to be incomplete against the original blueprint.

Verify only the existing integrity guarantees:

- Back before assignment may return to League without clearing the saved league;
- assigned clubs are different;
- both clubs belong to the selected league;
- assignment occurs once;
- pair persists before progression;
- save failure rolls state back;
- stale reveal callbacks cannot mutate a replacement showdown;
- assigned clubs cannot be rerolled;
- after lock, obsolete League/Club setup routes remain invalid.

### Transfer Challenge

Verify:

- timer derives from persisted deadline;
- leaving/reopening does not restart 15:00;
- hidden-tab return resynchronizes correctly;
- partial transfer draft persists;
- no duplicate timer interval behavior;
- completed transfer state cannot be resurrected through Back;
- correct league/nationality guesses mark affected signings for release.

### Season Results / progression

Verify:

- partial same-season form behavior remains valid;
- league-position validation respects league size;
- Complete Season cannot create a duplicate round;
- locked max-11 scoring remains correct;
- Season Summary opens;
- refresh/Continue retains the completed season;
- multi-season progression retains the same clubs;
- a fresh Transfer Challenge starts for the next season;
- final completion creates/preserves the completed rivalry and Legacy copy.

### Completed-hub / Back

From Completed Showdown Home:

- Legacy → Back returns to Completed Showdown Home;
- Trophy Room → Back returns there;
- New Showdown → Back returns there;
- Rivalry Statistics and Final Summary return safely.

From Main Menu, the same optional screens should Back to Main Menu when that was their actual origin.

### Refresh/resume states

When practical, test refresh + Continue at:

- league selected, before clubs;
- clubs assigned / Showdown Home;
- Transfer Challenge active;
- Transfer Challenge recording;
- transfers completed before season submission;
- after one completed season of a multi-season rivalry;
- after final completion.

### Secondary / destructive systems

With disposable data exercise:

- Rivalry Statistics;
- Trophy Room;
- Legacy;
- Rule Book;
- soundtrack/trailer;
- specific Legacy deletion;
- Delete All Legacy;
- active-showdown deletion;
- full reset.

Destructive operations must require confirmation and must not report success when storage failed.

---

# If an r3 regression is found

Remain in v0.16 stabilization mode:

1. inspect current `main`;
2. identify root cause;
3. preserve current architecture and locked rules;
4. make the smallest coherent fix;
5. advance asset revision if deployed app bytes changed;
6. add deterministic regression coverage where practical;
7. inspect exact-head GitHub Actions;
8. confirm GitHub Pages deployment when app bytes changed;
9. update continuation documents when reality changed.

Do not use a regression as justification for unrelated feature work.

---

# After v0.16.0-r3 passes

The next milestone is **not v0.17**.

Resume the original Project Bible roadmap at:

# v0.95 — Polish / Blueprint Alignment Release Candidate

This is a finite convergence milestone. It closes remaining original Version 1.0 obligations while preserving every reliability/performance lesson learned since the early roadmap.

## 1. COMPLETE THE ORIGINAL v0.7 FUT-STYLE CLUB REVEAL / RIVALRY CONFIRMATION

### Current reality

Current source already provides reliable club-assignment mechanics:

- selected league is locked;
- one random club pair is generated;
- clubs are different;
- both come from the selected league;
- pair is saved atomically;
- save failure rolls back;
- asynchronous assignment is operation/showdown/league identity-safe;
- clubs become permanent;
- no reroll path remains after lock.

But the visual experience is currently basic: pressing Open Club Pack waits briefly and then both simple cards reveal their club names together. This does **not** satisfy the original v0.7 acceptance criteria.

### Original blueprint obligation

The reveal must become a lightweight football-game-style ceremony:

**Selected League Confirmed  
→ Reveal Begins  
→ Manager 1 Club Revealed  
→ Manager 2 Club Revealed  
→ Final VS Rivalry Presentation  
→ User Confirms Rivalry  
→ Showdown Home**

The final confirmation presentation must clearly show:

- selected league;
- showdown name;
- number of seasons;
- Manager 1 + assigned club;
- Manager 2 + assigned club;
- central VS rivalry treatment;
- one explicit confirmation/start action.

### Implementation guardrails

Build this **on top of** the existing assignment engine. Do not rewrite the data model/randomization simply to make the reveal dramatic.

Preserve:

- one assignment only;
- no rerolls;
- same-league/different-club invariant;
- atomic persistence/rollback;
- identity-safe asynchronous operations;
- centralized smart navigation;
- lazy gameplay loading;
- unified `css/app.css` architecture;
- startup performance budget;
- Chromebook/mobile responsive behavior.

The presentation should remain lightweight:

- CSS transforms/opacity/clip/gradient effects rather than canvas/WebGL/video;
- existing deterministic `visualIdentity.js` initials/colors as the copyright-safe club visual foundation;
- no official club badges;
- no copied EA/FUT card artwork;
- no proprietary FIFA fonts;
- no downloaded reveal video/audio bundle;
- no continuous animation loop;
- no localStorage write for each animation phase.

Use finite, cancellable reveal stages. A stale timer/transition from an old showdown must never reveal or mutate a replacement showdown.

`prefers-reduced-motion` must preserve all information and confirmation while shortening/skipping theatrical motion.

### Acceptance criteria

This workstream is complete only when:

- reveal feels meaningfully staged rather than two names appearing after a delay;
- Manager 1 and Manager 2 reveals are visibly distinct stages;
- final VS tableau communicates the complete rivalry;
- user explicitly confirms the final pairing before entering Showdown Home;
- confirmation cannot change/reroll clubs;
- refresh/resume after a successfully saved pair never generates a second pair;
- Back cannot invalidate a permanent assignment;
- mobile and Chromebook layouts are coherent;
- reduced-motion path works;
- performance/lazy-loading contracts remain intact;
- deterministic regression coverage protects the assignment invariants.

Until these criteria pass, original v0.7 is **mechanically complete but presentation/acceptance incomplete**.

## 2. Settings blueprint alignment

Implement the small Settings surface from the original screen plan without creating a second architecture.

Appropriate scope:

- application information;
- animation/reduced-motion preference where useful;
- access to existing safe data-management/reset behavior;
- theme preference only if it can coexist cleanly with the unified visual system.

No accounts/cloud/online settings.

## 3. Main Menu Statistics alignment

The original blueprint expects cumulative Statistics from Main Menu. Current source already has the analytics engine, Trophy Room, and active/completed Rivalry Statistics.

Resolve the navigation/presentation gap by reusing those systems. Do not duplicate analytics and do not remove Trophy Room.

## 4. Season pre-commit review

Inspect the actual Complete Season flow against the original requirement to review entered results/points before permanent completion.

If no equivalent safety step exists, add a lightweight pre-commit review/confirmation. Completed historical seasons remain read-only.

## 5. Final v0.95 polish / regression

Only work serving the original quality milestone:

- responsive consistency;
- Chromebook/laptop/mobile quality;
- focus/accessibility usability;
- clear feedback;
- coherent transitions;
- performance;
- complete persistence/navigation/gameplay regression.

No unrelated feature expansion.

## 6. Documentation synchronization

After implementation/testing changes reality, update:

- `PROJECT_STATE.md`;
- `NEXT_TASK.md`;
- `CHANGELOG.md`;
- `README.md`.

---

# After v0.95 acceptance

Move directly to:

# v1.0 — Complete Release Candidate / Final Release

v1.0 is for finishing, not expanding.

Final gate includes:

- full rivalry creation works end-to-end;
- original FUT-style club reveal + rivalry confirmation is genuinely complete;
- club assignment remains permanent and race-safe;
- multi-season progression works;
- persistence/resume works;
- Transfer Challenge works every season;
- scoring remains correct;
- completed history is safe;
- statistics/history are coherent;
- destructive actions are explicit/safe;
- navigation never strands the user;
- Chromebook/laptop/mobile presentation is coherent;
- performance architecture remains intact;
- automated validation passes;
- owner browser regression passes;
- documentation accurately describes the shipped application.
