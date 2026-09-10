# START NEXT VISUAL SESSION — R8.27 MEDIA / MASTER CLOSURE + FINAL SCREENSHOT BUILD — SAFE TRANSFER

Status: SAFE TRANSFER AFTER SUBSTANTIVE R8.26 CLOSURE MILESTONE

This is a continuation document, not a reset. Preserve all approved R8 work. Do not restart visual exploration, do not regenerate Nik or Daniel, do not patch production main from the visual branch, and do not call the proposal final before the owner screenshot-approval gate closes.

## 0. First action in the successor environment

Independently resolve current live repository state before editing:

- repository: `nikahanghojjati-oss/fifa17-career-showdown2`
- production branch: `main`
- visual working branch: `developer/r8-26-complete-proposal-asset-build-r13-work`

At this transfer checkpoint, the last verified production main was:

`ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686`

with runtime `1.9.1-r13`, MDP `77.50`, and the next known product area `MDP100 / Journey Reconnect`.

The last substantive visual head before this safe-transfer document was:

`88169e84cfc811e599b93524cc8b77f666d6eb93`

The safe-transfer commit itself necessarily advances the branch. Resolve the exact current branch head rather than assuming the hash above remains the live tip.

If main has advanced, reconcile only real user-visible product deltas. Do not discard unaffected visual work merely because the production head changed.

## 1. Owner intent that governs the remainder of R8

The owner wants a complete UI/UX and asset proposal for the whole Career Mode Showdown product, not random image generation.

The proposal is allowed to use:

- exact frozen AI character masters;
- original procedural/vector graphics;
- CSS/DOM presentation;
- rights-safe media;
- derived responsive compositions;
- screenshots as final review evidence.

The proposal must not invent product capabilities, public discovery/community systems, paid cloud dependencies, or unapproved commercial assets.

Zero-dollar remains a hard rule.

## 2. Hard finality gate added by owner

R8 is not final when internal QA is green.

Before the proposal can be called `FINAL`:

1. every built routed page must have a final screenshot;
2. every substantial non-route surface must have a final screenshot when materially distinct;
3. every materially different user-visible state/version of a page must also be represented;
4. all screenshots must come from the final reconciled proposal, not obsolete exploratory files;
5. the complete screenshot set must be presented to the owner;
6. the owner must explicitly approve the screenshots;
7. rejected screenshots must be revised and replaced;
8. only explicit approval can set the corresponding row to `Owner approved = YES`.

Authoritative inventory:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

Never collapse distinct states merely to reduce screenshot count. Never manufacture unreachable states just to increase coverage.

## 3. Frozen character authority — now physically recovered

Do not regenerate either character.

### A01 Nik

- authority ID: `A01_NIK_CORE_THINKING_HERO`
- owner-approved file: `A01_NIK_CORE_THINKING_HERO_OWNER_APPROVED_V1.png`
- dimensions: `1086 × 1448`
- mode: `RGBA`
- SHA-256: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`

### A02 Daniel

- authority ID: `A02_DANIEL_CORE_POINTING_HERO`
- owner-approved file: `A02_DANIEL_CORE_POINTING_HERO_OWNER_APPROVED_V1.png`
- dimensions: `1086 × 1448`
- mode: `RGBA`
- SHA-256: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Manager-label lock everywhere:

- Manager 1 = Daniel
- Manager 2 = Nik

The exact binaries were recovered from the Project conversation file surface, materialized without transformation, hash-checked, packaged, extracted again, and rechecked successfully.

Binary package:

`A01_A02_FROZEN_MASTERS_EXACT_R8_26.zip`

Archive SHA-256 at package creation:

`72be49e9b011dff1d880fc616a78a55778d041ce24979dfcaf2320a014d80405`

The package contains `README.md`, `SHA256SUMS.txt`, and both exact PNG masters.

A copy was uploaded to the ChatGPT personal Library under the Showdown Visual / R8.26 area. A successor should retrieve that exact package instead of rediscovering or regenerating the masters.

### Repository binary-placement boundary

The currently exposed connected GitHub writer is UTF-8 text oriented and does not provide a byte-preserving binary upload action. Therefore the exact binaries are recovered and safely packaged, but repository `assets/masters/` placement remains open.

Do not solve this by:

- recompressing the PNGs;
- rendering screenshots of them;
- converting them to JPEG/WebP as if equivalent;
- generating substitutes;
- storing base64 text and pretending it is the canonical source file.

A later environment with a byte-safe repo write route may place the exact bytes and must re-hash them after placement.

## 4. Home architecture after this session

Current proposal file:

`prototypes/01-home-reference.html`

The Home proposal now contains the compact Showdown Radio treatment instead of the older generic media placeholder.

Wide behavior:

- exact A02 Daniel left;
- exact A01 Nik right;
- black/gold stadium atmosphere;
- central interaction-safe zone;
- compact media lane below the menu tiles.

At `<=1179px`, character art remains omitted so the menu/wheel interaction area is not crowded. This is intentional, not a missing asset.

Mobile remains character-free and stacked.

The Home media lane now visibly communicates:

- `SHOWDOWN RADIO`;
- current rights-safe candidate track;
- lightweight Play / Previous treatment;
- compact progress line;
- explicit `FIFA 17 ORIGINALS` separate-provider entry;
- no default provider iframe;
- no startup media load.

Next Home work is screenshot QA with the exact master binaries available to the renderer/runtime, not a new redesign from scratch.

## 5. Production YouTube bug diagnosis

Production source studied:

`js/menuExperience.js`

The current production player uses six FIFA 17 music-video IDs plus the gameplay trailer.

The current playback architecture:

- sets a local `menuMediaPlaying` boolean when the site Play button is pressed;
- creates a YouTube iframe with `autoplay=1` and `enablejsapi=1`;
- waits for the iframe element's generic DOM `load` event;
- sends raw `playVideo` / `pauseVideo` commands with postMessage;
- projects site labels from the local boolean;
- does not use the official `YT.Player` lifecycle as playback authority.

That makes the owner's observed failure plausible: the site can move to a local PLAYING state before YouTube is actually ready/playing, so later pause/play interactions can accidentally resynchronize the two systems.

Evidence:

`evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`

## 6. Media architecture decision

R8 now has a two-lane recommendation.

### Lane A — Showdown Radio

Default Home media experience.

Use one native browser `<audio>` authority with individually verified reusable tracks.

Requirements:

- zero subscription cost;
- no account dependency;
- no autoplay on app startup;
- `preload="none"` or a measured lightweight alternative;
- source assignment after explicit user intent;
- one selected media request at a time;
- site state driven by actual audio events;
- clean Play/Pause, Previous/Next, seek and volume;
- player-level error recovery without breaking Home;
- queue data does not load every track simultaneously.

### Lane B — FIFA 17 Originals

Optional separate provider surface for the commercial originals/trailer.

If YouTube remains the provider:

- create it lazily after explicit intent;
- use the official IFrame Player API;
- wait for provider readiness;
- derive site state from actual player state changes;
- handle autoplay-blocked and provider errors;
- keep the provider player visible;
- do not strip video into a hidden audio-only stream;
- do not suppress or bypass ads.

Do not attempt to make commercial FIFA 17 recordings native merely because they are available on YouTube.

## 7. Functional Showdown Radio proof now exists

New file:

`prototypes/26-native-music-player-functional-reference.html`

This is executable proposal code, not merely a static picture.

It contains:

- a real `<audio preload="none">` element;
- a two-track rights-clean prototype queue;
- Play/Pause;
- Previous/Next;
- seek;
- volume;
- actual loading/ready/playing/buffering/paused/ended/error states;
- state projection from native media events;
- play-promise rejection handling;
- no initial source assignment;
- source assignment only after Play;
- explicit failure behavior if an Ogg candidate is unsupported;
- no FIFA 17 commercial audio in the native lane.

This proves the architecture can be implemented without a third-party music-player service. The free service is effectively the browser itself plus rights-safe audio files/sources.

## 8. Rights-clean track research completed so far

Authoritative ledger:

`evidence/NATIVE_SOUNDTRACK_RIGHTS_LEDGER_2026-09-10.md`

Two current `PROTOTYPE-ACCEPTED` candidates:

### M01 — Synth Pop with 4 on the Floor

- author: Mesostic
- source: Wikimedia Commons
- source statement: Own work
- date: 2017-08-15
- duration: 3:18
- license: CC0 1.0
- self-published: yes
- complete electronic/synth-pop track
- Commons provides an MP3 transcode
- production candidate: yes, pending owner taste approval and final packaged-file hash

Source page:

https://commons.wikimedia.org/wiki/File:Synth_pop_with_4_on_the_floor.ogg

### M02 — GameBGM

- author: Yuyuyunoyuusuke1
- source: Wikimedia Commons
- source statement: Own work
- date: 2024-09-22
- duration: approximately 3:57
- license: CC0 1.0
- self-published/original creation by uploader: yes
- production candidate: yes, pending owner taste approval and final broadly-compatible packaged-file hash

Source page:

https://commons.wikimedia.org/wiki/File:GameBGM.ogg

These two tracks are technical/rights candidates, not a declaration that they are aesthetically final. The owner must hear/approve any final soundtrack selection.

### Pixabay finding

Pixabay was investigated because its sports/electronic catalog is attractive. Its broad free license is useful, but the license summary also contains a standalone-distribution restriction. A public GitHub project can expose media files independently, so R8 placed Pixabay repo-native packaging on `HOLD` rather than interpreting that boundary aggressively.

This is a conservative project decision, not a claim that all Pixabay use is invalid.

## 9. Existing static media review sheet

`prototypes/25-native-music-player-reference.html`

It remains useful as the full visual review sheet containing:

- native expanded queue state;
- FIFA 17 Originals provider mode;
- unavailable/failure state;
- desktop/mobile responsive architecture.

Existing retained internal QA:

- desktop 1600×1200: `01a08be3-8a1c-71c1-a33c-4896cd7ef504` — PASS
- mobile 390×2400: `01a08be4-10db-7751-9912-38f553d08602` — PASS

The new functional prototype proves behavior; the existing static sheet proves expanded visual composition. Keep both until final reconciliation determines whether one can replace the other.

## 10. Existing final screenshot approval inventory

File:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

It already includes the complete current routed-screen and substantial-surface inventory through r13, including media rows 25-1 through 25-5.

Do not mark owner approval from internal QA.

Existing retained PASS evidence includes:

- Create Showdown desktop/mobile;
- Shared Season Results / r13 Multi Season desktop/exact mobile;
- Legacy desktop;
- Restore/Recovery desktop;
- Connected/private rivalry mobile after readability fix;
- Settings/Save Library mobile after readability fix;
- Showdown Radio/FIFA 17 Originals desktop/mobile.

Legacy mobile and Restore mobile had later readability fixes but their final screenshot IDs were not retained. They require fresh captures.

## 11. Mobile quality floor learned in R8 QA

Do not use microtype to make a composition fit.

Current practical floor:

- essential body/status copy around 13–14px minimum;
- metadata/labels around 11–12px minimum;
- button labels around 12px minimum;
- interactive touch targets 44px minimum.

If a design needs smaller text, prove readability in actual browser evidence rather than assuming it is acceptable.

## 12. Existing proposal architecture that must be preserved

Routed prototypes:

- `01-home-reference.html`
- `02-create-showdown-reference.html`
- `03-league-wheel-reference.html`
- `04-club-assignment-reference.html`
- `05-dashboard-reference.html`
- `06-transfer-challenge-reference.html`
- `07a-season-results-local-reference.html`
- `07b-season-results-shared-reference.html`
- `08-season-summary-reference.html`
- `09-rivalry-statistics-reference.html`
- `10-career-statistics-reference.html`
- `11-trophy-room-reference.html`
- `12-legacy-reference.html`
- `13-rule-book-reference.html`

Substantial non-route prototypes:

- `20-settings-save-library-reference.html`
- `21-connected-private-rivalry-reference.html`
- `22-restore-recovery-reference.html`
- `23-cross-product-state-system-reference.html`
- `24-startup-header-runtime-reference.html`
- `25-native-music-player-reference.html`
- `26-native-music-player-functional-reference.html`

Do not regenerate whole-page screenshots with invented UI. Work from these proposal compositions and exact live product contracts.

## 13. Asset-generation discipline

Random generation remains prohibited.

Current evidence does not justify new A03–A06 character masters.

New image generation is allowed only after a specific screen role remains unsolved and a brief defines:

- exact role;
- target dimensions/aspect ratio;
- safe zones;
- responsive eligibility;
- character identity if relevant;
- rights requirements;
- exact acceptance criteria.

If DOM/CSS/procedural SVG solves a role better, do not generate a raster merely to create more assets.

Existing original/procedural asset language includes:

- Home stadium atmosphere;
- two-manager rivalry divider;
- wheel-stage halo;
- original club-pack frame;
- generic trophy-symbol family;
- system-state symbol family.

No official club crest dependency should be added.

## 14. Next execution sequence — do this, in order

1. Resolve exact live `main` and exact visual-branch head.
2. Read `evidence/R8_26_CLOSURE_PROGRESS_MEDIA_AND_MASTERS_2026-09-10.md`, `evidence/NATIVE_SOUNDTRACK_RIGHTS_LEDGER_2026-09-10.md`, `evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`, and `implementation-map/SCREEN_ASSET_STATE_MAP.md`.
3. Retrieve `A01_A02_FROZEN_MASTERS_EXACT_R8_26.zip` from ChatGPT Library and verify both PNG SHA-256 values before any use.
4. If the environment has a genuinely byte-safe repo binary writer, place the exact PNGs at the canonical proposal master paths and re-hash. If not, preserve the binary package and continue QA in an environment that can mount the files locally; do not substitute.
5. Render Home wide with A02 Daniel left / A01 Nik right and the new compact Showdown Radio state.
6. Render Home reduced-wide / Chromebook, confirming character removal and no primary-action clipping.
7. Render Home mobile at approximately 390px, confirming character removal, stacked controls, minimum touch targets and readable media metadata.
8. Capture a materially distinct Home native-ready/paused state if H-4 is not adequately represented by the main Home captures.
9. Continue the screenshot matrix page by page, prioritizing currently OPEN rows rather than redoing existing passes without cause.
10. Refresh retained Legacy mobile and Restore mobile captures.
11. Add missing screenshot evidence IDs/URLs to the final approval index, but keep `Owner approved = NO` until explicit owner review.
12. Continue native soundtrack discovery only if the current two candidates do not meet the desired vibe. Any new track must pass per-track rights review before it enters the queue.
13. Do not spend time trying to make YouTube audio-only. If exact FIFA 17 originals remain, keep them as provider mode and harden state handling during senior implementation.
14. At each successor start, check whether Journey Reconnect or later product work has landed. Add screenshot rows only for actual user-visible states, not anticipated concepts.
15. When the main developer reaches the real final product checkpoint, perform mandatory final-main reconciliation across every route/surface.
16. Then produce the complete final owner screenshot package in screen order.
17. Present every required page/state to the owner for explicit approval.
18. Only after every required screenshot is approved and all binary/rights/final-main gates close may R8 be called `FINAL` and handed to senior production implementation.

## 15. Screenshots still open at this transfer point

Use `FINAL_SCREENSHOT_APPROVAL_INDEX.md` as authority, but the main unfinished clusters are:

- Home wide / Chromebook / mobile / integrated media;
- League Wheel ready/resolved/shared;
- Club Assignment sealed/reveal/locked;
- Dashboard active/later Multi Season/conditional terminal;
- Transfer Challenge ready/active/verdict;
- Local Season Results incomplete/ready;
- Season Summary winner/draw/terminal;
- Rivalry Statistics populated/sparse-tied;
- Career Statistics empty/populated/conditional unresolved;
- Trophy Room empty/populated;
- Legacy mobile + corrupt/fail-closed;
- Rule Book standard/mobile;
- Save Library desktop/conditional dialog states;
- Connected desktop/recovery pending state;
- Restore mobile/apply-ready/critical recovery;
- Empty/Error/Offline/Update/Reduced Motion system states;
- Startup and header/runtime notice states;
- any new real Journey Reconnect or later states after production advances.

This is deliberate unfinished closure work, not missing architecture.

## 16. What not to do next

Do not:

- merge the visual branch to `main`;
- deploy the proposal as production;
- change scoring/storage/Firebase authority from this track;
- regenerate A01/A02;
- introduce a paid music service;
- rip or self-host FIFA 17 commercial soundtrack audio;
- hide a YouTube player and market it as a native audio player;
- bypass advertisements;
- call Pixabay or any other catalog blanket-safe without checking each intended usage boundary;
- invent Journey Reconnect visuals before actual production behavior exists;
- call internal screenshot QA owner approval;
- mark the overall proposal final before the owner's complete screenshot review.

## 17. Key evidence files

Read as needed rather than reopening every historical package:

- `ASSET_BUILD_MATRIX.md`
- `QA_AND_PROTOTYPE_FINDINGS.md`
- `implementation-map/SCREEN_ASSET_STATE_MAP.md`
- `evidence/A01_A02_AUTHORITY_VERIFICATION.md`
- `evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`
- `evidence/NATIVE_SOUNDTRACK_RIGHTS_LEDGER_2026-09-10.md`
- `evidence/R8_26_CLOSURE_PROGRESS_MEDIA_AND_MASTERS_2026-09-10.md`
- `evidence/PROPOSAL_SCREENSHOT_QA_R13_2026-09-10.md`
- `evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`
- `SENIOR_DEVELOPER_FINAL_HANDOFF_REQUIREMENTS.md`

## 18. Transition reason

The transfer is intentionally taken here because a coherent milestone has closed:

- the production YouTube failure mode is diagnosed;
- the compliant free architecture is chosen;
- an executable native-audio proof now exists;
- two CC0 candidates have per-track rights evidence;
- Home has been reconciled to the compact Showdown Radio direction;
- the exact frozen A01/A02 binaries have been physically recovered and hash-verified;
- the exact master package has been preserved in Library;
- the final screenshot owner-approval gate is already formalized.

The next unit of work is a long, screenshot-heavy closure campaign across all product surfaces. Starting that campaign in a fresh environment is safer than consuming the current context and then handing off halfway through the screenshot matrix.

## 19. Current R8 status

`ARCHITECTURE + COVERAGE COMPLETE / MEDIA FUNCTIONALLY PROVEN / FROZEN MASTERS RECOVERED / SCREENSHOT CLOSURE OPEN / OWNER APPROVAL OPEN / FINAL-MAIN RECONCILIATION OPEN`

Do not describe this as a failed or incomplete design. The proposal architecture is substantially built. The remaining work is controlled finalization, visual evidence, real-product drift reconciliation and owner acceptance.
