# NEXT TASK

## Current gate: v0.95.0-r2 Club Reveal hotfix acceptance

Stay on **v0.95 Workstream 1**. Do not begin Settings or another blueprint-alignment workstream until the owner accepts this repair in the real browser.

**Application version:** v0.95.0  
**Deployed asset revision:** `0.95.0-r2`

---

# Why r2 exists

Owner testing of `0.95.0-r1` found two concrete defects:

1. startup displayed a false integrity error:
   `Application integrity check failed. version mismatch: runtime version is 0.95.0`
2. Club Assignment presentation was visually poor on Chromebook:
   - reveal cards/boxes appeared misaligned;
   - angled card geometry made alignment worse;
   - reveal animation did not feel clean or polished.

These defects must be resolved before Workstream 1 can be accepted.

---

# r2 implementation

## Diagnostics repair

`js/diagnostics.js` no longer hard-codes an old release version.

The expected runtime version is now derived from the shell-owned `app-asset-revision` value, so a valid release such as `0.95.0-r2` expects runtime version `0.95.0` automatically.

This prevents the previous false-positive integrity warning from recurring merely because the release milestone changes.

## Chromebook reveal geometry repair

Club Reveal now installs its responsive presentation rules only when the lazy Club Assignment module is initialized.

The repair:

- removes the angled `clip-path` card geometry;
- forces both manager cards into the same equal-width/equal-height grid tracks;
- constrains long manager/club names safely;
- gives both generated club identities identical measured space;
- uses a dedicated low-height desktop breakpoint for Chromebook/laptop viewports;
- reduces unnecessary vertical pressure;
- keeps confirmation matchup sides equal in size;
- preserves the mobile stacked layout;
- does not add another initial stylesheet or startup script.

## Reveal motion repair

The old sweeping-light presentation is disabled.

The finite sequence remains:

**Opening → Manager 1 → Manager 2 → VS → Confirmation**

but presentation is now shorter and cleaner:

- sealed card opens vertically;
- revealed card settles once;
- second card reveals separately;
- VS receives one short impact animation;
- confirmation panel enters once;
- no continuous animation loop;
- no animation-phase storage writes;
- reduced-motion behavior is still supported.

Timings are now approximately:

- Manager 1: 360 ms
- Manager 2: 860 ms
- VS: 1360 ms
- confirmation ready: 1680 ms

The random club pair is still persisted before theatrical stages begin.

---

# Integrity contract that must remain unchanged

- exactly one random pair per showdown;
- same selected league;
- two different clubs;
- pair saved atomically before reveal;
- failed assignment save rolls back;
- no reroll after save;
- stale reveal callbacks cannot mutate a replacement showdown;
- `Clubs Assigned` remains confirmation-pending persistence state;
- refresh/resume before confirmation restores the same pair;
- League Wheel remains locked after assignment;
- Dashboard/Transfer routes remain unavailable until confirmation;
- confirmation changes status to `Ready` only after its save succeeds;
- scoring and Transfer Challenge rules are untouched.

---

# Required owner test

Hard refresh once so the browser receives **asset revision `0.95.0-r2`**.

## 1 — startup integrity

Open the site normally.

Expected:

- no red integrity notice reporting `runtime version is 0.95.0`;
- Main Menu loads normally;
- existing save/Continue behavior remains unchanged.

If an integrity notice still appears, report its exact wording.

## 2 — Chromebook Club Assignment geometry

Create a disposable showdown and reach Club Assignment.

Before reveal:

- left and right cards must be the same width;
- left and right cards must be the same height;
- manager labels must align;
- inner card faces must align;
- VS must sit centered between cards;
- no card should appear skewed or visually lower than the other;
- no horizontal overflow.

On a low-height Chromebook/laptop viewport, the screen should remain compact and scroll naturally if necessary rather than overlap.

## 3 — reveal quality

Press **OPEN SHOWDOWN PACK**.

Expected:

1. brief opening state;
2. Manager 1 card opens/reveals cleanly;
3. Manager 2 card opens/reveals separately;
4. VS receives one short emphasis hit;
5. final rivalry confirmation appears;
6. motion ends completely.

Look specifically for:

- no sweeping white bar;
- no jerky card jumps;
- no cards shifting to different sizes during reveal;
- no long dead pauses;
- no repeated/pulsing animation after confirmation.

## 4 — long-name resilience

If practical, repeat until a relatively long club name appears.

Expected:

- name wraps inside the card rather than forcing the card wider/taller;
- generated identity stays centered;
- opposing card remains aligned.

## 5 — persistence/no-reroll regression

After reveal, before confirmation:

1. note both clubs;
2. refresh;
3. Continue Career.

Expected:

- same exact pair;
- final confirmation restored;
- no second random draw;
- no return to League Wheel.

Then confirm the rivalry and verify Showdown Home keeps the same clubs.

## 6 — core smoke regression

After confirmation, verify:

- Transfer Challenge opens;
- Season Results still open after completed transfer challenge;
- existing scoring remains unchanged;
- Back/Continue navigation still behaves normally.

---

# Automated state

The exact `0.95.0-r2` code passed the existing **Validate Static App** workflow, including:

- JavaScript syntax;
- max-11 scoring regression cases;
- confirmation-pending routing;
- no-reroll setup-route lock;
- cache-revision consistency;
- one initial stylesheet;
- maximum seven initial scripts;
- no eager gameplay package;
- startup byte budget;
- Chromebook Home layout guards.

GitHub Pages also deployed the r2 commit successfully.

Browser visual acceptance is still required because static CI cannot judge visual alignment/animation quality.

---

# After owner acceptance

Only after the owner confirms:

- false integrity warning is gone;
- Chromebook cards are aligned;
- reveal motion is acceptable;
- persistence/no-reroll still works;

mark **v0.95 Workstream 1 — FUT-style reveal/rivalry confirmation** accepted and proceed to **Workstream 2 — Settings blueprint alignment**.

If any reveal defect remains, stay on r2/r3 stabilization and fix that defect before moving forward.
