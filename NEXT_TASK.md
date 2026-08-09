# NEXT TASK

## Current gate: v0.16.0-r2 stabilization regression

Do **not** begin another feature/build-number sequence.

The immediate task is to validate the current `v0.16.0-r2` stabilization build in the real browser and fix any regression discovered while preserving current architecture, current features and locked gameplay rules.

The source has now been re-anchored to the original Project Bible roadmap. When this regression gate passes, the next milestone is the original **v0.95 Polish / Blueprint Alignment Release Candidate**, followed by **v1.0**.

---

# Part A — v0.16.0-r2 owner regression

Use disposable test data where destructive actions are involved.

## 1. Startup / Home

- Hard refresh the GitHub Pages site once so the `0.16.0-r2` asset revision is loaded.
- Confirm Home appears normally.
- Confirm Home remains responsive before gameplay is entered.
- Confirm Continue reflects whether an active save exists.
- Confirm menu media does not create a YouTube iframe before Play.

## 2. New Showdown / Back

- Open New Showdown from Main Menu.
- Press Back: it should return to Main Menu.
- Reopen New Showdown.
- Enter showdown name, both manager names and a season count.
- Start Showdown.

## 3. League Wheel

- Spin the League Wheel.
- During the spin, Back should be unavailable.
- The league should save before progression.
- The wheel must not re-spin after a league has been selected.
- Leaving/re-entering should show the selected league, not reset it.

## 4. Club Assignment

Before reveal:

- Back should return logically to League Selection without erasing the selected league.

During reveal:

- Back should be unavailable while the delayed reveal is active.

After reveal:

- clubs must be different;
- both clubs must belong to the selected league;
- clubs must remain permanent;
- club reveal cannot be repeated;
- Back to League/Club setup must no longer be available after club lock.

Continue to Showdown Home.

## 5. Showdown Home

Confirm:

- showdown name
- selected league
- both manager names
- both locked clubs
- season number
- current overall score
- Transfer Challenge status

all represent the saved showdown accurately.

## 6. Transfer Challenge lifecycle

- Start the Transfer Challenge.
- Start the 15-minute timer.
- Navigate to Showdown Home and reopen Transfer Challenge.
- Timer must continue from the persisted real deadline, not restart at 15:00.
- Only one interval should effectively be running.
- Hide/restore the browser tab; timer display should resynchronize from the deadline.
- End the window early or allow the test timer state to reach recording.
- Enter partial signing/guess information.
- Back to Showdown Home.
- Reopen Transfer Challenge.
- Draft information should persist.
- Finish valid signing/guess data.
- Lock Transfer Challenge.
- Correctly matched league/nationality guesses must mark corresponding signings for release.
- Once locked, Back/history must not resurrect the obsolete active Transfer Challenge state.

## 7. Season Results

- Continue to Season Results.
- Enter partial results.
- Back to Showdown Home.
- Reopen Season Results during the same showdown/season.
- The in-session form should remain appropriate for the same season.
- Complete required fields.
- Confirm league-position validation respects the selected league's team count.
- Submit Complete Season.

Expected:

- button enters saving state;
- no duplicate round is created;
- score uses max-11 rules;
- Season Summary opens;
- cumulative rivalry score updates;
- refresh/Continue retains the saved season.

## 8. Multi-season progression

For a multi-season disposable showdown:

- finish one season;
- start next season;
- confirm the same clubs remain locked;
- confirm new season number;
- confirm a fresh Transfer Challenge exists for that season;
- complete at least one next-season transition.

## 9. Final season / completed showdown

Complete the final season.

Expected:

- final Season Summary opens;
- showdown becomes Completed;
- active completed save remains available;
- Legacy copy is created;
- next action opens Completed Showdown Home;
- no setup/transfer/results-entry screen can be revived through stale Back history.

## 10. Completed Showdown Home

Verify every available route:

- View Final Season Summary
- Legacy
- Trophy Room
- Rivalry Statistics
- New Showdown
- Main Menu

None may lead to a blank, frozen or contextually wrong page.

### Contextual Back regression added in r2

From **Completed Showdown Home**:

- open Legacy → Back must return to Completed Showdown Home;
- open Trophy Room → Back must return to Completed Showdown Home;
- open New Showdown → Back must return to Completed Showdown Home.

From **Main Menu**:

- open Legacy → Back must return to Main Menu;
- open Trophy Room → Back must return to Main Menu;
- open New Showdown → Back must return to Main Menu.

The route history must choose the actual legal origin rather than a hard-coded destination.

## 11. Refresh / resume matrix

Refresh and use Continue at several states when practical:

- league selected, before club assignment
- clubs assigned / Showdown Home
- transfer window active
- transfer recording state
- transfer complete / before season submission
- after a completed season in a multi-season showdown
- after final showdown completion

Continue must derive the canonical safe destination from saved state.

## 12. Secondary screens

Exercise:

- Rivalry Statistics
- Trophy Room
- Legacy
- Rule Book

Confirm they render, remain responsive and Back returns to the logical origin.

## 13. Menu media

Test:

- selecting different soundtrack entries
- Play / Pause
- Mute / Unmute
- trailer
- leaving Home while trailer is loaded

Expected:

- no iframe before Play;
- at most one iframe at a time;
- trailer iframe is released when leaving Home;
- media failure does not break navigation.

## 14. Destructive data controls

With disposable data:

- delete a specific Legacy showdown;
- delete all Legacy history;
- delete current active showdown;
- reset all application data.

Every destructive action requires confirmation. Failure must not silently claim success.

## 15. Visual / responsive regression

Inspect at normal desktop/laptop width and a narrow/mobile width:

- Home tiles
- League Wheel labels
- club reveal cards
- Showdown Home
- Transfer Challenge inputs
- Season Results
- Season Summary
- Legacy
- Statistics
- Trophy Room
- Rule Book
- runtime notices

No overlap, hidden primary action, unreadable text or unusable control should remain.

---

# Part B — if a v0.16 regression is found

Remain in stabilization mode.

Process:

1. inspect current `main`;
2. reproduce from source/state;
3. identify the root cause;
4. make the smallest architectural fix consistent with current systems;
5. preserve locked gameplay and all current features;
6. add/extend automated regression coverage when the bug can be expressed deterministically;
7. inspect the exact-head GitHub Actions result;
8. confirm GitHub Pages deployed that exact head;
9. update Project State / Changelog only when reality changed.

Do not use a bug as justification for unrelated feature development.

---

# Part C — after v0.16.0-r2 regression passes

The next development milestone is **not v0.17**.

Resume the original Project Bible roadmap at:

# v0.95 — Polish / Blueprint Alignment Release Candidate

This is a finite release-convergence milestone.

## v0.95 objective

Close the remaining original Version 1.0 blueprint gaps while preserving all current working functionality and the v0.16 stability/performance architecture.

## Required v0.95 workstreams

### 1. Settings blueprint alignment

The original screen specification includes Settings. Current source does not.

Implement a small, focused Settings surface that does not alter gameplay rules.

Use the original scope as the boundary:

- application information;
- animation/preference control where useful;
- safe access to existing reset/data-management behavior;
- theme preference only if it can be added without creating a second visual system or destabilizing the unified CSS architecture.

Do not add accounts, cloud settings, online settings or unrelated configuration.

Do not duplicate storage-reset logic already implemented safely elsewhere.

### 2. Main Menu Statistics alignment

The original blueprint exposes cumulative Statistics from Main Menu.

Current source already contains:

- analytics engine;
- Rivalry Statistics for an active/completed showdown;
- Trophy Room / career records from Main Menu.

Inspect the current output before changing it.

Resolve the original Statistics navigation requirement by reusing the existing analytics architecture. Do not create a second statistics engine and do not remove Trophy Room.

### 3. Season pre-commit review / confirmation

The original Season Engine says entered results and points should be reviewed before the season becomes permanently completed.

Current source commits when `COMPLETE SEASON` is pressed and shows the Summary afterward.

Inspect the exact current browser flow. If there is no equivalent pre-commit safety step, implement a lightweight review/confirmation experience before the irreversible season write.

Completed historical seasons remain read-only.

### 4. Experience polish

Only polish that helps the original v0.95 goal:

- clear feedback;
- responsive behavior;
- coherent transitions;
- obvious navigation;
- accessibility/focus usability;
- performance;
- consistency.

Do not add visual complexity for its own sake.

### 5. Full release regression

Repeat the complete rivalry flow and all persistence/navigation/destructive cases after v0.95 work.

### 6. Documentation synchronization

Update:

- `PROJECT_STATE.md`
- `NEXT_TASK.md`
- `CHANGELOG.md`
- `README.md`

Only after implementation/testing changes reality.

---

# Part D — after v0.95 acceptance

Move directly to:

# v1.0 — Complete Release Candidate / Final Release

The purpose of v1.0 is to **finish**, not expand.

Required final gate:

- end-to-end showdown works;
- multi-season progression works;
- save/resume works;
- permanent clubs/league invariants hold;
- Transfer Challenge works each season;
- scoring remains correct;
- final winner/completion works;
- Legacy/history remains accurate;
- statistics remain derived/read-only;
- deletion/reset is safe;
- Back never strands the user;
- no major responsive/performance regression;
- automated validation passes;
- owner browser regression passes;
- documentation describes the shipped application accurately.

Do not add post-v1.0 ideas before this gate is satisfied.
