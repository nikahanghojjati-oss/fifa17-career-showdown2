# R8.8 Live Runtime Visual Map

Status: COMPLETE MAPPING BASELINE / PROPOSAL ONLY / NON-OPERATIONAL

Source authority at mapping seal:

- live `main`: `1d0c9f9d6542cd020a4aae53998cb6daeba380e4`
- asset revision: `1.9.1-r10`
- live integration boundary: Shared Season Commit r10
- proposal branch: `visual/r8-5-approved-character-identity-lock`

This map exists so visual production follows the actual product instead of generating attractive but unusable webpage concepts. Before implementation, the master developer must re-resolve live `main` and diff any runtime changes after this pin.

## Product boundaries that visual work must preserve

1. Exactly two managers.
2. Pairing precedes shared league / club setup in Shared Showdown.
3. One shared league is selected from the canonical five-league wheel.
4. Two club assignments are permanent for the full Showdown once revealed.
5. Career length is 1, 3, 5 or 10 seasons.
6. Local Save Library remains local authority. Visual code must not mutate storage semantics.
7. Remote Joining / Connected Rivalry / Shared Setup use Firebase Spark-only services and must retain the permanent zero-dollar boundary.
8. Shared mode reuses canonical local screens where production adapters already do so. Do not invent parallel replacement pages.
9. Official club badges are not required by this proposal. Preserve the existing original/procedural club identity system unless the master developer approves a separate legal/brand change.
10. Final art must be non-interactive and stay below real controls. `pointer-events:none` for decorative character/final-art layers.

## Runtime surface map

### S01 Startup / Loading

Authority: `#loadingScreen`.

Live content includes CM17 identity, `THE RIVALRY STARTS HERE`, `CAREER MODE SHOWDOWN 17`, `TWO MANAGERS · ONE LEGACY`, progress status, local-save note and the current licensed Marco Reus startup photograph.

Visual treatment: cinematic identity surface. Candidate final proposal can use approved CM17 duo art and crown/trophy language, but must not remove startup status semantics. If Reus remains, preserve required credit/license treatment.

New character art: none beyond reusable core pair.

### S02 Home / Main Menu

Authority: `#mainMenu` plus `menuExperience.js`.

Primary real controls: Continue Career, New Showdown, Legacy, Statistics, Rule Book, Save Library; FIFA 17 media tile and selector/player; bottom product strip; active-season status.

Visual treatment: flagship landing surface. This is the highest-priority composition screen.

New character art: reuse Nik core + Daniel core. No unique Home-only face generation.

### S03 Create Showdown

Authority: `#createShowdown`.

Real controls: Showdown Name, Manager 1, Manager 2, number of rounds 1/3/5/10, Start Showdown, Back. Shared-mode entry may decorate/route this flow but should not replace these canonical semantics.

Visual treatment: central clean form with mirrored manager framing and strong safe zones.

New character art: reuse core pair.

### S04 Remote Joining / Private Pairing

Authority: `#sparkRemoteJoiningOverlay` and remote joining runtime.

Important modes: provider/setup unavailable, signed out, signed in idle, create private session, join by invite code, waiting for second manager, paired/active, reconnect/error states. Surface communicates that local saves remain local and the zero-dollar ceiling remains intact.

Visual treatment: modal / connected-session system, not a cinematic hero page.

New character art: none. Small crops/avatar chips may reuse approved core portraits.

### S05 Shared Career Length

Authority: shared journey UI / shared setup presentation.

Real choice: 1/3/5/10 seasons.

Visual treatment: lightweight setup step with product framing; no reason for bespoke character pose.

New character art: none; optional reuse of small core crops.

### S06 Shared Review & Confirm

Authority: production Shared Showdown setup state.

Important states: selected season length, each manager confirmation pending/confirmed, Start Career locked until both confirmations are authoritative.

Visual treatment: two-manager confirmation cards, clear lock state and coordinator/rival distinction.

New character art: none; reuse core head crops only if they improve orientation.

### S07 League Wheel

Authority: `#leagueWheelScreen` plus `productionSharedShowdownPresentation.js` in Shared mode.

Canonical leagues: Premier League, LaLiga, Bundesliga, Serie A, Ligue 1.

Important modes: local spin; shared pair/session required; host/coordinator can spin; rival waiting; authoritative league revealed/locked; Continue to Club Packs. The real `SPIN WHEEL` control remains below the wheel.

Visual treatment: central wheel is dominant; manager art lives in side safe zones.

New character art: Daniel core pointing + Nik core thinking are sufficient. No new expression required.

### S08 Club Assignment / Sealed Club Packs

Authority: `#clubWheelScreen` plus Shared Showdown presentation.

Canonical reveal progression: `01 DRAW`, `02 PACK 1`, `03 PACK 2`, `04 VS`, `05 LOCK`.

Important modes: sealed, pack one reveal, pack two reveal, versus confirmation, permanent club lock, shared season-choice continuation.

Visual treatment: real DOM pack cards remain center authority; character art must never cover pack state or action controls.

New character art: default reuse core pair. Two interaction poses are CONDITIONAL only if compositing proves core poses cannot frame pack interaction naturally without reducing clarity.

### S09 Shared Career Start

Authority: `#productionSharedCareerStartOverlay`.

Real content: own assigned club, rival assigned club, league, Showdown length, own acknowledgement, rival acknowledgement, waiting and both-ready states.

Visual treatment: compact confirmation modal using the existing remote-joining visual language.

New character art: none.

### S10 Career Dashboard / Showdown Home

Authority: `#dashboard`.

Important content: current season, manager identities/clubs, score/status, club assignments, season progression, transfer challenge route, finish-showdown route when available. Shared adapters can decorate the primary route/status.

Visual treatment: data/navigation first. Character presence should be small and reusable, not full-page portrait competition.

New character art: none; reuse core portrait crops.

### S11 Transfer Challenge

Authority: `#transferChallenge` plus `productionSharedTransferChallenge.js` in shared mode.

Core product rule: 15-minute hard-lock window, maximum three signings per manager, opponent guesses, locked progression and completion state.

Shared progression includes NOT_STARTED, WINDOW_OPEN, GUESS_ENTRY, SIGNING_ENTRY and COMPLETED, with deterministic replay/witness presentation where required.

Visual treatment: high-focus tactical workspace. Timer, entry fields and lock states outrank decorative art.

New character art: one focused/tactical asset per manager.

### S12 Season Entry / Local Results

Authority: `#seasonEntry` local mode.

Local form captures the season result fields used by the current local flow and routes to completion/review.

Visual treatment: form clarity first.

New character art: none; tiny core crops optional.

### S13 Shared Season Results / Review

Authority: the same `#seasonEntry` DOM reused by `productionSharedSeasonResults.js`.

Required shared fields include League Position, League Points, League Goals, Domestic Cup, Champions League, Top Scorer and Top Assist.

Important modes: enter own result, review own result before publish, published/waiting for rival, both results ready/revealed.

Visual treatment: do not create a replacement screen. Shared mode must visually transform the existing Season Entry surface while retaining real form/review controls.

New character art: none; reuse compact core crops.

### S14 Shared Season Commit

Authority: Shared Season Results review surface plus `productionSharedSeasonCommit.js`.

Important modes: both results ready and coordinator can commit; non-coordinator waiting; immutable shared result snapshot committed; each manager acknowledgement; both acknowledged.

Visual treatment: state badge/action hierarchy on the existing review surface.

New character art: none.

### S15 Season Summary

Authority: `#seasonSummary`.

Purpose: cinematic payoff after a completed season, with summary data and next-step action.

Visual treatment: strongest post-season emotional surface.

New character art: one celebration/positive-resolution asset per manager. Reuse on Trophy Room or completed-Legacy moments where useful.

### S16 Tiebreak

Authority: `#tiebreakScreen`.

Purpose: resolve tied scoring under the project’s deterministic tiebreak rules.

Visual treatment: dramatic but concise decision state.

New character art: no unique asset. Reuse focused assets from Transfer Challenge or core portraits.

### S17 Statistics & Awards

Authority: `#analyticsDashboard` generated by `statistics.js`.

Content: metrics, season selector, manager comparison/bar chart, club trend/line chart, comparison table, detail modal, export/report and narrative.

Visual treatment: dashboard/data visualization. Avoid decorative faces that compete with charts.

New character art: none.

### S18 Trophy Room

Authority: Trophy Room overlay/module.

Content: honours and trophy presentation.

Visual treatment: trophy-first black/gold display; celebration character assets may be reused if safe.

New character art: no Trophy-Room-specific face. Decorative trophy/cabinet final art may be produced separately if the current procedural/CSS presentation cannot reach R8.5 quality.

### S19 Legacy

Authority: `#legacyOverlay` / `legacy.js`.

Content: total Showdowns, win rate, best league finish, biggest win, league aggregates, best records, rivalries and recent Showdowns.

Visual treatment: historical archive / prestige wall.

New character art: none; reuse core identity chips if useful.

### S20 Rule Book

Authority: `#ruleBookOverlay`.

Tabs: Rules, Scoring, Transfer Challenge, FAQ.

Visual treatment: clean editorial reference surface.

New character art: none.

### S21 Save Library & Settings

Authority: `#settingsOverlay`, `#saveLibraryProductPanel`, `settings.js`, `saveLibraryUI.js`.

Save Library states: ready, compatibility, empty, blocked. Ready mode includes local Saves, Local Profiles, active Save, progress/status, league/clubs/last-played facts, switch/delete/continue, sorting, profile labels and explicit identity links. Settings includes General, Scoring, Data and About.

Visual treatment: product utility UI. Preserve readability and confirmation hierarchy.

New character art: none.

### S22 Atomic Restore / Recovery

Authority: restore/recovery UI mounted through settings/data surfaces.

Important modes: backup inspection, exact-browser snapshot, candidate selection, warnings/conflicts, explicit apply, critical recovery boundaries.

Visual treatment: safety-first utility surface. No decorative character layer.

New character art: none.

### S23 Connected Rivalry

Authority: `sparkConnectedRivalry.js`, mounted inside Settings.

Important modes include ready/unavailable/signed out, pairing ID prefilled, attached, refresh, publish local projection, remote-to-local preview, explicit backup+apply confirmation, stale conflict, tombstone and recovery states.

Visual treatment: technical private-connection panel embedded in Settings, not a new cinematic page.

New character art: none.

### S24 Global Notices / Error / Empty / Waiting States

Authority: runtime notice/status surfaces across app.

Visual treatment: reusable status system for success/error/waiting/locked/offline/reconnect conditions. Must work on top of every screen without being obscured by final art.

New character art: none.

## What is NOT a separate visual page

Shared League Wheel, Shared Club Assignment, Shared Season Results and Shared Season Commit are stateful adaptations of canonical DOM surfaces. Do not generate separate full-page backgrounds for them unless the implementation requires a state overlay that can safely sit below controls.

Connected Rivalry, Save Library, Restore and About are settings/product surfaces. Do not turn them into cinematic character posters.

## Visual composition hierarchy

1. Real controls and status text.
2. Readable primary content/data.
3. Approved manager identity art where it adds orientation or emotion.
4. R8.5 black/gold atmosphere and final-art layer.
5. Decorative stadium/crown/trophy textures.

Decorative art must lose before usability. On narrower screens, fade, crop or omit character art rather than cover controls.

## Mirrored two-manager variants

The visual system must support both Daniel-left/Nik-right and Nik-left/Daniel-right when a screen’s runtime role/order needs it. Mirroring is a composition choice, not permission to regenerate or horizontally flip text/logos embedded inside character assets. Character masters should therefore be isolated from UI typography.

## Mapping conclusion

24 primary or nested user-facing visual surfaces/states were mapped. Only a small subset needs bespoke character generation. The current product can be covered by six required character assets, with at most two conditional Club Pack interaction variants. Most remaining UI quality comes from DOM/CSS composition, procedural identity graphics, icons, spacing, typography, responsive rules and final-art overlays rather than additional faces.

Next authority: `R8_8_ASSET_REQUIREMENTS_MATRIX.md`.