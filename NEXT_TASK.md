# NEXT TASK

## Current gate: v0.16.0-r3 Chromebook / responsive stabilization regression

Do **not** begin another feature/build-number sequence yet.

The immediate task is to validate the current `v0.16.0-r3` build in the real browser, especially on the owner's Chromebook, and fix any remaining regression while preserving current architecture, all working patches and locked gameplay rules.

After this gate passes, development rejoins the original Project Bible roadmap at **v0.95 Polish / Blueprint Alignment Release Candidate**, followed directly by **v1.0**.

---

# Part A — Chromebook Home layout verification

Hard refresh once so the browser loads asset revision `0.16.0-r3`.

At normal Chrome zoom on the Chromebook confirm:

1. Home renders without overlapping sections.
2. Continue Career remains the large primary tile.
3. New Showdown, Legacy, Trophy Room and Rule Book occupy a clean two-row navigation block beside it.
4. The soundtrack/trailer area appears **below** the core navigation rather than above it.
5. All seven media choices are arranged cleanly and remain readable.
6. The media selector itself does not create an awkward horizontal strip on desktop/laptop.
7. Press Play on a soundtrack.
8. The media/player row may grow vertically, but it must push later content downward instead of covering another tile.
9. Pause and Mute remain usable.
10. Select the gameplay trailer and Play it.
11. The iframe must remain contained inside the media row.
12. The bottom information strip remains below the media area.
13. The Home content may scroll vertically on a short Chromebook viewport; nothing should overlap merely to avoid scrolling.
14. Header, Home heading, tiles and footer should look proportionate at typical Chromebook viewport heights.

Also resize the Chrome window shorter while keeping desktop width. The low-height laptop rules should compact spacing rather than causing collisions.

---

# Part B — mobile preservation check

The mobile layout was already working well and must not regress.

At a narrow/mobile viewport confirm:

- single-column Home flow remains intact;
- Career/menu tiles remain readable;
- media area remains below the navigation tiles;
- selector remains horizontally usable at the tablet/mobile breakpoint;
- Play does not cause overlap;
- header and season indicator remain usable;
- no desktop compact rule leaks into the mobile layout.

The r3 fix is intentionally desktop/laptop-focused. Do not redesign the mobile layout unless an actual regression is found.

---

# Part C — core rivalry regression

After the Home layout is accepted, run a disposable rivalry through the existing stabilization path.

## New Showdown

- Main Menu → New Showdown.
- Back returns to Main Menu.
- Reopen New Showdown.
- Enter showdown name, two manager names and 1/3/5/10 season count.
- Start Showdown.

## League Wheel

- Spin once.
- Back is unavailable while the delayed spin is active.
- Selected league persists.
- League cannot be re-spun after it is locked.
- Leaving/re-entering preserves the selected league.

## Club Assignment

Before reveal:

- Back may return to League without clearing/changing the selected league.

During reveal:

- stale Back/reveal callbacks must not mutate a replacement state.

After reveal:

- clubs are different;
- both belong to the selected league;
- club pair is permanent;
- reveal cannot be repeated;
- obsolete setup routes are unavailable.

## Showdown Home

Verify:

- showdown name;
- selected league;
- manager names;
- locked clubs;
- season number;
- score;
- Transfer Challenge status.

## Transfer Challenge

- Start the 15-minute window.
- Leave to Showdown Home and resume.
- Timer must derive from the persisted deadline, not restart.
- No duplicate interval behavior.
- Hide/restore browser tab and confirm timer resynchronizes.
- Enter partial signing/guess data.
- Back to Home.
- Reopen; draft data must persist.
- Complete valid transfer data.
- Lock results.
- Correct league/nationality guesses mark affected signings for release.
- Completed transfer state cannot be resurrected through stale Back history.

## Season Results

- Enter partial season results.
- Back to Home and reopen during the same season.
- Form state should remain appropriate for that same in-session season.
- Complete the required fields.
- League-position validation must respect selected league size.
- Complete Season.

Expected:

- saving/busy state appears;
- no duplicate round is created;
- max-11 scoring remains correct;
- Season Summary opens;
- cumulative score updates;
- refresh/Continue preserves the saved season.

## Multi-season progression

For a multi-season disposable showdown:

- complete one season;
- start the next season;
- clubs remain unchanged;
- season number increments correctly;
- fresh Transfer Challenge exists for the new season;
- complete at least one transition into the next season.

## Final completion

Complete the final season.

Verify:

- final Season Summary;
- Completed status;
- active completed save remains available;
- Legacy copy is created;
- Completed Showdown Home opens;
- setup/transfer/results-entry routes cannot be revived.

---

# Part D — completed-hub contextual Back

From **Completed Showdown Home**:

- Legacy → Back returns to Completed Showdown Home;
- Trophy Room → Back returns to Completed Showdown Home;
- New Showdown → Back returns to Completed Showdown Home;
- Rivalry Statistics → Back returns safely;
- Final Summary → Back returns safely.

From **Main Menu**:

- Legacy → Back returns to Main Menu;
- Trophy Room → Back returns to Main Menu;
- New Showdown → Back returns to Main Menu;
- Rule Book → Back returns to Main Menu.

History must select the actual legal origin rather than an obsolete hard-coded parent.

---

# Part E — refresh / resume matrix

When practical, refresh and use Continue in these states:

- league selected, before clubs;
- clubs assigned / Showdown Home;
- Transfer Challenge active;
- Transfer Challenge recording;
- transfers completed before season submission;
- after a completed season in a multi-season showdown;
- after final completion.

Continue must derive the safe canonical route from persisted state.

---

# Part F — secondary and destructive systems

Exercise:

- Rivalry Statistics;
- Trophy Room;
- Legacy;
- Rule Book;
- soundtrack selector;
- trailer;
- specific Legacy delete;
- Delete All Legacy;
- delete current showdown;
- full reset.

Use disposable data for destructive tests.

Every destructive action must require confirmation and must not report success when storage actually failed.

---

# If an r3 regression is found

Remain in v0.16 stabilization mode.

Process:

1. inspect current `main`;
2. identify the root cause;
3. preserve current architecture and locked rules;
4. make the smallest coherent fix;
5. advance the asset revision if deployed local bytes changed;
6. add deterministic regression coverage where practical;
7. inspect exact-head GitHub Actions;
8. confirm GitHub Pages deployed that exact head;
9. update Project State / Next Task / Changelog / README when reality changes.

Do not use a regression as justification for unrelated feature work.

---

# After v0.16.0-r3 passes

The next milestone is **not v0.17**.

Resume the original Project Bible roadmap at:

# v0.95 — Polish / Blueprint Alignment Release Candidate

Finite workstreams:

## 1. Settings blueprint alignment

Implement the small Settings surface present in the original screen plan without changing gameplay rules or creating a second architecture.

Appropriate scope:

- application information;
- animation/reduced-motion preference where useful;
- access to existing safe data-management/reset behavior;
- theme preference only if it can coexist cleanly with the unified visual system.

No account/cloud/online settings.

## 2. Main Menu Statistics alignment

The original blueprint expects cumulative Statistics from Main Menu.

Current source already has:

- cumulative analytics engine;
- Trophy Room;
- active/completed Rivalry Statistics.

Resolve the navigation/presentation gap by reusing those systems. Do not duplicate analytics and do not remove Trophy Room.

## 3. Season pre-commit review

Inspect the actual Complete Season flow against the original Season Engine requirement to review entered results/points before permanent completion.

If no equivalent safety step exists, add a lightweight pre-commit review/confirmation.

Completed historical seasons stay read-only.

## 4. Final v0.95 polish

Only work that serves the original milestone:

- responsive consistency;
- Chromebook/laptop/mobile quality;
- focus/accessibility usability;
- clear feedback;
- coherent transitions;
- performance;
- full persistence/navigation regression.

No unrelated feature expansion.

## 5. Documentation synchronization

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

Final gate:

- full rivalry can be created and completed;
- multi-season progression works;
- persistence/resume works;
- league/club invariants hold;
- Transfer Challenge works every season;
- scoring remains correct;
- completed history is safe;
- statistics/history are coherent;
- destructive actions are explicit and safe;
- navigation never strands the user;
- Chromebook/laptop/mobile layout is coherent;
- performance remains within established architecture;
- automated validation passes;
- owner browser regression passes;
- documentation accurately describes the shipped application.
