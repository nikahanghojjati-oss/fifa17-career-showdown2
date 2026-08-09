# NEXT TASK

## Current gate: v0.95.0-r5 Workstream 2 browser acceptance

Workstream 1B / `0.95.0-r4` is **owner accepted**.

Stay on **v0.95 Workstream 2** until the owner has tested `0.95.0-r5` on the real Chromebook/mobile browser.

**Application version:** v0.95.0  
**Asset revision:** `0.95.0-r5`  
**Source status:** implemented and machine-validated  
**Owner acceptance:** pending

Do not begin Settings / Workstream 3 until this browser gate passes.

---

# What r5 implements

## Transfer Challenge state model

The competition rules are unchanged:

- 15-minute transfer window;
- maximum three signings per manager;
- three opponent guesses;
- each guess is League or Nationality;
- a signing matching a correct guess must be released.

The existing challenge record is retained. No parallel transfer record or second router was created.

Persistent transfer phases are now:

1. `window`
2. `guess_entry`
3. `signing_entry`
4. `completed`

The existing status values remain compatible with central routing:

- `not_started`
- `active`
- `recording`
- `completed`

Both Guess Entry and Signing Entry intentionally remain `status: recording`; the explicit `phase` determines which UI/state is active. This preserves `js/screens.js` as the sole route/history authority.

## New transfer flow

**15-minute transfer window  
→ Guess Entry  
→ lock/persist guesses  
→ Signing Entry  
→ lock/persist signings  
→ canonical guess evaluation  
→ Transfer Verdicts  
→ Season Results**

The post-window timer UI is removed from Guess/Signing/Verdict phases so each phase reads as a distinct screen state rather than the old combined form with a dead `00:00` timer.

## Persistence / rollback

Critical transitions are immediate saved transitions:

- transfer window → Guess Entry;
- Guess Entry → Signing Entry;
- Signing Entry → Completed/Verdicts.

Before each critical transition the challenge is snapshotted. Failed persistence restores the previous challenge/state and blocks progression.

Ordinary field editing remains debounced/deduplicated rather than writing localStorage on every keypress.

Only the currently editable phase is captured:

- Guess Entry draft saves guesses;
- Signing Entry draft saves signings;
- locked guesses are not rewritten by later signing edits.

## Old-save compatibility

An old v0.95/r4 `status: recording` challenge with no `phase` safely migrates to `guess_entry`.

Existing old signing/guess drafts are retained. Historical free-text League/Nationality values are canonicalized when a known FIFA 17 alias can be resolved.

Examples protected by tests include:

- `Calcio A` → canonical Italian Serie A option;
- `Liga BBVA` → canonical Spanish Primera División option;
- `Czechia` → canonical Czech Republic nationality;
- `North Macedonia` → canonical FYR Macedonia option;
- `Türkiye` → canonical Turkey option;
- `South Korea` → canonical Korea Republic option.

If an old value cannot be safely resolved, the value remains visible and must be reselected before the phase can be locked. Existing data is not silently guessed into the wrong canonical option.

## FIFA 17 transfer metadata

New lazy data module: `data/transferOptions.js`.

Transfer metadata is separate from the locked five-league Showdown Wheel.

Current canonical dataset:

- **36 Transfer League options** — 35 historical FIFA 17 domestic league competitions plus `Rest of World` fallback;
- **164 FIFA 17 player nationalities**.

This includes historical lower divisions represented in FIFA 17, including England's four tiers and the second divisions in France, Germany, Italy and Spain.

The Showdown League Wheel remains exactly five leagues.

## Controlled searchable selectors

New lazy selector module: `js/transferSelector.js`.

Signing Entry:

- Player Name — normal text input;
- Previous League — searchable controlled FIFA 17 selector;
- Nationality — searchable controlled FIFA 17 selector.

Guess Entry:

- Guess Type — League / Nationality;
- Guess Value — searchable controlled selector whose dataset follows the selected type.

Selector behavior:

- type-to-filter;
- bounded result list;
- League country/tier context;
- Arrow Up / Arrow Down;
- Enter to select;
- Escape to close;
- visible focus;
- `role=combobox` / listbox / active-descendant ARIA wiring;
- canonical ID stored separately from display label;
- invalid arbitrary text cannot be locked as a valid option;
- mobile popover constrained to the viewport;
- low-height Chromebook breakpoint;
- no UI framework.

## Canonical release evaluation

Release matching now compares canonical IDs, not normalized arbitrary strings.

Examples:

- `TIM Serie A` signing and a historical `Calcio A` alias resolve to the same League ID;
- `Turkey` / `Türkiye` resolve to the same nationality ID;
- different canonical IDs cannot accidentally match because of formatting/accents.

## Lazy/performance architecture

The initial shell remains unchanged:

- one local initial stylesheet;
- seven initial JavaScript files maximum;
- no Transfer option data at Home startup.

New Workstream 2 assets are loaded through the existing lazy gameplay package:

- `css/transfer.css`
- `data/transferOptions.js`
- `js/transferSelector.js`

The existing one-transfer-timer / hidden-tab shutdown / debounced-draft contracts remain.

---

# r5 browser acceptance checklist

Hard refresh once before testing so Chrome receives `0.95.0-r5` assets.

## A. Startup / r4 regression

Expected:

- no startup integrity warning;
- r4 Home typography remains intact;
- r4 custom club crests remain intact;
- r4 two-pack reveal remains intact;
- media rail remains stable;
- Rule Book / Statistics / Trophy Room / Legacy contrast remains correct.

## B. Transfer Window

Create or use a disposable confirmed showdown and open the season Transfer Challenge.

Expected:

- four-step progress strip is visible: Transfer Window → Guess Entry → Signing Entry → Verdicts;
- Transfer Window is active;
- 15:00 timer starts normally;
- only one timer runs;
- hiding the tab stops the interval but the persisted deadline continues correctly;
- returning calculates the correct remaining time;
- End Window Early still works;
- the competition rule text is unchanged.

## C. Guess Entry — must happen first

End/expire the Transfer Window.

Expected:

- Transfer Window timer/hero disappears;
- Guess Entry becomes the active progress step;
- Signing Entry fields are not shown/editable yet;
- both managers have three Guess rows;
- Guess Type offers League / Nationality;
- Guess Value is disabled until a type is selected;
- selecting League searches the FIFA 17 League dataset;
- selecting Nationality searches the FIFA 17 player-nationality dataset;
- arbitrary invalid text cannot be locked;
- League result rows show useful country/tier context where applicable;
- keyboard Arrow/Enter/Escape works;
- no dropdown escapes the screen on Chromebook/mobile.

Enter several guesses and press:

**LOCK GUESSES & CONTINUE TO SIGNINGS**

Expected:

- transition only occurs after successful persistence;
- success message appears;
- Guess Entry is marked complete;
- Signing Entry becomes active;
- Showdown Home/refresh now identifies Signing Entry correctly.

## D. Guess-lock refresh test

Immediately after locking guesses:

1. refresh browser;
2. press Continue Career.

Expected:

- exact same showdown/season;
- Transfer Challenge opens directly in Signing Entry;
- exact locked guesses are retained;
- user is not returned to Transfer Window;
- guesses cannot be casually rewritten by Signing Entry edits.

This is the most important new persistence test in r5.

## E. Signing Entry

Expected:

- only Signing Entry form is active;
- each manager has maximum three signing rows;
- Player Name remains normal text;
- Previous League uses searchable historical FIFA 17 competitions;
- Nationality uses searchable FIFA 17 player nationalities;
- invalid arbitrary League/Nationality text blocks completion;
- old historical aliases can be found/resolved through the controlled options;
- long values stay contained on Chromebook/mobile.

Test searches such as:

- Championship
- League One
- Serie B
- Segunda
- J1
- MLS
- Czech
- Korea
- Côte / Ivory
- Turkey / Türkiye

Then press:

**LOCK SIGNINGS & REVEAL VERDICTS**

## F. Canonical verdicts

Use at least one deliberate matching test.

Example:

- Guess Type: League
- Guess: Italian Serie A option
- Signing Previous League: same Italian Serie A option

Expected: signing = **RELEASE**.

Then use a non-match and expect **SAFE**.

Also test a Nationality match.

Verdict rows should display the signing metadata and, for a release, the matching guess label.

## G. Completed transfer / Season Results

Expected:

- Verdicts step active/completed correctly;
- Continue to Season Results works;
- dashboard now reports Transfer Challenge complete;
- obsolete Transfer Challenge route is no longer canonical after completion;
- Season Results/scoring remains unchanged;
- maximum season score remains 11.

## H. Old-save compatibility

If a pre-r5 disposable save exists in the old combined `recording` state, test Continue Career.

Expected:

- it opens safely at Guess Entry;
- old guess/signing drafts are not erased;
- recognizable historical strings are canonicalized;
- any unknown free-text value remains visible rather than being silently converted to the wrong option;
- once guesses are locked, preserved old signing drafts appear in Signing Entry.

## I. Back / Continue / destructive actions

From Guess Entry and Signing Entry:

- Back to Showdown Home remains safe;
- draft flush occurs before leaving;
- Continue Career returns to the same transfer phase;
- deleting/resetting the active showdown still clears obsolete transfer state;
- no route history is manipulated outside `screens.js`.

## J. Responsive / accessibility

Chromebook low-height and phone:

- progress strip is readable;
- forms do not overlap;
- selector popup is viewport-contained;
- touch targets are usable;
- keyboard focus remains visible;
- no horizontal overflow from long League/Nationality names;
- reduced-motion preference does not break transfer behavior.

---

# Machine validation currently protecting r5

`Validate Static App` still protects all prior scoring/navigation/startup/club-reveal contracts.

New `Validate Transfer Workstream` protects:

- 36 transfer competition options;
- 164 player nationalities;
- unique canonical IDs;
- important historical lower-division coverage;
- transfer dataset not expanding the five-league Showdown Wheel;
- historical alias resolution;
- old `recording` → Guess Entry migration;
- old signing draft preservation;
- Guess → Signing ordering;
- canonical-ID RELEASE/SAFE matching;
- critical transition save/rollback markers;
- selector ARIA/keyboard contracts;
- bounded desktop/mobile selector popovers;
- Chromebook breakpoint;
- reduced-motion rule;
- transfer assets remaining out of the initial shell.

Automated checks do not replace the owner Chromebook/mobile visual test.

---

# If r5 has a defect

Remain in Workstream 2.

Fix the actual transfer state/data/selector/layout cause without changing competition rules or building a second router/storage model. Bump the asset revision for any deployed local runtime change and extend regression coverage for every discovered root cause.

---

# After r5 acceptance

## Workstream 3 — Settings

Implement the small original-blueprint Settings surface using current architecture:

- application information;
- useful animation/reduced-motion preference if still valuable;
- safe existing data-management access.

No accounts, backend, cloud or online systems.

## Workstream 4 — Main Menu Statistics alignment

Reuse existing analytics/Trophy Room/Rivalry Statistics. Do not create a second analytics engine.

## Workstream 5 — Season pre-commit review

Inspect Complete Season UX and add a lightweight review/confirmation before irreversible season completion if an equivalent safeguard is still absent.

## Workstream 6 — final v0.95 polish/regression

Accessibility/focus, responsive consistency, typography/contrast, feedback/transitions, performance, persistence/navigation/gameplay regression and final documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.
