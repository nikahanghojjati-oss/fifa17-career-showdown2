# NEXT TASK

## Current gate: v0.95.0-r1 FUT-style Club Reveal / Rivalry Confirmation acceptance

The owner accepted the previous **v0.16.0-r3** Chromebook/responsive stabilization build.

Development has therefore rejoined the original Project Bible roadmap at **v0.95 — Polish / Blueprint Alignment**. The first carried-forward obligation from original v0.7 has now been implemented in source as **v0.95.0-r1**.

**Application version:** v0.95.0  
**Asset revision:** `0.95.0-r1`

Do not start Settings or another v0.95 workstream until this reveal build passes the real-browser acceptance below. If a defect is found, stay on this workstream and fix the root cause without changing gameplay rules or weakening the established architecture.

---

# What v0.95.0-r1 implements

Club Assignment now follows the original experiential sequence:

**Selected League Confirmed  
→ Reveal Begins  
→ Manager 1 Club Revealed  
→ Manager 2 Club Revealed  
→ Final VS Rivalry Presentation  
→ User Confirms Rivalry  
→ Showdown Home**

The implementation preserves the hardened assignment contract:

- exactly one random pair;
- same selected league;
- two different clubs;
- pair persisted atomically before theatrical reveal begins;
- failed save rolls the assignment back;
- no storage writes for individual animation phases;
- no reroll after a pair is saved;
- finite/cancellable reveal timers;
- stale callbacks are operation/showdown/league identity-safe;
- `Clubs Assigned` is the persisted confirmation-pending state;
- refresh/resume while confirmation is pending returns to Club Assignment with the same pair;
- League Wheel remains invalid after a pair is saved;
- Dashboard/Transfer routes remain invalid until explicit rivalry confirmation;
- confirmation changes status to `Ready` only after its save succeeds;
- reduced-motion path skips/shortens theatrics while retaining all information;
- reveal remains inside the lazy gameplay package;
- one-stylesheet / maximum-seven-initial-script startup architecture is unchanged;
- original generated club identities remain the copyright-safe visual foundation.

GitHub Actions now validates the confirmation-pending route state in addition to the existing scoring/navigation/cache/startup contracts.

---

# Part A — load the exact build

Hard refresh once and confirm the footer reports:

**v0.95.0 · Polish & Blueprint Alignment**

The browser must receive asset revision `0.95.0-r1`.

If the old two-card screen is still visible after a hard refresh, treat that as a deployment/cache issue rather than judging the new reveal.

---

# Part B — complete one fresh reveal

Use a disposable new showdown.

1. Main Menu → New Showdown.
2. Enter showdown name, both manager names and any 1 / 3 / 5 / 10 season count.
3. Start Showdown.
4. Spin the League Wheel once.
5. Enter Club Assignment.

Before opening:

- selected league is clearly confirmed;
- both club cards are sealed;
- progress display is visible;
- Open Showdown Pack is available;
- Back is available only before clubs are assigned.

Press **OPEN SHOWDOWN PACK**.

Expected staged experience:

1. opening state begins;
2. Manager 1 club reveals first;
3. Manager 2 club reveals separately afterward;
4. central VS presentation becomes the focus;
5. final rivalry confirmation panel appears.

The final panel must show accurately:

- showdown name;
- selected league;
- season count;
- Manager 1 name + assigned club;
- Manager 2 name + assigned club;
- central VS treatment;
- explicit **CONFIRM RIVALRY & START SHOWDOWN** action.

The two clubs must be different and both must belong to the selected league.

---

# Part C — permanence / no-reroll check

Before pressing final confirmation:

- there must be no Open/Reroll button;
- Back must not reopen League Selection;
- the displayed pair is already permanent;
- clicking around must not generate another pair.

Press **CONFIRM RIVALRY & START SHOWDOWN**.

Expected:

- Showdown Home opens;
- exact same manager/club pairing is displayed;
- selected league is unchanged;
- season count is unchanged;
- status has advanced from confirmation pending to normal Ready state.

The confirmation action accepts the pair; it never randomizes or modifies the pair.

---

# Part D — refresh/resume recovery test

This is a critical regression test.

Create another disposable showdown and reveal the clubs, but **do not press final confirmation**.

Once the final VS confirmation panel is visible:

1. refresh the page;
2. return to Main Menu if needed;
3. press Continue Career.

Expected:

- Continue returns to **Club Assignment**, not Showdown Home;
- the same two clubs remain assigned;
- the final confirmation presentation is restored;
- there is no second draw;
- League Wheel cannot be reopened;
- Transfer Challenge cannot be entered;
- confirming the rivalry then opens Showdown Home normally.

This verifies that `Clubs Assigned` works as a persisted confirmation checkpoint rather than a reroll opportunity.

---

# Part E — responsive presentation

## Chromebook / desktop

Confirm:

- reveal shell fits naturally without overlapping header/footer;
- both cards, central VS and confirmation panel remain readable;
- the page scrolls if viewport height is short rather than overlapping content;
- no regression to the previously accepted Home/media layout;
- reveal animation does not make the page visibly stutter.

## Mobile / narrow window

Confirm:

- club cards stack cleanly;
- VS remains understandable between them;
- final confirmation matchup stacks cleanly;
- buttons remain fully reachable;
- no horizontal page overflow;
- text and generated club identities remain readable.

---

# Part F — reduced-motion behavior

When practical, enable the operating-system/browser reduced-motion preference and repeat Club Assignment.

Expected:

- clubs are still assigned exactly once;
- theatrical staging is skipped or effectively immediate;
- both clubs and full final confirmation remain visible;
- explicit confirmation is still required;
- no information is lost.

Reduced motion changes presentation only, never persistence or gameplay.

---

# Part G — core regression after confirmation

After confirming a disposable rivalry, verify the previously accepted systems still work:

- Showdown Home values are correct;
- Transfer Challenge starts/resumes with its persisted 15-minute deadline;
- transfer drafts persist;
- transfer result locking works;
- Season Results accepts valid data;
- max-11 scoring remains correct;
- Season Summary works;
- multi-season progression retains the same clubs;
- refresh/Continue routes safely;
- final completion reaches Completed Showdown Home;
- Legacy / Trophy Room / Rivalry Statistics / Rule Book still open safely;
- destructive controls still confirm and report storage failures accurately.

Use disposable data for destructive tests.

---

# If a v0.95.0-r1 defect is found

Remain on **v0.95 Workstream 1**.

Process:

1. inspect current `main`;
2. reproduce from persisted state and current route behavior;
3. identify root cause;
4. preserve one-pair/no-reroll assignment integrity;
5. preserve locked gameplay/scoring/Transfer rules;
6. preserve lazy-loading/startup budget/Chromebook fixes;
7. make the smallest coherent fix;
8. advance asset revision if deployed app bytes change;
9. extend deterministic regression coverage when practical;
10. inspect exact-head GitHub Actions;
11. synchronize continuation documents when reality changes.

Do not use a reveal defect as justification for unrelated feature expansion.

---

# After owner acceptance of v0.95.0-r1

Mark the original v0.7 FUT-style reveal / rivalry-confirmation acceptance requirement complete.

Then continue the finite v0.95 roadmap in this order:

## Workstream 2 — Settings blueprint alignment

Implement the small Settings surface from the original screen plan using existing architecture. Appropriate scope may include application information, reduced-motion/animation preference where useful, and safe data-management access. No accounts/cloud/online systems.

## Workstream 3 — Main Menu Statistics alignment

Expose cumulative Statistics appropriately from Main Menu by reusing the existing analytics/Trophy Room/Rivalry Statistics engines. Do not create a duplicate analytics system.

## Workstream 4 — Season pre-commit review

Inspect the current Complete Season flow and add a lightweight review/confirmation before irreversible season completion if no equivalent safety step exists. Historical completed seasons remain read-only.

## Workstream 5 — final v0.95 polish/regression

- responsive consistency;
- accessibility/focus usability;
- feedback/transitions;
- performance;
- full persistence/navigation/gameplay regression;
- documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**. Do not create an unrelated v0.96/v0.97/v0.98 feature sequence unless a genuine release-fixing revision is required.
