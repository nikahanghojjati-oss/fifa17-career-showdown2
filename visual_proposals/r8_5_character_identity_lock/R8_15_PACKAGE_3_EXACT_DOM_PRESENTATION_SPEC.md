# R8.15 Package 3 Exact-DOM Presentation Specification

Status: ACTIVE VISUAL PROPOSAL / NON-OPERATIONAL / R10 AUTHORITY RECONCILED / NO SEQUENCE CREDIT BY ITSELF

Runtime authority: `1d0c9f9d6542cd020a4aae53998cb6daeba380e4` / `1.9.1-r10`.

Visual proposal branch: `visual/r8-5-approved-character-identity-lock`.

Control authority: `R8_14_REASONING_CONTROL_RECOVERY.json`.

This specification advances UI/UX readiness for Package 3 without pretending the A01/A02 character gate is complete. It is presentation-only. It does not modify `main`, runtime behavior, routing, scoring, storage, Firebase, provider authority, session authority, privacy rules, or billing.

## 1. Reasoning-first purpose

Package 3 is the competitive season loop. Its visual job is to make the user understand, at a glance:

1. Where the season currently is.
2. Which manager is allowed to act.
3. Which information is private versus shared.
4. Which state is provisional, locked, published, committed, acknowledged, or complete.
5. What the next real action is.

The presentation must never invent an action or state that the current runtime does not own.

Image generation is not required to implement this specification. CSS, DOM hierarchy, typography, borders, state color, spacing, and existing controls are sufficient for the current Package 3 pass.

## 2. R10 runtime surfaces and exact authority

### P3.1 Showdown Home / Dashboard

Primary live controls relevant to the season loop:

- `#seasonPrimaryAction`
- `#dashboardTransferStatus`
- manager/club scoreboard and current-season metadata already rendered by the dashboard
- `#remoteJoiningButton`
- real Back control

Shared Transfer Challenge decorates the same primary season action rather than creating a second dashboard. Depending on provider state it becomes the entry point for the current shared phase.

Presentation rule:

- Make the current season action the strongest CTA on the dashboard.
- Put the current shared-phase status immediately adjacent to the CTA hierarchy, never in a detached decorative card.
- Do not duplicate or replace `#seasonPrimaryAction` with visual-only controls.
- The overall Showdown score, current season number, permanent clubs and manager identities stay higher information priority than atmosphere art.
- Any future character crop must sit behind the scoreboard/action shell and disappear before those controls move.

### P3.2 Transfer Challenge

Live screen: `#transferChallenge`.

Primary live hierarchy:

- `#transferChallengeTitle`
- `.transferHero`
- `#transferPhaseStatus`
- `#transferTimerDisplay`
- `.transferTimerActions`
- `#startTransferTimer`
- `#endTransferTimer`
- `.transferManagersGrid`
- `.transferGuessesGrid`
- `#completeTransferChallenge`
- `#transferChallengeResults`
- `#continueFromTransfers`
- `#transferChallengeError`
- real Back control

Shared runtime presentation phases:

- `NOT_STARTED`
- `WINDOW_OPEN`
- `GUESS_ENTRY`
- `SIGNING_ENTRY`
- `COMPLETED`

The runtime also owns ordered historical replay and sets presentation state through `data-transfer-phase` plus `data-shared-transfer-replay` when appropriate.

#### Visual composition

Use one centered competitive shell with three vertical priority bands:

1. Phase authority band: title, phase/status, timer and short rules.
2. Manager work band: the real signing or guess cards for the phase currently owned by runtime.
3. Action/verdict band: lock/action controls, error state, verdict cards and continuation.

Do not show inactive phase forms merely to make the screen look fuller. Runtime visibility remains authoritative.

The two manager cards should read as mirrored competitors, not unrelated forms. Keep the current left/right identity convention. Use restrained gold differentiation for the active/local side only when runtime ownership makes that distinction unambiguous. Do not imply that a hidden opponent form is available.

#### Shared privacy states

`GUESS_ENTRY` and `SIGNING_ENTRY` are not ordinary two-column forms. Shared production intentionally exposes only the local manager's permitted input while the opponent payload remains private.

Presentation must therefore:

- visually label the visible form as `YOUR PRIVATE ENTRY` or equivalent through existing runtime copy, not invented data;
- keep hidden opponent content absent rather than blurred or fake-redacted;
- make locked state visually distinct from editable state without changing disabled semantics;
- preserve the runtime privacy note and lock summary;
- keep errors next to the actionable phase rather than at the distant bottom of the viewport.

#### Timer

The 15-minute clock is operational authority, not decoration.

- `#transferTimerDisplay` remains the visual anchor during `WINDOW_OPEN`.
- `SYNC` and `REPLAY` are valid runtime states and must remain readable.
- No animated ring, fake countdown arc, or visual timer may disagree with the real text clock.
- Reduced-motion mode removes decorative timer animation while keeping the clock readable.

#### Completed verdict state

When `COMPLETED`, the two real verdict cards become the primary content. `KEEP` and `RELEASE` need semantic differentiation that remains legible without color alone.

Do not create celebratory art here. This is a decision/verdict screen, not the season payoff.

### P3.3 Season Entry

Live screen: `#seasonEntry`.

Static live controls:

- `#seasonEntryTitle`
- `.seasonEntryHint`
- `.seasonEntryGrid`
- two `.seasonResultCard` containers
- `#p1LeaguePosition`, `#p1LeaguePoints`, `#p1LeagueGoals`
- `#p1DomesticCup`, `#p1ChampionsLeague`, `#p1TopScorer`, `#p1TopAssist`
- equivalent `p2` controls
- `#seasonEntryError`
- `#completeSeason`
- real Back control

Local Season Engine dynamically creates `#seasonReviewPanel` and uses review-before-save rather than immediate mutation.

Shared Season Results reuses this same surface and may set `#seasonEntry[data-shared-season-results="entry"]` or `review` presentation mode.

#### Local mode

The two manager cards remain symmetrical and simultaneously editable because local authority owns both sides.

Visual hierarchy:

1. Season title and concise scoring rule reminder.
2. Two equal manager result cards.
3. Required league values before optional achievement checks.
4. Inline/form error.
5. `REVIEW SEASON` as primary CTA.

The achievement pair caps must remain understandable: 100 points and 100 goals share one performance bonus; Top Scorer and Top Assist share one awards bonus. Presentation may clarify grouping visually but may not alter the scoring rule.

#### Shared mode

Shared production changes the meaning of the screen materially:

- each manager enters only their own result;
- the opponent card is hidden while private;
- the local result enters review before publication;
- publication is immutable for that manager/season;
- canonical local Save is not modified at publication time;
- opponent result appears only after both managers publish.

Therefore shared mode should not look like a disabled version of the local two-manager form. The visible local card should expand to a confident centered width while the hidden opponent side consumes no layout space. A compact identity/club rail can preserve rivalry context without exposing opponent values.

### P3.4 Shared Season Results review/publication

Dynamic live surface: `#seasonReviewPanel` inside `#seasonEntry`.

Dynamic live hierarchy:

- `.seasonReviewStatus`
- `#seasonReviewStatusMeta`
- `#seasonReviewHeading`
- `.seasonReviewIntro`
- `#seasonReviewResult`
- `#seasonReviewOne`
- `#seasonReviewTwo`
- `.seasonReviewOverall`
- `.seasonReviewWarning`
- `#seasonReviewError`
- `.seasonReviewActions`
- `#confirmSeasonCompletion`
- `#editSeasonResults`

Shared runtime states on this shell include:

- review own unpublished result;
- own result published, waiting for rival;
- both results published / `RESULTS_READY`;
- opponent result revealed only after provider authority permits it.

Presentation rule:

- Status must be above the result cards, not hidden in footer copy.
- `NOT PUBLISHED YET`, `PUBLISHED · WAITING FOR YOUR RIVAL`, and `RESULTS READY · BOTH PRIVATE SIDES REVEALED` need visibly different state treatments.
- The immutable-publication warning stays visually close to the publish CTA.
- Waiting state should feel intentionally complete for the local user, not like a broken disabled form.
- When both results are ready, restore a balanced two-manager comparison grid.
- Do not show the local projected overall score as if it were shared authoritative scoring when shared runtime intentionally hides that authority.

### P3.5 Shared Season Commit

R10 does not create a separate screen. It injects into the existing `#seasonReviewPanel`:

- `#sharedSeasonCommitStatus`
- `#sharedSeasonCommitAction`

Runtime authority is explicit:

- both Shared Season Results must be ready first;
- only the confirmed coordinator may create the immutable shared season snapshot;
- after commit, both managers must acknowledge;
- after both acknowledgements, phase becomes `ACKNOWLEDGED`;
- canonical local Save mutation and authoritative scoring remain separate later capabilities.

Presentation rule:

Season Commit must appear as a second-stage authority band below the completed Results comparison, visually separated from publication actions.

State treatments:

- coordinator ready: gold authority accent, active `COMMIT SHARED SEASON`;
- non-coordinator waiting: neutral locked accent, `WAITING FOR COORDINATOR` visibly disabled;
- committed / acknowledgement needed: clear transition from commit authority to two-party acknowledgement;
- own acknowledged / waiting for rival: completed local state plus waiting state;
- both acknowledged: terminal success treatment without implying that scoring has already happened.

Do not visually merge `PUBLISH MY SEASON RESULT` and `COMMIT SHARED SEASON`. They are different irreversible operations owned by different runtime stages.

### P3.6 Season Summary

Live screen: `#seasonSummary`.

Primary live hierarchy:

- `#seasonSummaryTitle`
- `#seasonSummaryResult`
- `.seasonSummaryGrid`
- `#seasonSummaryOne`
- `#seasonSummaryTwo`
- `.overallScoreBox`
- `#seasonOverallScore`
- `#nextSeasonAction`
- real Showdown Home / Back action

This is the payoff surface. It may become the eventual gate for A05/A06, but only after exact character-safe-zone proof shows celebration/resolve art adds value without covering result data.

Presentation hierarchy:

1. Winner/draw result statement.
2. Both manager score-breakdown cards.
3. Overall Showdown score.
4. Next-season action or terminal navigation.

Do not put character art between the user and the score breakdown. On desktop, future A05/A06 may occupy outer rails/background only. On tablet, crop or omit. On mobile, omit large figures.

### P3.7 Tiebreak

R10 authority finding: there is no dedicated tiebreak screen or dedicated tiebreak DOM in current `index.html`.

Current local `determineSeasonWinner()` can return `draw`; it only falls through to league position and league points when both scoring totals are zero. The future canonical-scoring capability remains a separate development concern.

Visual decision:

- Do not invent a final Tiebreak screen in this visual lane.
- Do not invent controls, stats, provider actions or persistence behavior.
- Do not generate A03/A04 because of a hypothetical tiebreak composition.
- Reserve the black/gold Package 3 vocabulary and re-resolve exact DOM when the development lane ships real tiebreak/canonical-scoring authority.

This is a deliberate DEFERRED state, not missing visual work.

## 3. Package 3 black/gold presentation language

Reuse the R8.10 presentation tokens rather than creating a second theme.

- Background: black/charcoal with restrained stadium-light atmosphere created procedurally.
- Primary accent: warm metallic gold.
- Text: cream/off-white with muted warm gray secondary text.
- Success, warning and danger remain semantic and must not all collapse into gold.
- Manager-one/manager-two differentiation uses border/rail treatment, not saturated team colors.
- Controls retain visible focus outlines.
- Real disabled controls must still look disabled.
- Real errors remain high-contrast and adjacent to the relevant task.

## 4. Layout rules

Desktop wide `>=1180px`:

- competitive two-manager grids may use two columns;
- phase/status bands remain centered above them;
- optional future art occupies only outer/background rails;
- no art is needed for the current CSS prototype.

Tablet `760-1179px`:

- keep two columns only when inputs remain comfortably readable;
- otherwise collapse manager cards before shrinking input hit targets;
- large character art is cropped or omitted before controls move.

Mobile `<760px`:

- one-column task flow;
- status first, current editable card second, primary action third;
- no large character masters;
- no horizontal scrolling for signing/guess rows; fields stack as needed;
- verdict and result comparison becomes sequential cards.

## 5. Accessibility and interaction protection

- Do not remove or suppress existing `aria-live`, `role=status`, `role=timer` or `aria-disabled` semantics.
- Focus-visible treatment must remain at least as strong as the R8.10 Package 1/2 prototype.
- Gold cannot be the sole signifier of active/complete/error state.
- Disabled shared controls remain actual disabled controls; do not create clickable visual wrappers.
- Decorative pseudo-elements and any future `.r8Package3ArtLayer` use `pointer-events:none`.
- Reduced-motion preference disables decorative transitions and pulses, never operational state changes.

## 6. Character and raster asset gates

Current gate truth:

- A01 Nik core thinking hero: still `REFERENCE_READY`; candidate missing.
- A02 Daniel core pointing hero: locked until A01 owner freeze.
- A03 Nik focused tactical: CLOSED.
- A04 Daniel focused tactical: CLOSED.
- A05 Nik celebration/resolve: CLOSED.
- A06 Daniel celebration/resolve: CLOSED.
- Non-character Package 3 raster generation: CLOSED.

A03/A04 may open only after:

1. A01/A02 are frozen,
2. an exact live Transfer/Tiebreak composition proves the core masters cannot satisfy the need,
3. safe zones are documented,
4. the resulting focused tactical masters have mapped reuse destinations.

A05/A06 may open only after Season Summary safe-zone composition proves a payoff asset is useful. A generated celebration is not justified merely because the screen is celebratory.

## 7. Prototype implementation boundary

`prototype/r8-package-3-presentation.css` is the presentation companion to this file.

It may:

- restyle existing Package 3 selectors;
- react to runtime-owned data attributes and disabled/hidden states;
- improve responsive flow;
- establish empty future-art hooks.

It may not:

- synthesize missing runtime phases;
- unhide provider-private content;
- change button handlers;
- add fake data;
- change scoring;
- change Save mutation;
- change Firebase/provider behavior;
- alter session/role authority;
- link itself into production.

## 8. Acceptance checklist

Package 3 presentation preparation passes only when:

- current r10 selectors are used rather than replacement mock screens;
- Transfer Challenge five-phase and replay states remain runtime-authoritative;
- private guesses/signings remain private;
- Shared Season Results own-only entry and waiting states remain truthful;
- Season Commit coordinator/acknowledgement authority remains unmistakable;
- local and shared Season Review are not visually conflated;
- Season Summary keeps score/result data above decoration;
- Tiebreak remains deferred until a real DOM exists;
- mobile needs no large character art;
- no production file is linked or modified;
- no image generation is required to achieve the current presentation pass.

## 9. Progress accounting

This file increases design readiness and corrects the visual lane's understanding of r9/r10 dynamic state surfaces, but it does not by itself raise the official 56% visual production score. The reason is deliberate: the current sequenced A01/A02 freeze gate remains open, Package 3 has not yet received full responsive/obstruction QA, and no final implementation package has consumed this specification.

Meaningful progress is recorded as: `PACKAGE_3_R10_EXACT_DOM_PRESENTATION_SPEC_READY / SEQUENCED_COMPLETION_NOT_CLAIMED`.

## 10. Next bounded visual action

Build and inspect the proposal-only Package 3 CSS against the exact r10 selectors in this specification. No character generation. After that, return to the A01 execution gate only when an edit-capable path can prove it is operating on the exact Reference C source image rather than reconstructing a character from prose.
