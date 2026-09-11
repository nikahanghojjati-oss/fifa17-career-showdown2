# START NEXT VISUAL SESSION — R8.30 Assembled Product Safe Transfer

Status: TRANSITION AUTHORITY / PROPOSAL ONLY / NOT PRODUCTION / 2026-09-10

Read this file first, then read `START_HERE_SOL_VISUAL_MASTER_CONTROL.md` and `MASTER_EXECUTION_PLAN_R8_29.md`.

## 0. Successor role

You are the next GPT-5.6 Sol visual/product operator for Career Mode Showdown. Continue the R8 visual proposal as an implementation-shaped product design, not as a random image-generation session.

GPT-5.6 Sol owns reasoning, scope, reference selection, product-fit decisions, generation tickets, QA, rejection/promotion and sequencing. Image generation is a subordinate renderer only.

Reference uploads never authorize automatic image generation. Before invoking image generation, explain in text what exact asset is being produced, which manager/role it belongs to, which references are authoritative/excluded, where it fits in the real DOM, and what would cause rejection.

Permanent invariants:

- Manager 1 = Daniel.
- Manager 2 = Nik.
- Firebase Spark only.
- Billing OFF permanently.
- No paid fallback.
- Two managers only, same league, permanent clubs.
- No public discovery/community/rankings.
- Proposal work remains under `visual-proposal/r8-complete-product/` until explicit implementation authority.
- Do not modify production merely to make artwork fit.

Operating loop:

`RESOLVE -> EXPLAIN -> BUILD/GENERATE -> QA -> RECORD -> NEXT`

## 1. Repository authority at handoff preparation

Repository:

`nikahanghojjati-oss/fifa17-career-showdown2`

Visual branch:

`developer/r8-26-complete-proposal-asset-build-r13-work`

R8.26 containment base:

`4f35d9e881267abf9b4daaea3022bf9b4799be10`

Pre-handoff visual branch head after the latest master-plan update:

`1a0b758f2d6902b43212b8ab3dfb03f86e582901`

This transition document is committed after that parent, so the successor MUST resolve the branch head again rather than assuming the parent remains head.

Containment proof immediately before this handoff file was created:

- base `4f35d9e...` -> visual branch: 194 commits ahead;
- 0 commits behind that containment base;
- compare-changed paths remained inside the R8 proposal area except historical branch work already present before this transfer lineage; production has not been modified by the latest visual work.

Current production `main` independently resolved during handoff preparation:

`e624d19e04c0ca56f33fa7f0d25fdcc42eb99eda`

Commit message: `MDP: record Final Reconciliation integration at 93.70 (#249)`.

It records r17 Final Reconciliation as integrated and is accounting/provenance-only. It explicitly preserves Firebase Spark only, permanent Billing OFF, no broad list authority and no automatic canonical local-save mutation.

The visual branch is intentionally not current-main-equivalent. At handoff preparation it was 10 commits behind current main relative to their merge base. Do not casually merge/rebase current main into the visual proposal. Instead independently read the live production surfaces needed for each proposal screen, reconcile their behavior into proposal documentation/prototypes, and keep visual containment intact.

FIRST ACTION IN NEXT SESSION: independently resolve current `main`, visual branch head, current production runtime/deployment authority and any new product-visible states since `e624d19...` before editing anything.

## 2. New owner definition of proposal finality

The owner clarified that a final visual proposal is NOT:

- a folder full of images;
- a collection of isolated assets;
- a mood board;
- conceptual image-generator screenshots;
- a document telling a future senior developer how it might look.

The final proposal must be assembled into implementation-shaped HTML/CSS/JS screens under the proposal folder so the owner can see the actual intended website composition.

Before overall visual approval, the proposal should combine:

- page layout;
- final/proposal character assets;
- Club Identity V2.1 badges;
- buttons and full interaction-state styling;
- cards/panels/fields/progress/navigation;
- pack/reveal treatment and animation;
- typography and real DOM text placeholders;
- responsive behavior;
- reduced-motion behavior;
- focus/accessibility behavior;
- relevant empty/loading/error/offline/shared/recovery states;
- soundtrack player where applicable;
- UI sound effects as a separate presentation layer;
- final screenshots rendered from the assembled proposal DOM.

The senior production developer should mostly verify, reconcile with then-current `main`, run tests and transplant/implement. Do not leave major visual assembly decisions for them to invent.

This requirement is now written into `MASTER_EXECUTION_PLAN_R8_29.md`.

## 3. Club Identity V2.1 — owner-approved proposal subsystem

Owner approval was explicitly given on 2026-09-10. Read:

`evidence/OWNER_CLUB_IDENTITY_V2_1_APPROVAL_AND_AUTHORITY_2026-09-10.md`

and

`assets/club-identity-v2-1-catalog.manifest.json`

The subsystem contains:

- 98/98 2016-17 supported clubs;
- five league descriptor catalogs;
- history/location authoring ledgers;
- compact runtime descriptor contract;
- deterministic SVG reference renderer;
- aggregate validator;
- full R1 contact-sheet prototype;
- R2 override catalog for seven priority clubs.

Seven R2 priority corrections:

- Athletic Club;
- Sporting Gijón;
- Bayern Munich;
- Inter Milan;
- Napoli;
- Nice;
- Paris Saint-Germain.

They were locally reconstructed/perceptually reviewed and accepted as the safer R2 direction.

Owner says the badge result is final enough for the proposal. Do not reopen all 98 merely because more variation is possible. Fix only a concrete later defect exposed by deterministic/browser integration QA.

Runtime safety boundary remains hard:

- canonical input is club name;
- no badge data in saves;
- no new Firebase field;
- no Firestore read/write to draw a crest;
- no Storage read/write;
- no Auth dependency;
- no Cloud Function;
- no external badge API;
- no hotlinked image;
- no network dependency;
- no billing dependency;
- authoring history/location/source material never goes into runtime descriptors.

The renderer uses original deterministic SVG geometry, club-associated colors and broad history/place-informed language. Do not trace official crest geometry, official wordmarks, sponsor/league marks or distinctive protected emblem arrangements.

### Important accidental-poster exclusion

Near the end of the predecessor session an image-generation orchestration failure occurred: while the Sol ticket was A05 Nik Club Assignment presentation, the image renderer unexpectedly produced a generic cinematic `CLUB IDENTITY CATALOG v2.1` poster containing many familiar official-looking club marks.

That poster is NOT badge implementation authority and must not be harvested for crest art. It is a renderer drift artifact. Owner badge approval is recorded against the deterministic V2.1/R2 system, not that poster.

## 4. External HTML renderer / zero-dollar replacement

External HTML renderer usage was checked during the predecessor session and reported `51/50`, overages disabled. Do not buy more credits, enable overages or attach billing.

This should not block the project.

Preferred zero-dollar rendering route:

- build real proposal HTML/CSS/JS;
- use the repository's existing Playwright/Chromium/browser-testing stack to render screenshots;
- for isolated deterministic assets, render SVG directly/local deterministic tooling;
- if a ChatGPT container blocks local-file/loopback navigation, use browser `setContent`/equivalent or perform the screenshot in the file-capable senior development environment;
- external HTML renderers are convenience only, never an architectural dependency.

The project already uses Playwright-style browser audits, so the successor should extend existing patterns rather than invent a paid screenshot pipeline.

Do not confuse image generation with final screen rendering. Final screen screenshots must come from assembled proposal DOM whenever feasible.

## 5. Club Assignment — Mode B2 is the active ambitious route

Read:

`evidence/CLUB_ASSIGNMENT_B2_R17_GEOMETRY_PROOF_2026-09-10.md`

`screens/04_CLUB_ASSIGNMENT.md`

`prototypes/04b-club-assignment-mode-b2-structural-prototype.html`

Production owns the real pack through `.clubPackStage`, `.clubPackDoor`, `.clubCardFace`. The reveal sequence/state/persistence is product authority.

Never create a second raster pack that reveals the club.

Original literal pack-holding concept is rejected for implementation.

Original advanced fingers-over-live-pack Mode B is also retired.

Mode B2 uses an exterior/static presentation relationship:

- live DOM pack remains untouched in a protected aperture;
- character is outside/behind the live-pack area;
- no hand/finger/sleeve/forearm pixel may enter the protected aperture;
- optional hand may terminate at a separate static rail outside the aperture;
- an open presenting gesture with visible air gap is safer and always acceptable;
- all character/frame layers `pointer-events:none` and decorative to accessibility;
- pack animation remains the existing live DOM animation.

Production-derived 1366x768 short-desktop geometry observed in r17-era CSS:

- shell approximately 900px;
- reveal area approximately 820px;
- center VS approximately 60px;
- two gaps approximately 8px each;
- each reveal card approximately 372x220px;
- inner pack stage approximately 356x180px;
- target protected aperture safety gutter approximately 14px.

The important design discovery is that 1366px gives useful exterior flank space outside the centered shell. Put most of Daniel/Nik there instead of stealing width from the live pack grid.

Responsive defaults:

- `>=1320px`: Mode B2 eligible after browser proof;
- `1180-1319px`: character-free by default; optional Mode A only if separately proven;
- `<=1179px`: character-free;
- reduced motion: character/frame decoration removed;
- mobile: character-free and existing stacked live-pack behavior preserved.

If B2 browser proof fails, Mode A flank presentation or character-free wins automatically. Do not move product controls or alter reveal state to rescue art.

### Exact next engineering action

Before generating A05/A06, upgrade the B2 prototype into an assembled browser-testable Club Assignment proposal screen using current live DOM/state geometry and placeholder character regions. Exercise all owned reveal stages and controls. Verify:

- protected aperture non-intersection;
- static rail outside aperture;
- no horizontal overflow;
- no hidden/blocked Open, Confirm or Back control;
- no pointer interception;
- no decorative focus targets;
- manager mapping Daniel left/M1 and Nik right/M2;
- responsive removal at lower widths;
- reduced-motion safe state;
- current licensed football-visual lane reconciled within the height budget rather than stacked as another giant hero.

Only after this passes freeze the A05/A06 crop/hand/safe-zone ticket.

## 6. Character system

Read:

`assets/CHARACTER_POSE_LIBRARY_PLAN.md`

`evidence/SOL_VISUAL_ORCHESTRATION_MASTER_GUARD_2026-09-10.md`

`evidence/A01_A02_AUTHORITY_VERIFICATION.md`

`evidence/A03_REFERENCE_ISOLATION_AND_FIRST_GENERATION_REJECTION_2026-09-10.md`

`evidence/A05_A06_RECOVERED_PACK_CANDIDATE_QA_2026-09-10.md`

### Immutable anchors

A01 Nik core thinking hero:

SHA-256 `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`

A02 Daniel core pointing hero:

SHA-256 `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Never regenerate, recompress or silently replace A01/A02.

### A03/A04

Owner liked the resemblance direction, but formal canonical Project files/hashes were not recoverable during the predecessor's final check. Do not fabricate them as accepted masters.

If exact candidate files can be recovered in the next environment, perform face-first QA and provenance packaging without regenerating. If not, preserve the learned identity/style direction and keep A03/A04 open.

### Recovered pack-holding candidates

Project file surface contains:

- `C01_NIK_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png`;
- `C02_DANIEL_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png`.

They are useful face/pose references only. Their baked `CLUB PACK / CM17` box is not implementation-safe and is not a final A05/A06 master.

### Six-role target

Nik: A01, A03, A05, A07, A09, A11.

Daniel: A02, A04, A06, A08, A10, A12.

A05/A06 = Club Assignment presentation, not pack ownership.

A07/A08 = focused/determined.

A09/A10 = natural victory.

A11/A12 = natural setback/reflective disappointment.

Victory/setback selection is presentation-only derived from existing authoritative outcomes. Do not add `characterMood`, `winnerPose`, `loserPose` or equivalent persisted state.

### Reference rule

One manager lane at a time. Never mix Nik and Daniel identity references in one generation. Real photos are geometry/resemblance evidence; final art is stylized AI. Wide promotional images are style/composition evidence, not competing face authority.

No more reference photos are currently required. Ask only if a specific missing facial angle or identity deficit blocks a particular controlled attempt.

## 7. Orchestration failure history — preserve the lesson

This visual lineage suffered repeated accidental/random image behavior. The successor must actively guard against recurrence.

Known failures:

1. first A03 attempt mixed Nik/Daniel/style/real references and produced a weak generic likeness;
2. literal A05/A06 pack-holding direction ignored the real pack DOM and therefore failed product fit despite good faces;
3. final predecessor image call intended to begin A05 unexpectedly returned a generic club-catalog poster.

Treat all three as evidence that the image renderer is not allowed to infer project direction.

Before every uncertain generation, Sol must state:

- stable asset ID;
- manager;
- screen/use case;
- live DOM authority;
- exact identity reference lane;
- excluded references;
- crop/pose;
- safe zones;
- forbidden content;
- face-first rejection threshold.

Then invoke image generation only for that bounded ticket.

After generation, Sol must return to text reasoning/QA. Never let the user receive only an unexplained image and no status.

## 8. Shared R8 button/control system — newly elevated requirement

The owner explicitly noted that button design has not received enough attention. Do not leave this to the production developer.

Audit current production action/control families and build an R8 component matrix/prototype covering at least:

- primary progression action;
- secondary/back;
- confirm/lock;
- danger/destructive;
- compact utility;
- media/music control;
- enabled/disabled;
- permission-denied/read-only;
- busy/loading;
- success/error feedback;
- hover where pointer exists;
- pressed/active;
- keyboard `focus-visible`;
- mobile/touch target sizing.

Design should feel FIFA-17-era black/charcoal/gold without copying proprietary UI artwork. Keep live button semantics/event ownership.

The final assembled screens must use this shared component system rather than one-off visual buttons.

## 9. UI sound effects — separate from soundtrack

The owner wants interface sound design included in UI/UX. This is separate from Audius/music.

Build a small zero-dollar presentation-only SFX system after auditing existing media preference/mute authority.

Candidate events:

- navigation/select;
- confirm;
- wheel stop;
- pack seam charge/open/reveal;
- rivalry lock;
- success;
- error.

Requirements:

- no copied FIFA/EA or other copyrighted game SFX;
- use original synthesized/generated sounds or clearly compatible royalty-free/public-domain local assets with provenance;
- no runtime hotlinks;
- no Firebase/Storage dependency;
- no billing;
- short/restrained clips and low sensory burden;
- sound is never required to understand a state;
- respect mute and reduced-sensory/reduced-motion intent where appropriate;
- avoid inventing new persistent preference fields unless current product preference architecture clearly supports them.

A practical low-load route to evaluate is very small locally packaged audio clips or lightweight WebAudio-synthesized UI cues activated only after user interaction. Choose based on current production media architecture and testability.

## 10. Audius soundtrack lane

Current proposal direction remains Audius Showdown Radio with one native HTML `<audio>` authority:

- no autoplay;
- stream assigned only after deliberate Play;
- no YouTube music fallback;
- no SoundCloud runtime fallback unless owner explicitly reopens;
- no paid fallback;
- zero billing.

Real iPhone Safari and Chromebook playback proof remains OPEN. Per-track final rights/taste evidence remains OPEN. Do not fabricate device proof.

Soundtrack and UI SFX are separate systems and should not be conflated.

## 11. r17 Final Reconciliation and production-visible state drift

r17 added Final Reconciliation as a read-only completed-Showdown projection under existing Season Review ownership. Do not create a new route for it.

Preserve exact manager/profile/save/rivalry binding, Candidate-C separation, no automatic canonical local-save mutation, no broad list authority and zero-billing boundaries.

Before final assembled screenshots, re-read current production because main is advancing in parallel.

## 12. Screen assembly roadmap

After B2 geometry and required character/component dependencies are ready, assemble proposal screens in product journey order rather than generating whole-page images:

1. startup/header/runtime chrome;
2. Home;
3. Create Showdown;
4. League Wheel;
5. Club Assignment;
6. Showdown Dashboard;
7. Transfer Challenge;
8. Season Results Entry local/shared states;
9. Season Summary including authoritative outcome character logic where appropriate;
10. Rivalry Statistics;
11. Career Statistics;
12. Trophy Room;
13. Legacy;
14. Rule Book;
15. Settings/Save Library/local profiles;
16. Connected private rivalry/account/pairing/remote joining;
17. backup/import/restore/recovery;
18. shared-state/offline/error/update/reduced-motion surfaces;
19. r14 reconnect/r15 conflicts/r16 Local Reconciliation/r17 Final Reconciliation as current product ownership requires;
20. media player and UI-SFX integration.

Characters are optional/omitted on information-heavy utility/recovery/settings/rules surfaces when they reduce clarity.

Do not generate entire webpage screenshots with the image model and treat them as implementation truth. Build screens from reusable proposal components/assets and render the DOM.

## 13. Final owner approval package

Overall proposal remains NOT FINAL.

Before asking for final owner approval, present a coherent package containing:

- assembled desktop screenshots of every required journey screen/state;
- compact desktop/Chromebook proof;
- mobile/iPhone proof;
- reduced-motion proof;
- character contact sheet using independently accepted assets;
- Club Identity V2.1 implemented in assembled proposal screens;
- button/component state sheet;
- UI-SFX inventory/provenance and behavior summary;
- soundtrack/media proof or explicit rejection if rights/device proof fails;
- accessibility/focus/overflow QA;
- exact current-main reconciliation;
- no-billing/no-Firebase-regression proof;
- final asset provenance.

Owner approval must be explicit. Badge approval alone is not whole-proposal approval.

## 14. What not to do next

Do not:

- generate random images because the user uploads a reference;
- generate another 98-club conceptual poster;
- reopen badge art direction without a real defect;
- buy or enable external renderer credits;
- put history/location research into runtime;
- add badge data to Firebase or saves;
- make characters literally hold the moving live pack;
- change reveal/persistence state to fit visual art;
- call A03/A04 canonical without recoverable evidence;
- generate A05/A06 before B2 assembled browser geometry passes;
- omit button/control design;
- omit UI SFX from the final UI/UX plan;
- present image-generator whole-screen concepts as the final proposal;
- claim proposal finality before owner sees assembled screens.

## 15. Exact continuation order for the next Sol

1. Resolve current production main, visual head and product-visible drift.
2. Read the master guard, master execution plan, Screen 04 and B2 geometry proof.
3. Build/upgrade the Club Assignment B2 proposal into a browser-testable assembled DOM screen using placeholders, not final A05/A06 art.
4. Add focused geometry/state assertions at 1366x768 and lower fallbacks.
5. Freeze actual A05/A06 exterior-flank crop/safe-zone tickets.
6. Recover/package A03/A04 if exact files exist; otherwise leave open.
7. Generate A05 Nik only, QA face/product fit, then A06 Daniel only.
8. Continue A07/A08, A09/A10, A11/A12 one unresolved identity role at a time.
9. Build the shared R8 button/control component state sheet.
10. Design/test the local zero-dollar UI-SFX layer.
11. Assemble the full proposal website screens from components/assets in journey order.
12. Integrate Club Identity V2.1 into real proposal states.
13. Reconcile r17/later production surfaces and Audius/device rights.
14. Render via local/browser tooling and run responsive/accessibility/state QA.
15. Present complete assembled proposal package to Nik for explicit final approval.
16. Only then produce the senior-production-developer implementation handoff.

## 16. Transition reason

The predecessor session is still coherent, but the project has accumulated enough new architectural decisions, badge research, character-generation failure evidence and finality requirements that continuing further would raise context-pressure/drift risk. This is therefore a deliberate quality-preserving transition rather than a crash or unfinished operation.

The project is stopped at a clean dependency boundary: Club Identity V2.1 owner-approved, B2 geometry defined, final A05/A06 generation not yet legitimately started, and assembled-screen/component/SFX requirements now written into the master plan.

Continue from here.
