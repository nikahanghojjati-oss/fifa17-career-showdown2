# Career Mode Showdown — R8 Complete Product Visual Proposal

Status: ACTIVE LIVING VISUAL AUTHORITY

Owner intent: complete-product UI/UX proposal covering the entire Career Mode Showdown product, not only Home and not only current static routes.

Controlling visual developer: GPT-5.6 Sol

Current source anchor at proposal creation:

- repository: `nikahanghojjati-oss/fifa17-career-showdown2`
- production main: `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`
- application: `v1.9.1`
- production runtime: `1.9.1-r12`
- visual implementation PR: `#238`
- visual implementation branch: `developer/r8-25-home-global-first-slice-r12`
- current product MDP at source anchor: `70.30/100`
- current SSJR at source anchor: `0/100`

This file is a living proposal until the main product reaches its final development checkpoint. At that checkpoint, the final-product reconciliation gate in this document is mandatory. No visual developer may call R8 complete merely because the screens listed here have been styled. The current live product must first be re-inventoried and reconciled against this proposal.

---

## 1. Product-wide visual objective

Career Mode Showdown should feel like a purpose-built football rivalry companion from the FIFA 17 era without copying proprietary EA screens, fonts, crests, soundtrack files, menu audio, or other protected assets.

The product must read as one coherent system across local Career Mode, Save Library, connected two-manager play, Remote Joining, statistics, history, trophies, backup/recovery, settings, and rules.

The visual identity is:

- black and charcoal foundation;
- warm metallic gold as the primary accent;
- white and pale neutral copy for high legibility;
- thin geometric framing, angled cuts, restrained glow, stadium-light atmosphere and subtle pitch/grid motifs;
- confident condensed-looking typography using only rights-safe/system font stacks;
- strong hierarchy and large numeric information where competition state matters;
- original procedural club identity and rights-safe symbolic marks;
- deliberate use of the approved Nik and Daniel character masters only when they increase emotional or competitive clarity;
- dense administrative or safety surfaces remain cleaner and more technical instead of being filled with decorative character artwork.

The visual layer is presentation only. It must never become a gameplay, scoring, storage, Firebase, identity, pairing, Remote Joining, Save Library, routing, or billing authority.

---

## 2. Non-negotiable product locks

R8 must preserve all current product authorities and permanent constraints.

### Product and gameplay

- Exactly two managers per Showdown.
- Both managers use one shared league and different permanent clubs.
- Supported Showdown lengths remain 1, 3, 5, or 10 seasons.
- Champions League is +5.
- League title is +3.
- Main domestic cup is +1.
- 100 league points and/or 100 league goals share one maximum +1 performance bonus.
- Top Scorer and/or Top Assist share one maximum +1 individual-awards bonus.
- Maximum Season score remains 11.
- Only a 0–0 Season uses league position and then league points as tiebreakers.
- Equal nonzero Season scores remain a draw.
- Club assignment remains permanent for the Showdown.
- Transfer Challenge semantics remain authoritative.

### Architecture

- `js/screens.js` remains navigation/history authority.
- `js/storage.js` and the established Save Library runtime remain canonical local persistence authorities.
- Statistics remain derived through the established analytics path.
- Critical transitions retain save-before-presentation / rollback safety.
- Shared play continues to reuse canonical product screens where the runtime already does so.
- R8 must not duplicate a second scoring engine, second navigation system, second save registry, or second connected-play protocol.

### Cost and provider

- Zero-dollar operation is permanent.
- Firebase remains Spark only.
- Billing remains off.
- No Blaze upgrade.
- No Cloud Functions.
- No Cloud Run.
- No visual-state Firestore persistence.
- No artwork-specific provider fields or network protocol.

### Rights and assets

- No official club crests are introduced by R8.
- No proprietary FIFA/EA fonts are bundled.
- No copied menu audio or soundtrack files.
- No downloaded copyrighted presentation assets are introduced merely for visual polish.
- Existing protected/loading media remain governed by their existing product authority.

---

## 3. Complete current surface inventory

The current product has thirteen routed screens plus substantial non-route surfaces. R8 coverage means both groups.

### Routed screens

1. `mainMenu` — Home
2. `createShowdown` — Create Showdown
3. `leagueWheelScreen` — League Wheel
4. `clubWheelScreen` — Club Assignment / pack reveal / confirmation
5. `dashboard` — Showdown Home
6. `transferChallenge` — Transfer Challenge
7. `seasonEntry` — Season Results entry and shared review states
8. `seasonSummary` — Season Summary
9. `statistics` — current Rivalry Statistics
10. `careerStatistics` — longitudinal Career Statistics
11. `trophyRoom` — Trophy Room
12. `legacy` — Legacy archive and data management
13. `ruleBook` — Rule Book

### Non-route product surfaces that must receive R8 coverage

- startup/loading presentation;
- global application header and season indicator;
- runtime notices and dismiss focus state;
- menu media/soundtrack card;
- Settings dialog;
- Save Library product panel;
- Local Profile editor and cross-Save/historical identity-linking states;
- Connected Account panel;
- Registered Device & Pairing panel;
- Connected Rivalry panel;
- Private Remote Joining overlay;
- backup export status;
- import analysis / Candidate B preview;
- Atomic Restore & Recovery / Candidate C review, conflict and apply states;
- destructive confirmation/error/recovery states;
- shared setup authority states on League Wheel and Club Assignment;
- shared Career Start state;
- shared Transfer Challenge state;
- shared Season Results publication/reveal states;
- shared Season Commit coordinator/acknowledgement states;
- Shared Canonical Scoring projection;
- Shared History Convergence projection;
- loading, empty, unavailable, stale, revoked, disconnected, offline, reconnecting, waiting-for-peer and reduced-motion variants wherever the underlying product exposes them.

Any future route or substantial overlay added by the main developer automatically becomes part of this inventory at final reconciliation.

---

## 4. Global R8 presentation system

### 4.1 Color and material hierarchy

Use three visual material levels.

Level A — primary competition surfaces:

- near-black base;
- gold framing and active accents;
- restrained radial stadium-light gradients;
- bright white competition numbers;
- optional approved character art at large widths.

Level B — information and archive surfaces:

- charcoal cards on black;
- thinner gold rules;
- reduced glow;
- more neutral information density;
- no mandatory character art.

Level C — safety, provider and data-management surfaces:

- strongest legibility and least decoration;
- clear bordered sections;
- amber/gold for warnings that are not destructive;
- reserved red only for destructive/error states;
- green/success treatment only when a state is truly confirmed;
- no background animation behind confirmation, restore, pairing, authentication, or recovery controls.

### 4.2 Typography

- Use rights-safe system stacks only.
- Screen titles: uppercase, high tracking, compact line height.
- Eyebrows/status labels: small uppercase, generous tracking.
- Competition numbers: tabular numerals where supported.
- Long technical copy: ordinary readable sans-serif proportions; do not force condensed styling into recovery or privacy text.
- Never use image-rendered text for core UI.

### 4.3 Spacing and geometry

- 44px minimum interactive target remains protected.
- Primary desktop actions should be visible without avoidable page scrolling where the current product density permits it.
- Dense tables/archive content may scroll naturally; do not shrink type below readable size to force everything above the fold.
- Angled corners and diagonal gold accents are presentation details only and must not alter hit targets.
- Content grids collapse deterministically at responsive tiers rather than overlap decorative art.

### 4.4 Interaction hierarchy

Primary action:

- gold or high-contrast light treatment;
- one obvious dominant action per decision step where possible.

Secondary action:

- dark surface with gold/neutral border.

Destructive action:

- red-accent treatment only where the underlying action is destructive;
- visually separated from ordinary progression actions.

Disabled/waiting state:

- remain readable;
- preserve visible label explaining why the action cannot proceed;
- do not rely on opacity alone.

### 4.5 Focus and keyboard

- Every native interactive control keeps a visible focus indicator.
- Gold focus ring must clear surrounding gold borders by using offset/contrast, not blend into the component.
- Runtime notice dismiss control must preserve explicit focus visibility.
- Dialog opening and closing must preserve current focus ownership/restoration behavior.
- Screen-heading focus from `js/screens.js` remains untouched.

### 4.6 Motion

Normal motion may include:

- short panel entrance;
- gold-line sweep;
- wheel/pack reveal already owned by gameplay presentation;
- restrained card lift or sheen;
- subtle stadium-atmosphere drift.

Reduced motion must:

- suppress decorative translation/scale/continuous motion;
- keep state changes immediate and understandable;
- never suppress information or delay required controls.

No R8 animation may delay provider acknowledgement, save completion, navigation authority, or error recovery.

---

## 5. Approved character-art authority

Current frozen masters:

### A01 — Nik

- ID: `A01_NIK_CORE_THINKING_HERO`
- repository target: `assets/visual/r8/a01-nik-core-thinking-hero.png`
- SHA-256: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`
- dimensions: 1086 × 1448 RGBA

### A02 — Daniel

- ID: `A02_DANIEL_CORE_POINTING_HERO`
- repository target: `assets/visual/r8/a02-daniel-core-pointing-hero.png`
- SHA-256: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`
- dimensions: 1086 × 1448 RGBA

These are immutable presentation masters. Do not regenerate, recompress, resize in place, or silently replace the authoritative files.

### Current generation decision

Image generation remains CLOSED.

A03–A06 are not automatically required merely because the complete proposal covers more screens. Before reopening image generation, an integrated real screen must demonstrate a specific unsolved visual role that cannot be satisfied by:

- A01/A02 crop;
- CSS masking;
- safe mirroring where identity remains natural;
- responsive omission;
- procedural CSS/SVG atmosphere;
- original non-character icons;
- existing rights-safe visual identity;
- or a character-free layout.

If such a need is proven, GPT-5.6 must create a bounded pre-generation brief defining exact screen, role, pose, expression, crop, background, safe zones, output dimensions and acceptance test before any image is generated.

---

## 6. Responsive composition contract

### Wide desktop — 1280px and above

- Full R8 atmosphere allowed.
- A01/A02 may appear on selected emotional/competitive screens.
- Content stays in a central interaction-safe zone.
- Decorative characters cannot overlap controls or readable state.

### Reduced wide band — 1180px to 1279px

- Character art may remain only if reduced/cropped without crowding controls.
- Decorative layers must yield before primary content yields.

### Chromebook/tablet tier — 1179px and below

- Large character masters are omitted by default.
- Product hierarchy, controls and information remain first-class.
- No primary action may be pushed below the useful viewport because decorative art was retained.

### Mobile — approximately 390px and other narrow layouts

- Single-column progression unless an existing control requires a compact two-column pairing.
- Sticky/fixed UI only when it does not obscure content and already fits application architecture.
- Tables become scroll-safe/stacked representations where current code supports it.
- Long capability IDs/code fields remain selectable and horizontally safe.
- Decorative atmosphere is materially reduced.
- No large A01/A02 characters.

---

## 7. Screen-by-screen complete proposal

### 7.1 Startup / loading

Role: cinematic but short transition into the app.

Preserve:

- existing protected loading Reus behavior and source authority;
- startup status/local-save messaging;
- current minimum splash and reduced-motion behavior.

R8 treatment:

- black/gold frame around the existing loading visual;
- small CM17 / Career Mode Showdown identity treatment using text/CSS, not copied branding assets;
- restrained gold progress/accent line;
- no A01/A02 on loading;
- no additional network dependency;
- no new delay beyond existing startup timing.

Failure rule: if R8 CSS/module is unavailable, base startup remains functional.

### 7.2 Global header

Role: persistent orientation, not a second navigation bar.

Treatment:

- compact black top plane;
- gold brand rule/accent;
- current season indicator visually separated as a small competition-status capsule;
- avoid high vertical footprint on Chromebook/mobile;
- no decorative character art.

### 7.3 Home — `mainMenu`

Archetype: cinematic rivalry hub.

This is the first implementation slice and establishes the R8 presentation language.

Preserve six core actions:

- Continue Career;
- New Showdown;
- Legacy;
- Statistics;
- Rule Book;
- Save Library.

Preserve menu media/soundtrack tile and its Play/Mute controls.

Wide composition:

- A02 Daniel left;
- A01 Nik right;
- central safe interaction column;
- subtle stadium atmosphere and gold competition frame;
- characters are decorative, `aria-hidden`, non-focusable and pointer inert.

Responsive:

- reduce character dominance in 1180–1279;
- omit large characters <=1179;
- Home remains useful on Chromebook without scrolling caused by hero art.

State variants:

- no career / New Showdown dominant;
- resumable career / Continue dominant;
- completed/local-library states according to current Home semantics;
- media ready/unavailable;
- runtime notice visible;
- reduced motion.

### 7.4 Create Showdown — `createShowdown`

Archetype: premium pre-match setup form.

Primary content:

- Showdown Name;
- Manager 1;
- Manager 2;
- 1/3/5/10 season selection;
- Start Showdown;
- Back.

Treatment:

- character-free by default to protect form clarity;
- two-manager identity rail at top or side using text initials/procedural badges, not new raster portraits;
- season-count options styled as four compact competition tiles;
- Start Showdown is the dominant gold action;
- validation copy remains adjacent to relevant fields and cannot be swallowed by background art.

Wide layout may use a subtle split-field rivalry motif, but no A01/A02 requirement.

### 7.5 League Wheel — `leagueWheelScreen`

Archetype: high-drama selection stage.

Required league set remains the five canonical options already owned by the product.

Treatment:

- wheel remains central and fully interactable;
- gold halo/arena lighting around wheel, not over it;
- selected-league result gets a prominent locked-result band;
- `Spin Wheel` / shared host-spin action is visually dominant only while actionable;
- no overlay may cover wheel hit area.

Character policy:

- optional low-opacity/cropped A01/A02 flanks on wide desktop only if they remain entirely outside the wheel/control safe zone;
- omission is preferred at <=1279 if any crowding occurs;
- no new character assets required.

Shared variants:

- pairing/session not ready;
- host may spin;
- peer waiting for host;
- authoritative result revealed;
- continue to club packs;
- locked/no reroll.

The same wheel presentation is used in local and shared play; authority state changes copy/control treatment, not the underlying product identity.

### 7.6 Club Assignment — `clubWheelScreen`

Archetype: two-card pack reveal / versus stage.

Phases:

- sealed;
- opening;
- Manager 1 reveal;
- Manager 2 reveal;
- versus confirmation;
- season-length choice in shared setup;
- final rivalry confirmation;
- locked.

Treatment:

- two equal manager columns;
- sealed club cards use procedural/original identity, not official crests;
- reveal sequence emphasizes manager name, assigned club and permanence;
- central VS divider is decorative and cannot obscure controls;
- permanent lock note is visually unmistakable before confirmation.

Character policy:

- A01/A02 may be used as subtle manager anchors only on wide desktop if cards remain dominant;
- on Chromebook/mobile use typography and club identity only.

Shared variants must visibly distinguish:

- coordinator action;
- peer waiting;
- authoritative provider draw;
- both clubs revealed;
- 1/3/5/10 shared season choice;
- each manager confirmation;
- fully confirmed handoff.

### 7.7 Showdown Home / Dashboard — `dashboard`

Archetype: live competition command center.

Content hierarchy:

1. Showdown name / league / season status.
2. Current overall score.
3. Manager 1 vs Manager 2 cards with permanent clubs.
4. Current season/Transfer Challenge state.
5. Primary next action.
6. Private Remote Joining when eligible.
7. Last-season summary / secondary navigation.

Treatment:

- scoreboard is the hero, not character art;
- manager cards mirrored and equal in visual weight;
- current leader may receive a restrained gold edge, but do not imply winner before product authority does;
- action status chips use semantic state, not decorative guessing.

Character policy: no large A01/A02 by default. Small CSS/procedural manager badges preferred to preserve information density.

Shared state adds compact private-session/connectivity badge but must not turn Dashboard into an engineering console.

### 7.8 Transfer Challenge — `transferChallenge`

Archetype: timed competitive operations board.

Required structure:

- 15-minute shared/local timer as applicable;
- two equal manager columns;
- maximum three signings each;
- three opponent guesses each;
- start/end-early/lock actions according to authority;
- verdict state;
- Continue to Season Results;
- Back to Showdown Home.

Treatment:

- timer is the dominant urgency signal;
- avoid decorative motion around timer;
- guesses/signings use compact rows/cards with clear locked/unlocked states;
- private opponent information stays visually hidden where product authority keeps it private;
- post-completion verdict uses a clean reveal panel.

Character policy: no large A01/A02. Density and privacy clarity take priority.

State variants:

- not started;
- active countdown;
- one manager ended early / waiting;
- both approved early end;
- timeout;
- role-owned entry locked;
- private opponent data withheld;
- completed verdict;
- provider/reconnect/error state.

### 7.9 Season Results Entry / Shared Review — `seasonEntry`

Archetype: structured season scorecard.

Entry content:

- League Position;
- League Points;
- League Goals;
- Domestic Cup;
- Champions League;
- Top Scorer;
- Top Assist;
- canonical scoring hint and max 11;
- Review Season.

Treatment:

- mirrored manager cards;
- numeric fields visually grouped separately from trophy/award toggles;
- scoring hint remains compact and readable;
- checked achievement controls must remain native/accessible in semantics;
- Review is dominant only after valid input.

Shared result publication reuses this same screen and adds explicit phases:

- review own result;
- not published;
- own result published / waiting for rival;
- both managers published / opponent side revealed;
- result snapshot ready;
- coordinator commit available;
- peer waiting for coordinator;
- own acknowledgement available;
- acknowledged / waiting for rival;
- both acknowledgements complete;
- Shared Canonical Score visible;
- Shared History Converged visible.

No character art. This is the most information-sensitive competition screen.

### 7.10 Shared Canonical Score layer inside Season Review

Archetype: authoritative reconciliation result.

Presentation must show:

- `SHARED CANONICAL SCORE`;
- Manager 1 total vs Manager 2 total;
- Champions League contribution;
- League title contribution;
- Domestic Cup contribution;
- Performance Bonus;
- Awards Bonus;
- season winner or draw.

Treatment:

- visually distinct gold authority panel inserted after shared commit is terminal;
- no celebratory winner treatment before provider-authoritative scoring exists;
- draw receives equal treatment;
- underlying raw-result review remains inspectable.

### 7.11 Shared History Convergence layer inside Season Review

Archetype: read-only rivalry continuity proof.

Presentation must show:

- accepted seasons out of total;
- shared league;
- each manager fixed club;
- season W/D/L record;
- Showdown points;
- trophy attribution including League, Domestic Cup and Champions League.

Treatment:

- quieter than canonical-score panel;
- reads like a verified history ledger, not a second result screen;
- no edit affordance;
- no write-like styling.

### 7.12 Season Summary — `seasonSummary`

Archetype: post-season result ceremony.

Content:

- season result/winner;
- both manager summary cards;
- season scoring breakdown;
- overall Showdown score;
- Next Season or completion path;
- Showdown Home.

Treatment:

- strongest celebratory treatment after Home/Club reveal;
- trophy-like gold framing allowed only for actually earned outcomes;
- winner can receive elevated frame, but loser/draw remains clearly readable;
- use procedural confetti/light only if reduced-motion-safe and short-lived.

Character policy:

- optional A01/A02 wide-desktop flank treatment if it does not misrepresent emotional state; because current A01/A02 poses are neutral/strategic rather than celebration-specific, default to no large characters until real composition proves they improve the screen.

No new celebration asset is currently required.

### 7.13 Current Rivalry Statistics — `statistics`

Archetype: active-showdown analytics dashboard.

Treatment:

- dense but clean black/charcoal statistic cards;
- gold used for section headings/leader values, not every number;
- mirrored manager comparisons;
- tables and labels remain accessible without color dependence;
- no large character art;
- no heavy chart library.

If charts are present/added, use lightweight CSS/SVG/native elements and preserve data-table alternatives.

### 7.14 Career Statistics — `careerStatistics`

Archetype: longitudinal analytics hub.

Required current modes:

- empty state;
- unresolved historical identity notice;
- overall career summary;
- career table;
- exactly-two-manager comparison;
- Career Leaders.

Current career summary metrics include:

- Completed Showdowns;
- Seasons Played;
- Career Points;
- Trophies Won.

Career table columns include rank, Manager, Showdowns, Season W-D-L, Points and Trophies.

Manager Comparison may include Showdown wins/win rate, season wins, career points, average/best season score, average league points/goals, perfect seasons, signings and released signings.

Career Leaders includes current categories such as Most Showdown Wins, Most Career Points, Most Trophies, Most Season Wins, Best Avg Season Score and Best Season Score.

Treatment:

- information-first, no large character art;
- one gold-highlight metric per card group, not full-card glow;
- unresolved-identity notice must look important but not destructive;
- empty state should invite completing a Showdown without inventing data.

### 7.15 Trophy Room — `trophyRoom`

Archetype: prestige archive.

Required modes:

- empty;
- unresolved historical identity notice;
- career summary;
- career table;
- Manager Cabinets;
- trophy shelves;
- supporting achievement statistics;
- all-time records.

Manager Cabinet treatment:

- each manager gets equal cabinet geometry;
- original symbolic trophy forms for UCL/League/Cup categories rather than copied official trophies;
- total trophies and career points are primary;
- season wins, perfect seasons, 100-point seasons, 100-goal seasons and safe signings are secondary;
- achievement strip remains legible.

All-Time Records should read as plaques/record cards, not a leaderboard implying public/global ranking. These are private/local rivalry records.

No A01/A02 requirement.

### 7.16 Legacy — `legacy`

Archetype: archival timeline plus protected data-management center.

Legacy archive card treatment:

- Showdown name;
- league;
- completed date;
- manager/club matchup;
- final Showdown score;
- winner;
- total trophies;
- total Showdown points.

Expandable Season History shows season number, manager results, league position/points/goals, honours, transfer releases and season score.

Data Management treatment must visually separate:

- read-only archive browsing;
- backup export;
- import analysis;
- restore review;
- destructive delete/reset controls.

`DELETE SHOWDOWN` remains visually destructive and scoped to one archive entry.

No character art.

### 7.17 Backup export

Archetype: safe utility action.

Treatment:

- show backup format/checksum state as technical metadata;
- Export Backup is primary within its small utility section, not primary over the whole Legacy page;
- success state clearly confirms a file was prepared without implying cloud backup;
- no decoration that suggests remote synchronization.

### 7.18 Import Analysis / Candidate B

Archetype: read-only verification preview.

Treatment:

- strongly label analysis as read-only;
- visually separate verified metadata, migrations/warnings and blockers;
- success does not look like “restored”; it only means review succeeded;
- blockers use accessible alert styling.

### 7.19 Atomic Restore & Recovery / Candidate C

Archetype: highest-safety data surface.

Required states:

- no file selected;
- verifying;
- backup blocked;
- exact storage snapshot unavailable;
- backup snapshot cards for Active, Legacy, Preferences and Save Library where present;
- explicit choice selectors;
- Legacy conflict choices;
- Restore Plan Incomplete;
- Restore Plan Ready;
- Recovery Checkpoint warning;
- Apply Restore confirmation;
- Revalidating & Applying;
- stale-state rejection;
- snapshot-unavailable rejection;
- conflict/choice refresh;
- successful commit;
- critical recovery state if rollback itself needs intervention.

Treatment:

- no character art;
- no decorative continuous motion;
- strong distinction between review and Apply;
- Apply Restore does not become active until product plan authority says the plan is valid;
- critical recovery state should visually freeze ordinary controls exactly as the runtime does.

### 7.20 Rule Book — `ruleBook`

Archetype: competition handbook.

Current sections:

01 Showdown Format
02 Match Play
03 Transfer Challenge
04 Scoring
05 Tiebreak
06 Version 1.0 Scope

Treatment:

- editorial black/gold handbook;
- numbered section rail;
- scoring table gets strongest information hierarchy;
- no large character art;
- long copy remains readable at ordinary line lengths.

Important: some historical copy may lag the current connected product. R8 styles current product copy; it does not silently rewrite product authority. Final reconciliation must flag stale content to the main developer if it still conflicts with final shipped capability.

---

## 8. Settings and Save Library proposal

### 8.1 Settings shell

Archetype: modal control center.

The dialog title may become `SAVE LIBRARY & SETTINGS` when the Save Library product panel is mounted.

The shell must preserve focus trap/restore behavior and remain comfortably scrollable on mobile.

Panel order should communicate dependency rather than visual novelty.

### 8.2 Save Library

Eyebrow: Career Data
Heading: Save Library

Required state families:

- compatibility / existing legacy single-career format;
- empty library;
- blocked authority;
- ready library.

Ready library card content includes:

- stable Save identity;
- Active Save / Local Save state;
- Showdown name;
- Manager 1 vs Manager 2;
- Not Started / In Progress / Completed status;
- season progress indicator;
- League;
- Clubs;
- Last Played;
- Continue Active Showdown or Make Active;
- Delete This Save.

Treatment:

- card library, not a file explorer;
- active Save has the clearest gold edge/status chip;
- progress bar uses semantic percent and remains accessible;
- delete is visually separated/destructive;
- no official club crests required.

### 8.3 Local Profiles

Required concepts:

- stable identity distinct from display label;
- display-label editor;
- same visible names may remain separate profiles;
- explicit cross-Save/historical identity linking only when user knows the relationship.

Treatment:

- profiles are identity cards with stable short ID as secondary metadata;
- edit state is compact and focused;
- identity-linking must look deliberate/advanced and not like an automatic merge suggestion.

### 8.4 Connected Account

Eyebrow: Private Connection
Heading: Connected Account

Information grid currently includes:

- Status;
- Account;
- shortened Account ID;
- Remote Joining availability note;
- Firebase Spark / no billing infrastructure.

States:

- local only / signed out;
- connecting;
- signing in;
- bootstrapping;
- ready;
- setup incomplete;
- auth/runtime/persistence unavailable;
- signing out;
- error/cancelled.

Treatment:

- privacy-forward technical panel;
- Sign In With Google / Sign Out is obvious but secondary to local Career Mode identity;
- local availability message remains visible in failure states.

### 8.5 Registered Device & Pairing

Eyebrow: Private Rivalry
Heading: Registered Device & Pairing

Information includes:

- Device registration state;
- one-use 15-minute pairing capability;
- exactly two stable account/profile/save identities;
- explicit gameplay sync note;
- Firebase Spark / no billing.

Required states/actions:

- sign-in required;
- connected but device not registered;
- registered;
- choose local binding;
- Create Pairing Code;
- Join Private Pairing;
- Pair code open;
- Copy Pairing Code;
- paired / one-paste confirmed;
- expired/already-used/unavailable pairing;
- revoked device;
- registration/pairing error.

Treatment:

- code fields are monospace/selectable where appropriate;
- capability is visually isolated from explanatory copy;
- expiry/one-use nature is prominent;
- no QR requirement unless final product actually adds one.

### 8.6 Connected Rivalry

Eyebrow: Connected Rivalry
Heading: Observe Remote · Commit Local Explicitly

Core principle: refresh/preview is read-only; local gameplay changes only after explicit confirmed Apply through established recovery authority.

Required state families:

- not attached;
- auto-link available after pairing;
- verify auto link;
- attached;
- observe/refresh;
- remote revision/hash metadata;
- tombstone/revoked/unavailable;
- reconciliation preview ready;
- local commit/apply path;
- stale/conflict/error.

Treatment:

- technical ledger style;
- distinguish Remote Observed from Local Applied with separate columns/bands;
- never make a remote observation look like a local mutation already happened.

---

## 9. Private Remote Joining proposal

Archetype: private exact-capability session overlay.

Heading: Remote Joining
Eyebrow: Private Session · Exact Capability Only

Permanent presentation truth:

- no lobby;
- no listing;
- no public discovery;
- exact capability only;
- session services resolve on private action;
- ambiguous network outcomes preserve only the exact page-memory capability for safe retry;
- no replacement capability is generated during unresolved recovery.

Primary cards:

01 Host — Open Private Session

- Host Private Session.

02 Join — Join Exact Session

- exact session code input;
- Join Private Session.

Current Page-Memory Session panel must expose confirmed state/revision/role and only expose full copyable capability when product authority allows it.

Required visual states:

- idle;
- resolving prerequisites;
- auth required;
- device required;
- rivalry required;
- hosting unresolved;
- host open;
- joining unresolved;
- active;
- recovery pending;
- retrying exact capability;
- terminal close;
- rejected/error;
- authority context changed;
- Spark quota exhausted while local Career Mode remains available.

Treatment:

- no A01/A02;
- no cinematic animation behind secret/capability content;
- use compact lock/session iconography drawn locally with CSS/SVG;
- active and unresolved states must be impossible to confuse;
- code remains selectable and responsive-safe.

---

## 10. Shared two-manager product variants

R8 treats shared play as stateful variants of canonical screens, not a separate skin.

### Shared setup

- pairing/session gate;
- host/coordinator action availability;
- peer waiting state;
- authoritative provider result;
- no reroll;
- mirrored manager equality.

### Shared Career Start

When current/final runtime exposes shared Career Start state, presentation must clearly show:

- setup confirmed;
- each bound manager acknowledgement;
- own acknowledged / waiting for rival;
- both ready;
- no duplicate local Start authority.

### Shared Transfer Challenge

Presentation follows the same Transfer Challenge board with:

- role-owned private fields;
- opponent privacy before completion;
- shared timer/terminal state;
- provider confirmation;
- identical verdict after reveal.

### Shared Season Results

Presentation follows Section 7.9.

### Shared Season Commit

Presentation uses a clear status/action band inside review:

- Coordinator: Commit Shared Season.
- Peer: Waiting for Coordinator.
- After commit: Acknowledge Shared Season.
- Own acknowledged: Waiting for Rival.
- Both acknowledged: terminal confirmation.

### Shared Canonical Scoring

Presentation follows Section 7.10.

### Shared History Convergence

Presentation follows Section 7.11.

### Future shared capabilities

Current product MDP identifies later journey capabilities that may still change the final UI. If the main developer adds Multi-Season controls, reconnect/conflict flows, local reconciliation, final reconciliation, terminal close, physical-journey proof surfaces, or stable-release UI, they must be inventoried during final-product reconciliation and added to this proposal before final visual completion.

---

## 11. Empty, error, waiting and recovery-state system

Every major surface must use the same state grammar.

### Empty

- neutral dark card;
- short explanation;
- one appropriate next action if one exists;
- never show fake sample data as if it were real.

### Loading / busy

- keep component geometry stable;
- use explicit text plus `aria-busy` where current product does;
- avoid infinite decorative spinners where a status sentence is more informative.

### Waiting for other manager

- visually calm, not error red;
- identify who/what is awaited when current authority knows it;
- preserve refresh/polling semantics without encouraging repeated manual actions.

### Offline/provider unavailable

- distinguish connected feature unavailability from local Career Mode availability;
- local save safety message stays visible when product exposes it.

### Stale/conflict

- amber warning hierarchy;
- explain that no unverified mutation occurred where that is product truth;
- next action is retry/refresh/re-review, not destructive reset.

### Destructive error / critical recovery

- red reserved for real destructive/recovery risk;
- freeze unrelated controls when runtime does;
- no character art, glow sweep, confetti or decorative motion.

---

## 12. Asset plan by surface

| Surface | A01/A02 large art | Other raster requirement | Preferred supporting visuals |
| --- | --- | --- | --- |
| Startup | No | Existing protected loading visual only | CSS frame/light |
| Home | Yes, wide only | A01 + A02 exact masters | CSS stadium atmosphere |
| Create Showdown | No | None | CSS identity badges |
| League Wheel | Optional wide flank only | No new asset | existing wheel + CSS light |
| Club Assignment | Optional wide anchor only | No new asset | procedural cards/club identity |
| Dashboard | No | None | score panels/status badges |
| Transfer Challenge | No | None | timer, compact status icons |
| Season Entry/Review | No | None | scorecard/trophy symbols |
| Season Summary | Default no | None currently | procedural celebration/light |
| Rivalry Statistics | No | None | CSS/SVG data visualization |
| Career Statistics | No | None | CSS/SVG data visualization |
| Trophy Room | No | None | original CSS/SVG trophy symbols |
| Legacy | No | None | timeline/archive geometry |
| Rule Book | No | None | numbered editorial system |
| Settings | No | None | local icons only |
| Save Library | No | None | cards/progress/procedural IDs |
| Connected Account | No | None | local privacy/account icon |
| Pairing | No | None | local device/link icon |
| Connected Rivalry | No | None | ledger/diff/status visuals |
| Remote Joining | No | None | local lock/session icon |
| Restore/Recovery | No | None | safety/status geometry |

Current conclusion: no evidence-based need for A03–A06.

---

## 13. Accessibility acceptance

A surface is not visually accepted until:

- keyboard focus is visible on all controls;
- modal focus ownership/restoration still works;
- heading focus on route change remains intact;
- all decorative R8 layers are noninteractive and `aria-hidden` where appropriate;
- color is not the sole status indicator;
- disabled states remain understandable;
- reduced motion removes unnecessary movement;
- mobile text does not require pinch zoom;
- long IDs/codes are selectable and do not force viewport overflow;
- dense tables have a usable small-screen treatment;
- 44px minimum action targets remain protected;
- runtime notice dismiss focus is visible;
- no decorative layer intercepts pointer events.

---

## 14. Browser and viewport acceptance matrix

Minimum recurring visual QA:

- 1600 × 900 desktop;
- 1280-class desktop where available;
- 1220 × 800 reduced-wide band;
- 1024 × 768 Chromebook/tablet;
- 390 × 844 mobile at high DPR;
- normal motion;
- reduced motion.

For screen classes with long data, also test:

- empty data;
- representative populated data;
- maximum supported season/history density where fixtures exist;
- long manager/Showdown labels within product validation limits;
- error/warning states;
- shared peer/coordinator variants where applicable.

Screenshot QA must inspect actual integrated DOM, not generated whole-page concept images.

---

## 15. Implementation architecture

R8 should remain a presentation layer, not a rewrite.

Preferred implementation order:

1. Global tokens/root gate.
2. Home first slice.
3. Create Showdown.
4. League Wheel.
5. Club Assignment.
6. Dashboard.
7. Transfer Challenge.
8. Season Entry/Review/Summary including shared state layers.
9. Rivalry and Career Statistics.
10. Trophy Room.
11. Legacy plus backup/import/restore.
12. Rule Book.
13. Settings/Save Library/Connected panels.
14. Remote Joining.
15. Cross-product responsive, accessibility and state sweep.
16. Final-product reconciliation against current main.

Use exact DOM selectors and existing runtime APIs. Prefer class/data-attribute presentation hooks over HTML duplication. Do not monkeypatch navigation or product logic merely to style a state.

---

## 16. First-slice acceptance status

PR #238 is the R8 Home/global first slice.

Known validated facts before this proposal document:

- Protected initial compressed startup ceiling remains 37,500 bytes.
- Exact-head POS20 #318 measured the initial presentation at 37,494 compressed bytes on its tested head, so the protected budget itself was no longer the blocker.
- POS20 selector, operations authority and cognitive benchmark passed on that exact tested head.
- The remaining static-release code collision found by #318 was a duplicate global function name `activate`; the R8 helper was subsequently renamed to `activateR8Visual` without changing product semantics.
- The exact A01/A02 binary contract remains intentionally blocking until those frozen files exist at their required repository paths.

No older-head result may be combined with a newer candidate for merge acceptance. After each mutation, validate the new exact head.

---

## 17. Binary placement gate

Before PR #238 can become acceptance-ready, exact A01 and A02 bytes must exist at their frozen paths and reproduce their frozen SHA-256 values.

Do not bypass the deterministic contract.
Do not replace the files with optimized derivatives at the authoritative paths.
Do not regenerate them.

A prepared exact binary-drop package may be used by an environment that can commit local binary files. Verify hashes before and after repository placement.

---

## 18. Main-development synchronization rule

The main developer is still advancing the product. Visual work must not freeze the product at the current r12 inventory.

At the beginning of each substantial visual implementation slice:

1. resolve current live `main`;
2. compare it to the visual branch;
3. inspect newly added/changed routes, panels, controls and state machines;
4. reconcile nonconflicting main changes before visual acceptance;
5. update this proposal if current product reality changes the surface inventory or visual requirements;
6. never use stale generated screenshots as authority over the live DOM.

If main changes only backend/process authority with no UI impact, record that no proposal change is required. If main adds or changes visible behavior, the proposal must be updated before that area is called complete.

---

## 19. Mandatory final-product reconciliation gate

This is the owner-requested finishing rule for the visual project.

R8 proposal completion is not the same as R8 project completion.

When the main developer declares the product at its final development checkpoint, the visual developer must independently inventory the final product again.

The reconciliation must compare final main against this proposal for:

- routed screen IDs;
- modal/overlay/panel surfaces;
- shared-play states;
- connected account/device/pairing/rivalry states;
- Remote Joining states;
- Save Library/Profile states;
- backup/import/restore states;
- empty/loading/error/recovery states;
- final canonical scoring/history/reconciliation capabilities;
- global header/startup/runtime notices;
- new settings/preferences;
- navigation/back paths;
- responsive layout needs;
- accessibility/focus behavior;
- new assets or removed assets;
- rights/cost constraints.

Every final visible surface must land in exactly one outcome:

A. covered by this proposal unchanged;
B. covered but updated to match final product behavior;
C. newly added to the proposal because main introduced it;
D. intentionally excluded with a written product-authority reason.

No visible final surface may remain “unknown.”

Only after this reconciliation may the document status change from `ACTIVE LIVING VISUAL AUTHORITY` to `FINAL VISUAL PROPOSAL`.

---

## 20. Final visual project completion gate

The visual project reaches its true finishing point only when all of the following are true:

1. Main product has reached the agreed final development checkpoint.
2. Final-product reconciliation has completed with no unknown surfaces.
3. Every accepted final surface has an R8 design contract.
4. Required R8 presentation is implemented in the real DOM or explicitly deferred by owner decision.
5. A01/A02 or any later approved assets are frozen, rights-safe and hash/identity controlled.
6. No unnecessary image-generation backlog remains.
7. Wide desktop, reduced-wide, Chromebook/tablet and mobile QA is complete.
8. Reduced-motion and focus acceptance is complete.
9. Core product behavior is unchanged by decorative presentation.
10. One exact candidate head passes its required deterministic/browser acceptance without combining evidence across heads.
11. PR review threads are resolved.
12. Zero-dollar/Firebase Spark/no-billing constraints remain intact.
13. A final transition/handoff package is generated for the next developer or release integrator.

If the main product is not yet final, the visual developer may finish substantial proposal/implementation slices, but must not claim the complete visual project is finished.

---

## 21. Transition policy

A session handoff should occur only at a clean checkpoint, not merely because a proposal paragraph was written.

A clean checkpoint contains:

- current main SHA;
- exact visual branch head;
- current PR and draft/merge state;
- exact-head CI evidence and remaining failures;
- current complete proposal revision;
- frozen asset identities/hashes;
- implemented screen/surface coverage;
- unimplemented proposal sections;
- final-product reconciliation status;
- exact next implementation slice;
- blocker list;
- explicit generation gate state;
- zero-billing statement.

The final transition document must direct the successor to independently resolve live main before continuing. Historical SHAs in a handoff are orientation, never a substitute for live verification.

---

## 22. Current next visual work

While main remains at the current r12 anchor, the visual lane should proceed as follows:

1. Complete PR #238 first-slice acceptance by placing exact A01/A02 binaries, validating their hashes and rerunning one exact head after the `activateR8Visual` collision fix.
2. Keep PR #238 draft until that exact-head gate is green and integrated screenshots are reviewed.
3. Begin the next real-DOM proposal implementation slice with Create Showdown, League Wheel and Club Assignment, preserving current shared setup behavior.
4. Continue through Dashboard, Transfer Challenge and Season Results/Review/Summary.
5. Then complete information/archive surfaces and Settings/Save Library/connected surfaces.
6. Recheck live main before every substantial slice.
7. Do not generate A03–A06 unless integrated evidence opens the generation gate.
8. At final main-product checkpoint, execute Section 19 before final visual sign-off.

This sequence intentionally prioritizes building the real product rather than generating disconnected full-page concept images.
