# NEXT TASK

## Current gate: v0.95.0-r6 Workstream 3 browser acceptance

Workstream 1B / `0.95.0-r4` is **owner accepted**.  
Workstream 2 / `0.95.0-r5` is **owner accepted**.

Stay on **v0.95 Workstream 3** until the owner has tested `0.95.0-r6` on the real Chromebook/mobile browser.

**Application version:** v0.95.0  
**Asset revision:** `0.95.0-r6`  
**Current workstream:** Settings / application motion preference  
**Source status:** implemented and machine-validated  
**Owner acceptance:** pending

Do not begin Main Menu Statistics alignment / Workstream 4 until this browser gate passes.

---

# What r6 implements

## Lightweight Settings surface

Settings is a lazy optional module opened from a new Home tile.

It is intentionally **not** a new `screens.js` route. The Settings experience is a modal application surface over the current screen, which preserves the centralized route/history model and avoids adding a second navigation authority for a small configuration feature.

Lazy assets:

- `js/settings.js`
- `css/settings.css`

They are not part of the initial Home startup payload.

The Settings surface contains only the owner-approved v1.0 scope:

1. application information;
2. motion/accessibility preference;
3. safe access to existing local data management.

There are no accounts, cloud saves, backend services, online settings, themes, notification systems or unrelated preference expansion.

## Application information

Settings shows:

- application version;
- deployed asset/build revision;
- local-browser save model;
- two-manager / one-device product mode.

The copy explicitly reflects the existing static/local architecture rather than implying an account or server exists.

## Motion preference

A separate application preference key is now used:

`careerModeShowdown.preferences`

It is not stored inside an active showdown or Legacy record.

Two choices are exposed:

### FOLLOW DEVICE — default

The application follows the browser/operating-system `prefers-reduced-motion` accessibility request.

### REDUCE MOTION

The application forces non-essential motion to be minimized even when the device itself is using standard motion.

The application intentionally does **not** provide a “force full motion” option. If the operating system/browser requests reduced motion, that request always wins.

Effective motion state is applied to the document during core storage initialization, before lazy Settings code is requested.

## Motion consumers

The shared effective preference now controls more than CSS duration.

### Club Assignment

The accepted r4 permanent-pair transaction is unchanged. With effective reduced motion, the pair is still generated/saved once but the theatrical staged reveal is skipped and the same saved pair proceeds directly to confirmation.

### League Wheel

The existing random selection/save/rollback operation is unchanged.

Standard timing remains approximately:

- 4000 ms spin;
- 700 ms automatic advance.

Reduced-motion timing is now approximately:

- 80 ms selection resolution;
- 120 ms automatic advance.

This fixes the previous accessibility mismatch where CSS could hide the wheel animation but JavaScript still waited four seconds.

### CSS transitions/animations

Both of these continue to minimize CSS motion:

- OS/browser `prefers-reduced-motion: reduce`;
- application `data-motion-reduced="true"` state.

## Settings accessibility

The Settings surface includes:

- `role="dialog"`;
- `aria-modal="true"`;
- labelled dialog title;
- inert/hidden background application while open;
- Escape to close;
- backdrop close;
- Tab/Shift+Tab focus containment;
- focus restoration to the opener;
- motion choices exposed as a radiogroup/radios;
- roving radio tab stop;
- Arrow Up/Down/Left/Right and Home/End selection;
- selected radio focus preserved after the dynamic preference rerender;
- visible focus treatment.

## Data Management reuse

Settings does **not** duplicate destructive storage code.

It shows lightweight active-showdown / Legacy counts, then provides:

**OPEN LEGACY & DATA MANAGEMENT**

That action opens the existing lazy Legacy module, where the established transactional/confirmation-protected actions remain authoritative:

- delete individual Legacy entry;
- delete all Legacy history;
- reset all Showdown data.

`Reset All Showdown Data` continues to mean competition data: active showdown + Legacy archive. It intentionally does **not** erase the application motion preference.

## Home layout

Home retains the accepted r4 hierarchy:

- Continue Career remains the dominant tile;
- New Showdown and Legacy remain the upper supporting tiles;
- Trophy Room, Rule Book and Settings share the second supporting row;
- soundtrack/trailer rail remains below the two-row navigation block.

Responsive behavior:

- desktop: three compact lower tiles;
- <=900 px: normal two-column tile flow;
- <=700 px: single-column flow;
- existing low-height Chromebook media/layout protections remain.

---

# r6 browser acceptance checklist

Hard refresh once before testing so Chrome receives `0.95.0-r6` shell assets.

## A. Startup / accepted r4+r5 regression

Expected:

- no application-integrity warning;
- Home loads normally;
- Continue Career remains dominant;
- New / Legacy remain aligned;
- Trophy Room / Rule Book / Settings form a balanced lower row on desktop;
- soundtrack/trailer rail remains below navigation and never overlaps it;
- r4 typography/club crests/two-pack reveal remain intact;
- r5 Transfer Window → Guess → Signing → Verdict flow remains intact.

## B. Settings lazy open / close

From Home press **SETTINGS**.

Expected:

- Settings opens as a polished modal surface;
- no route/screen disappears underneath it;
- version reads `v0.95.0`;
- build reads `0.95.0-r6`;
- save model says local browser storage;
- product mode says two managers / one device;
- Close, Done, Escape and backdrop close all work;
- focus returns to the Settings tile after closing.

## C. Follow Device default

With the device/browser using standard motion:

- Settings should initially show FOLLOW DEVICE selected;
- Device Preference should read Standard motion;
- Effective App Motion should read Standard motion.

Refresh the page. FOLLOW DEVICE should remain the default if no override was chosen.

## D. Reduce Motion persistence

Select **REDUCE MOTION**.

Expected:

- option becomes selected immediately;
- keyboard focus remains on the selected option;
- Effective App Motion reads Reduced motion;
- close Settings, refresh, reopen Settings;
- REDUCE MOTION remains selected.

## E. Reduced League Wheel behavior

With REDUCE MOTION selected, create a disposable showdown and spin the League Wheel.

Expected:

- exactly one random league is still selected;
- selection is still persisted before progression;
- save failure behavior/rollback remains unchanged;
- no four-second dead wait;
- wheel resolution/advance is near-immediate;
- selected league remains permanently locked exactly as before.

## F. Reduced Club Reveal behavior

Continue to Club Assignment with REDUCE MOTION selected.

Expected:

- OPEN SHOWDOWN PACKS generates/saves one permanent pair exactly as r4;
- no reroll path exists;
- long theatrical waits are skipped;
- same clubs appear at Rivalry Confirmation;
- explicit confirmation is still required;
- refresh before confirmation still restores the exact same clubs.

## G. Return to Follow Device

Return to Settings and select **FOLLOW DEVICE**.

On a standard-motion device, the normal r4 League Wheel / Club Reveal presentation should return.

If the operating system/browser itself requests reduced motion, the application must stay reduced even while FOLLOW DEVICE is selected.

## H. Data Management

From Settings press **OPEN LEGACY & DATA MANAGEMENT**.

Expected:

- Settings closes;
- existing Legacy screen opens;
- current data-management panel is used rather than a duplicate Settings implementation;
- existing destructive confirmation dialogs remain;
- deleting/resetting behaves exactly as before.

Optional persistence check:

1. select REDUCE MOTION;
2. use Reset All Showdown Data from Legacy;
3. return Home → Settings.

Expected: competition data is gone, but REDUCE MOTION remains selected.

## I. Keyboard accessibility

On desktop/Chromebook:

- Tab enters Settings controls;
- focus never escapes behind the modal;
- Shift+Tab wraps correctly;
- Arrow keys switch between Follow Device / Reduce Motion;
- Home/End select first/last motion choice;
- Escape closes;
- opener receives focus again.

## J. Responsive layout

On Chromebook low-height and phone:

- Settings never extends beyond the usable viewport without an internal scroll region;
- header/close control remain reachable;
- no horizontal overflow;
- panels become one column on phone;
- Done remains reachable;
- Home tiles and media rail remain clean after Settings is closed.

## K. core competition smoke

After Settings testing:

- create/resume showdown;
- League Wheel / Club Assignment work;
- r5 Transfer Guess → Signing phase persistence works;
- Season Results / max-11 scoring works;
- Season Summary works;
- Back/Continue remains canonical;
- Legacy/Statistics/Trophy/Rule Book still open normally.

---

# Machine validation protecting r6

## Validate Static App

Still protects the existing scoring, navigation, startup budget, original crest and two-pack reveal invariants.

## Validate Transfer Workstream

Still protects the accepted r5 FIFA 17 datasets, transfer phase migration, canonical matching, selector accessibility and lazy-loading contracts.

## Validate Settings Workstream

Protects:

- default Follow Device state;
- persistent Reduce Motion override;
- OS/browser reduced-motion precedence;
- preferences surviving Showdown-data reset;
- Settings remaining lazy;
- Home Settings binding;
- dialog/modal semantics;
- focus containment;
- keyboard radio semantics;
- Settings not writing localStorage directly;
- Settings not duplicating destructive storage primitives;
- reuse of Legacy Data Management;
- central motion preference consumption by Club Reveal and League Wheel;
- materially shortened reduced-motion League Wheel timing;
- user-forced reduced-motion CSS contract;
- low-height Chromebook and mobile Settings layout guards;
- CSS structure and duplicate-ID protection.

Automated checks do not replace real Chromebook/mobile visual acceptance.

---

# If r6 has a defect

Remain in Workstream 3.

Fix the actual Settings/motion/layout/accessibility cause while preserving accepted r4/r5 systems. Do not expand Settings scope. Do not create a second route system or duplicate destructive storage code. Bump the asset revision for deployed runtime changes and extend deterministic regression coverage for any discovered root cause.

---

# After r6 acceptance

## Workstream 4 — Main Menu Statistics alignment

Align the original Main Menu Statistics blueprint with the already-existing analytics architecture. Reuse Rivalry Statistics / Trophy Room / current analytics calculation engines; do not create a second statistics engine.

## Workstream 5 — Season pre-commit review

Inspect Complete Season UX and add a lightweight review/confirmation before irreversible season completion if an equivalent safeguard is still absent. Completed historical seasons remain read-only.

## Workstream 6 — final v0.95 polish/regression

Accessibility/focus, responsive consistency, typography/contrast, feedback/transitions, performance, persistence/navigation/gameplay regression and final documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.
