# R8.19 Pack-Holding + State-Derived Expression Feasibility

Status: REASONING COMPLETE / OPTIONAL PACK POSES REOPENED / OUTCOME VARIANTS ARCHITECTURALLY FEASIBLE / GENERATION CLOSED UNTIL MAPPED GATES

Runtime authority checked: `1d0c9f9d6542cd020a4aae53998cb6daeba380e4` / `1.9.1-r10`.

Visual branch: `visual/r8-5-approved-character-identity-lock`.

Controller: `00_VISUAL_REASONING_CONTROLLER_CONTRACT.md`.

## 1. Owner direction reconciled

The owner explicitly changed the earlier Club Assignment preference after seeing a new reference composition. The owner likes the pack-holding poses, the facial resemblance in that reference, and the newly generated isolated Nik/Daniel pack-holder candidates.

This is a valid owner override of the earlier C01/C02 cancellation, but it does not mean the previous safe-zone reasoning was wrong. The original cancellation correctly identified that two large pack-holder figures placed permanently inside the 980px live pack shell could compete with the real reveal cards and CTA.

Therefore the new decision is narrower:

- reopen pack-holding poses as OPTIONAL PRESENTATION ASSETS;
- do not add them to the six required canonical character masters;
- do not replace the live club-pack cards with raster artwork;
- do not let the characters own the club draw or reveal state;
- use them only where the existing Club Assignment stage machine provides a safe cinematic presentation window;
- on tablet/mobile, crop or omit them before controls are compressed;
- keep the real DOM authoritative at all times.

## 2. Owner-liked pack reference preserved

Reference:

`CLUB_PACK_HOLDING_OWNER_LIKED_COMPOSITE_REFERENCE_R8_19.jpeg`

- persistent Library file ID: `file_00000000ee0c81f583e380023c575453`
- Library record ID: `libfile_19fc02fa4c788191ba94200ace3c1b7e`
- dimensions: `1536x864`
- SHA-256: `4c0e66168a23241a1e14c0c7756a54b49fc5729029a246c51171d2f967b680f6`

Owner-liked qualities:

- strong Nik/Daniel facial resemblance;
- black/gold stadium presentation;
- confident pack-holding body language;
- both characters visually frame the central Club Assignment experience;
- the pose feels appropriate to the reveal moment.

The reference is composition and identity evidence only. Its rasterized text, progress track, pack cards, buttons and other UI are not production authority.

## 3. Current optional pack-holder candidates

### C01 Nik Club Pack Holding

`C01_NIK_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png`

- persistent Library file ID: `file_00000000195881f5a6d49ee9ad919b3e`
- Library record ID: `libfile_3bb23b7c0cb081919dc5b2618e796f21`
- dimensions: `1086x1448`
- mode: RGBA
- SHA-256: `7014a5165330e321928c30baf426c86c51bc909dc0122942945d6ec32789500d`
- owner state: `OWNER_LIKED_CANDIDATE`

### C02 Daniel Club Pack Holding

`C02_DANIEL_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png`

- persistent Library file ID: `file_00000000f82881f7ac2dda3890d17a09`
- Library record ID: `libfile_92678398a1588191815af8f15504d457`
- dimensions: `1086x1448`
- mode: RGBA
- SHA-256: `049654d7360a1c9fd70c4bed836a13b3ae7f797d125a19d1a0395e848f34f368`
- owner state: `OWNER_LIKED_CANDIDATE`

They are preserved now so future sessions do not regenerate them casually.

They are not yet promoted to `OWNER_APPROVED_FROZEN` because exact Club Assignment composition/obstruction QA has not yet proven their final shipping placement.

## 4. Club Assignment runtime authority

Current local Club Assignment already exposes these presentation stages through `#clubWheelScreen[data-club-reveal-stage]`:

1. `ready`
2. `opening`
3. `manager-one`
4. `manager-two`
5. `versus`
6. `confirmation`

The club pair is persisted before the visual reveal timers begin. The existing presentation sequence then advances with finite timers and reduced-motion support.

This is ideal for visual enrichment because the art can react to a state that already exists instead of introducing another state machine.

### Safe integration rule

Pack-holder art may be placed in a dedicated non-interactive layer:

`<div class="r8ClubPackCharacterLayer" aria-hidden="true">...</div>`

The layer must use:

- `pointer-events:none`;
- no focusable content;
- no button/input replacement;
- no write to storage;
- no Firebase call;
- no timer authority;
- no control over selected clubs.

The real `.clubAssignmentShell`, pack cards, progress rail, status and CTAs remain above it.

### Recommended state mapping

`ready`:

- optional low-intensity side framing only;
- real sealed pack DOM is dominant;
- do not visually imply that the draw has already happened.

`opening`:

- best cinematic moment for both pack-holder poses;
- fade/slide them in behind the live shell while the real Open button is already disabled by runtime authority;
- this is presentation only.

`manager-one`:

- left-side/manager-one pack-holder may remain briefly if it does not cover the real Pack 01 result;
- opposite character may fade back.

`manager-two`:

- manager-two pack-holder may receive the stronger emphasis;
- real Pack 02 result remains readable.

`versus`:

- both characters reduce in scale/opacity or move to extreme rails;
- the real rivalry confirmation area becomes primary.

`confirmation`:

- pack-holder art should normally disappear or reduce to narrow edge crops;
- `CONFIRM RIVALRY & START SHOWDOWN` must be unobstructed.

### Responsive rule

Desktop wide:

- optional cinematic pair allowed if no live card/CTA overlap.

Tablet:

- use one shoulder/pack crop at most or omit both.

Mobile:

- omit large pack-holder characters entirely.

This preserves the owner-liked pose without turning it into a layout dependency.

## 5. Shared / Firebase safety of pack-holder visuals

Shared Showdown Setup already owns its own authoritative Firestore/provider transitions and explicitly protects canonical local storage from mutation during setup.

Pack-holder artwork must not become part of those transitions.

If/when the shared setup UI later reuses Club Assignment presentation, the same rule applies:

- remote state synchronizes league/club/setup facts;
- the browser derives decorative art locally from the authoritative phase;
- image bytes are static website assets;
- no Firestore document contains `nikPackPose`, `danielPackPose`, animation frame or image URL selection state;
- no extra Spark write is required.

Therefore the optional pack-holder presentation is feasible under Firebase Spark and the zero-dollar rule.

## 6. Outcome-dependent expression idea

Owner preference:

On one or two result/payoff screens, character expressions may change based on who won, who lost, or whether the result is level. The owner does not want expression switching added throughout the site and does not want this feature to destabilize shared/remote architecture.

Decision: FEASIBLE WITH A DERIVED-PRESENTATION MODEL.

Do not synchronize expression choice.

### Existing local authority

The local season engine already creates a completed round record with:

- `roundRecord.winner = "playerOne"`
- `roundRecord.winner = "playerTwo"`
- or `roundRecord.winner = "draw"`.

`renderSeasonSummary(roundRecord)` already branches on that exact winner value to render the season-result message.

That means a visual layer can branch on the same existing value without changing scoring or persistence.

### Safe visual resolver

Future implementation should conceptually use a pure resolver such as:

```js
function resolveSeasonSummaryVisualState(roundRecord){
  if(!roundRecord || !["playerOne","playerTwo","draw"].includes(roundRecord.winner)){
    return "neutral";
  }
  return roundRecord.winner;
}
```

The resolver is presentation-only. It must not calculate a second winner independently when the runtime already provides `roundRecord.winner`.

## 7. Minimal expression matrix

Keep the asset count small.

### Season unresolved / review / waiting

- Nik: A01 core thinking/neutral
- Daniel: A02 core confident/pointing or restrained crop
- no winner/loser expression

### PlayerOne wins a completed local season

- winning manager: optional celebration/resolve master when A05/A06 gate eventually opens
- losing manager: reuse core neutral/focused master; do not automatically generate a separate sad/defeated face

### PlayerTwo wins

- mirror the winner/neutral logic

### Draw

- use both core masters or a restrained neutral composition
- no need for special draw-only character art

This prevents state explosion.

The current six-master plan remains sufficient unless exact later composition proves otherwise.

## 8. Shared-result authority boundary

Current Shared Season Results intentionally separates:

- private result entry;
- publication;
- waiting for rival;
- both-results-ready reveal;
- Shared Season Commit;
- later canonical local Save/scoring authority.

Therefore result-dependent winner/loser character art must NOT appear merely because both private result payloads are visible.

Until shared runtime exposes an authoritative completed-season outcome that the product treats as final, use neutral/core character presentation.

Once a later shared capability provides the same authoritative outcome on both devices, each browser may deterministically select the same static visual asset locally.

No additional Firestore field is necessary.

## 9. Why this does not break Remote Joining

Remote Joining and Shared Setup synchronize domain facts and authority, not artwork.

The visual layer can remain downstream:

`authoritative shared state -> existing runtime outcome/stage -> local visual resolver -> static approved asset`

Not:

`image selection -> Firestore write -> remote image state -> gameplay logic`.

This one-way dependency is the safety boundary.

The visual layer must be removable without changing game results, pairing, save contents or provider behavior.

## 10. Asset-generation gates after this study

### C01/C02 pack holders

State: `OWNER_LIKED_CANDIDATES_PRESERVED / OPTIONAL IMPLEMENTATION QA PENDING`.

No regeneration is justified now.

Next step is exact Club Assignment composition/obstruction QA using these existing files.

### A03/A04 tactical expressions

Remain CLOSED.

Open only if Transfer Challenge / Shared Transfer Challenge exact composition proves A01/A02 cannot provide sufficient tactical tension through deterministic crop/placement.

### A05/A06 celebration/resolve

Remain CLOSED.

Architecture is now proven feasible, but generation still waits for exact Season Summary composition. If that composition shows the payoff is materially improved by winner-specific art, generate only the minimum required celebration/resolve masters.

No loser-only or draw-only masters are currently justified.

## 11. Zero-dollar result

- Firebase tier: Spark only
- billing: permanently off
- additional Firestore writes for visual state: `0`
- additional remote protocol fields for visual state: `0`
- additional image-transfer protocol: `0`
- static website asset delivery: existing deployment/static-cache mechanism
- production main mutation from this study: `0`

## 12. Progress accounting

Formal visual production progress remains `72%` at this checkpoint.

Reason:

- owner-liked optional pack candidates were preserved, but final responsive/obstruction integration is not yet validated;
- outcome-driven expression architecture is proven feasible, but A05/A06 have not reached their composition gate;
- planning evidence should not be converted into false completion credit.

This checkpoint materially reduces implementation risk without inflating completion percentage.

## 13. Next bounded roadmap action

Return to the main roadmap:

1. complete Package 1/2 responsive/obstruction QA with A01/A02;
2. include C01/C02 as an optional Club Assignment cinematic subtest, not as a layout requirement;
3. if Package 1/2 passes, continue exact Package 3 DOM reconciliation;
4. evaluate Transfer Challenge first without new generation;
5. evaluate Season Summary winner/draw composition using the derived-state rule;
6. open A03/A04 or A05/A06 only if exact composition proves a missing reusable asset.

No new image-generation call is justified immediately after this study.
