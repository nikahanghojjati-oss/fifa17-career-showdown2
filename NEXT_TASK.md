# NEXT TASK

## Current gate: v0.95.0-r4 Workstream 1B browser acceptance

Stay on **v0.95 Workstream 1B** until the owner has tested `0.95.0-r4` on the real Chromebook/mobile browser.

**Application version:** v0.95.0  
**Asset revision:** `0.95.0-r4`  
**Source status:** implemented and machine-validated  
**Owner acceptance:** pending

Do not begin the Transfer Challenge phase/data redesign until this browser gate passes.

---

# What r4 implements

## FIFA-era typography hierarchy

- Barlow Condensed is requested for selected display roles with `display=swap`.
- Existing condensed/system fonts remain immediate fallbacks.
- Home tile labels, major headings, scores, navigation and reveal typography were retuned for a stronger FIFA-17-era feel.
- Body copy/forms remain on the readable UI font where condensed display type would hurt usability.
- Font files are not stored in the repository; source/license information is in `THIRD_PARTY_NOTICES.md`.

## Original club crest identities

- All 98 clubs in the locked five-league Showdown pool have explicit club-associated palettes.
- `js/visualIdentity.js` generates original deterministic SVG crests from project-owned shapes, patterns and motifs.
- Official club badge images/vector paths are not used by the identity engine.
- The same club identity is reused across reveal/confirmation/dashboard/transfer/season/summary surfaces where club identity appears.
- Automated checks verify all 98 identities are covered, deterministic and distinct.

## Two-pack reveal

Current sequence:

**saved club pair  
→ two sealed packs  
→ Pack 01 / Manager 1 reveal  
→ suspense beat  
→ Pack 02 / Manager 2 reveal  
→ VS  
→ Rivalry Confirmation**

Presentation is now owned by `css/app.css`; Club Assignment JavaScript no longer injects a second stylesheet.

Finite timing target:

- M1 ~650 ms
- M2 ~1750 ms
- VS ~2850 ms
- confirmation ~3300 ms

The pair remains persisted before theatrical reveal and can never reroll because of animation/refresh.

---

# r4 browser acceptance checklist

Hard refresh once before testing so Chrome receives `0.95.0-r4` local assets.

## A. Startup / Home typography

Expected:

- no application-integrity warning;
- Home loads normally even if the external font service is unavailable;
- Main Menu typography looks materially closer to a FIFA-era football-game menu;
- Continue Career remains the dominant tile;
- New Showdown / Legacy / Trophy Room / Rule Book remain readable and visually balanced;
- small tile metadata remains readable and does not clip;
- soundtrack/trailer rail remains below the Career tiles;
- playing media expands vertically without overlap;
- Chromebook short-height layout remains clean and scrollable;
- mobile remains clean and single-column where intended.

Optional fallback check: temporarily block/offline-reload the Google Fonts request if convenient. Text should remain visible immediately using the local/system fallback stack.

## B. Club Assignment — sealed packs

Create a disposable showdown and reach Club Assignment.

Before opening:

- exactly two equal-size sealed Showdown packs are visible;
- Manager 1 / Manager 2 labels are aligned;
- pack 01 / pack 02 look balanced;
- no skewed geometry or white sweep appears;
- Back remains available only before the permanent pair is drawn.

Press **OPEN SHOWDOWN PACKS**.

Expected:

1. draw becomes permanently locked/saved;
2. Pack 01 opens first;
3. Manager 1 club/crest appears;
4. short suspense pause;
5. Pack 02 opens;
6. Manager 2 club/crest appears;
7. VS receives one short emphasis;
8. confirmation panel appears;
9. Confirm Rivalry becomes available.

No pack should loop, jitter, resize or overlap the other pack.

## C. Original club crests

Test several disposable draws if practical, especially clubs with different visual traditions and long names.

Expected:

- clubs show crest-like original graphics rather than the old simple two-color initials block;
- two clubs should be distinguishable before reading the names;
- crests remain crisp on Chromebook and mobile;
- crest does not cover club name;
- long club names wrap inside the available area rather than resizing/misaligning the card;
- confirmation panel uses the same crest identity;
- after confirmation, Showdown Home uses the same club identity.

The crest may use a small monogram, but the monogram should no longer be the entire visual identity.

## D. Reveal integrity / refresh

Critical test:

1. create a disposable showdown;
2. open the packs;
3. stop at final confirmation;
4. refresh browser;
5. press Continue Career.

Expected:

- exact same league;
- exact same two clubs;
- exact same club identities;
- return to Club Assignment confirmation;
- no new random draw;
- League Wheel remains unavailable;
- Showdown Home/Transfer cannot be entered until explicit confirmation.

Then confirm rivalry and verify Showdown Home contains the exact same clubs.

## E. Reduced motion

If OS/browser reduced motion can be enabled conveniently:

- the pair still saves once;
- the same clubs appear;
- theatrical delay is skipped/minimized;
- confirmation still required;
- no different gameplay/persistence behavior.

## F. r3 visual regression

Open:

- Rule Book
- Trophy Room
- Rivalry Statistics
- Legacy

Expected:

- r3 contrast corrections remain intact;
- no pale/white text on light panels;
- long names remain contained;
- Chromebook/mobile layouts remain readable.

## G. core gameplay smoke test

After confirming a disposable rivalry:

- Showdown Home works;
- Transfer Challenge opens;
- timer starts/resumes;
- current combined signing/guess screen still works for this build;
- drafts persist;
- Transfer Challenge can complete;
- Season Results opens;
- scoring remains max 11;
- Season Summary works;
- Back and Continue remain state-safe.

Do **not** expect Guess/Signing separation yet. That is Workstream 2 and must only begin after r4 visual acceptance.

---

# If r4 has a defect

Remain in Workstream 1B.

1. inspect exact `main`;
2. identify real typography/crest/pack/layout root cause;
3. preserve all locked gameplay/state/persistence rules;
4. preserve startup/lazy-loading limits;
5. fix the component rather than stacking a device-specific hack where avoidable;
6. bump asset revision if deployed local CSS/JS/data changes;
7. extend deterministic regression coverage where practical;
8. verify exact-head GitHub Actions;
9. verify Pages deployed the exact head;
10. update continuation documentation.

Do not use a visual defect to begin Transfer Workstream 2 early.

---

# After r4 acceptance — Workstream 2

Implement the owner-approved Transfer Challenge foundation **before Settings**.

Target flow:

**15-minute transfer window  
→ Guess Entry  
→ lock/persist guesses  
→ Signing Entry  
→ lock/persist signings  
→ evaluate matches / release verdicts  
→ Transfer Results  
→ Season Results**

Required Workstream 2 scope:

1. explicit Transfer sub-phase/state with safe old-save compatibility;
2. Guess Entry and Signing Entry become separate UI phases/screens;
3. guesses occur first;
4. complete historical FIFA 17 former-league metadata dataset, separate from Showdown wheel;
5. complete FIFA 17 player-nationality dataset;
6. responsive searchable controlled selectors for league/nationality;
7. guess value options change with League/Nationality type;
8. canonical IDs stored/evaluated instead of arbitrary free text;
9. draft persistence remains debounced/deduplicated;
10. critical phase transitions save immediately and roll back/block on failure;
11. central route/Back/Continue logic understands transfer sub-phases;
12. mobile/Chromebook accessibility and viewport behavior;
13. expanded deterministic data/state regression tests;
14. owner browser acceptance.

The competition rules do not change: 15 minutes, max three signings each, three guesses each, league or nationality, matched signing released.

---

# Remaining original v0.95 path after Workstream 2

## Workstream 3 — Settings

Small original-blueprint Settings surface: app information, useful animation/reduced-motion preference, safe existing data-management access. No accounts/cloud/online systems.

## Workstream 4 — Main Menu Statistics alignment

Reuse the existing analytics/Trophy Room/Rivalry Statistics architecture. Do not duplicate calculation engines.

## Workstream 5 — Season pre-commit review

Add/confirm a lightweight review before irreversible season completion. Completed historical seasons remain read-only.

## Workstream 6 — final v0.95 release polish

Accessibility/focus, responsive consistency, typography/contrast, feedback/transitions, performance and complete persistence/navigation/gameplay regression.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.