# R8.43 League revalidation + R8.44 Home revalidation + R8.45 Club Assignment browser proof

Date: 2026-09-11

Status: `ASSEMBLED_PROPOSAL` / browser-proven / owner visual review open / production integration not authorized.

## Live authority reconciliation

Before this pass GPT-5.6 Sol independently resolved the live repository rather than trusting a handoff SHA.

- visual branch head at start of the pass: `9d4539c73c05700af139d90b59d68bf391a05349`
- live `main` observed at start: `3c5fb2589414f8f497d1f7cb174200ef84290431`
- the visual branch remained 15 production commits behind `main`; those commits were treated as read-only production authority rather than merged blindly
- current `main` still exposes the Home, League and Club Assignment DOM/state seams consumed here

The R8.40 generation gate was read first. It remained `ACTIVE_HARD_GATE` with `imageGenerationAllowed=false`. No image-generation tool was invoked in this pass.

## League R8.43 owner-review checkpoint

The exact asset-bearing R8.43 assembly was recovered from persistent Showdown Visual Library storage and re-run in real Chromium.

Fresh matrix:

- `1440x900`
- `1366x768`
- `1280x720`
- `1179x800`
- `940x700` with reduced motion
- `390x844` DPR2
- six proposal states per viewport: ready, spinning, selected, confirmed, locked, save-error
- result: `36/36 PASS`

Measured at `1366x768` ready:

- all five deterministic league mark/name pairs have the same `5.5px` mark-to-name vertical separation
- no mark/name overlap
- header bottom approximately `y=56`; gold heading begins approximately `y=88`
- title/header collision: false
- wheel/action collision: false
- horizontal overflow: false
- Daniel opaque fingertip enters only the decorative wheel rim by roughly 6px at the contact height
- Nik opaque silhouette begins roughly 26px beyond the wheel's right edge
- no synthetic Daniel finger glow was introduced

Persistent owner-review artifacts remain under:

`/Showdown visual/R8_43_League/`

League remains `ASSEMBLED_PROPOSAL / OWNER REVIEW OPEN`; it is not silently promoted to `OWNER_APPROVED_FINAL`.

## Home R8.44 current rebuild revalidation

The already-built R8.44 Home assembly was re-read against current `main` and re-run rather than replaced with a generated screenshot.

Preserved live Home seams:

- `#continueCareer`
- `#newShowdown`
- `#legacyButton`
- `#careerStatisticsButton`
- `#ruleBookButton`
- `#settingsButton`
- `#menuMusicPlayer`
- `#menuMusicStatus`
- `#menuMusicToggle`
- `#menuMusicMute`

Fresh Home matrix: active + empty across the same six viewport conditions = `12/12 PASS`.

No reference-only navigation or fake percentage/progress state was added. Persistent owner-review artifacts remain under:

`/Showdown visual/R8_44_Home/`

Home remains `ASSEMBLED_PROPOSAL / OWNER REVIEW OPEN`.

## Club Assignment R8.45 rebuild

R8.45 rebuilds Club Assignment toward the supplied black/gold stadium reference while preserving production r17/r18 product ownership.

Reference image authority: visual language only. Reference-only global navigation, raster pack ownership and fake feature surfaces were not implemented.

Real product ownership preserved:

- `#clubWheelScreen`
- `.clubRevealArea`
- `#clubCardOne` / `#clubCardTwo`
- two real `.clubPackStage` apertures
- two real `.clubPackDoor` elements
- two real `.clubCardFace` reveal faces
- `#clubPlayerOne` = Daniel / Manager 1
- `#clubPlayerTwo` = Nik / Manager 2
- central `.clubVs`
- `#clubRivalryConfirmation`
- permanence note
- `#openClubPack`
- `#continueClubAssignment`
- `#clubAssignmentBack`

The production reveal sequence remains the sole authority:

`ready -> opening -> manager-one -> manager-two -> versus -> confirmation`

The review HTML contains only a manual QA stage injector. It has no timers, no click bindings, no draw, no persistence and no second reveal clock. Production `js/clubAssignment.js` remains the runtime owner.

### Presentation build

- same warm detailed stadium language used by the accepted visual direction
- existing Daniel and Nik source art reused through deterministic resize/compression only; no new generated source asset
- premium gold brush-style title treatment
- five-step reveal progress retained
- sealed live packs use neutral black/gold doors
- revealed club names remain DOM text
- no official club crest raster ownership added
- characters remain exterior B2 decoration only
- wide B2 characters are clipped/faded before a static rail and cannot enter the moving pack aperture
- B2 disappears below 1320px and under reduced motion
- mobile stacks the real packs and reflows real controls rather than shrinking the cinematic desktop stage

### Protected-aperture proof at 1366x768

14px safety-gutter rectangles:

- Manager 1 protected aperture: `x=349..587`
- Daniel flank ends at `x=315`
- Daniel static rail ends at `x=314`
- Manager 2 protected aperture: `x=779..1017`
- Nik flank begins at `x=1051`
- Nik static rail begins at `x=1052`

Therefore both character flanks and both rails remain disjoint from both protected pack apertures.

### Chromium matrix

Viewports:

- `1440x900`
- `1366x768`
- `1280x720`
- `1179x800`
- `940x700` reduced motion
- `390x844` DPR2

Stages:

- ready
- opening
- manager-one
- manager-two
- versus
- confirmation

Result: `36/36 PASS`.

Assertions include:

- no horizontal overflow
- all current live DOM seams present
- exactly five reveal progress steps
- Daniel = Manager 1 and Nik = Manager 2
- card reveal truth matches the real stage
- confirmation visibility matches the real stage
- Open / Confirm / Back visibility and disabled state match current runtime ownership
- B2 eligibility and reduced-motion fallback
- no decorative pointer events or focus targets
- protected aperture clearance
- distinct pack apertures
- visible controls disjoint from pack apertures
- mobile stacked pack order

Persistent exact browser artifact set:

`/Showdown visual/R8_45_Club_Assignment/`

- `club-assignment-r8-45-reference-fidelity.html`
- `CLUB_R8_45_BROWSER_QA_36_CASES.json`
- `CLUB_R8_45_REVALIDATED_1366_READY.png`
- `CLUB_R8_45_REVALIDATED_1366_MANAGER_ONE.png`
- `CLUB_R8_45_REVALIDATED_1366_CONFIRMATION_STABLE.png`
- `CLUB_R8_45_REVALIDATED_1440_READY.png`
- `CLUB_R8_45_REVALIDATED_390_READY.png`
- `CLUB_R8_45_REVALIDATED_390_CONFIRMATION.png`

## Authority labels

- supplied screenshots/references: `REFERENCE_ONLY`
- obsolete structural sketches: `CONCEPT_ONLY`
- source-art derivatives used here: retain their existing candidate/source authority; no silent promotion
- League R8.43: `ASSEMBLED_PROPOSAL`, owner review open
- Home R8.44: `ASSEMBLED_PROPOSAL`, owner review open
- Club Assignment R8.45: `ASSEMBLED_PROPOSAL`, owner review open
- nothing in this pass is `OWNER_APPROVED_FINAL`

## Production boundary

No production logic, Firebase, Firestore, Auth, saves, routing, game rules, shared-session behavior or reveal persistence was changed. The exact browser assemblies are presentation proposals wired to current product seams and remain gated from production integration until owner visual approval and final-main reconciliation.