# R8.8 Asset Requirements Matrix

Status: PRODUCTION PLAN READY / PROPOSAL ONLY / NO LIVE ACTIVATION

Runtime source pin: `1d0c9f9d6542cd020a4aae53998cb6daeba380e4` / `1.9.1-r10`.

This matrix is intentionally minimal. It is designed to cover the current live runtime with reusable high-quality assets rather than generating one character image per screen.

## Authority order

1. Tier 0 owner-approved CM17 AI hero references = permanent identity and art-style authority.
2. Approved deterministic face crops = exact identity anchor.
3. Owner-provided AI screen references = auxiliary pose/expression/style evidence.
4. Owner-provided real photographs = geometry/expression evidence only; never shipping assets.
5. Generated candidates = non-authoritative until explicit owner approval.

## Required character masters

### A01 NIK_CORE_THINKING_HERO

Priority: P0.

Purpose: canonical Nik identity master and reusable thoughtful/confident hero.

Target visual: black suit / dark shirt family, three-quarter or near-front, restrained thinking expression, hand/chin interaction where safe. Preserve approved CM17 AI-character rendering rather than raw photographic realism.

Primary reuse: Home, Create Showdown, League Wheel, Club Assignment framing, Dashboard crop, Shared Setup identity crop, Remote Joining identity chip, Season Entry identity crop, Legacy identity chip, Tiebreak fallback.

Generation mode: one character, one large asset.

State: strong owner-approved direction exists from isolated Nik generation, but final AI-style calibration/freeze is still pending.

### A02 DANIEL_CORE_POINTING_HERO

Priority: P0.

Purpose: canonical Daniel identity master and reusable active/confident hero.

Target visual: dark suit + open white shirt, approved wavy dark hair/beard geometry, natural pointing/engaging pose. Preserve the historically strongest Daniel pointing likeness.

Primary reuse: Home, Create Showdown, League Wheel, Club Assignment framing, Dashboard crop, Shared Setup identity crop, Remote Joining identity chip, Season Entry identity crop, Legacy identity chip, Tiebreak fallback.

Generation mode: one character, one large asset.

State: approved identity/pose truth exists in prior AI references; clean isolated final master still needed.

### A03 NIK_FOCUSED_TACTICAL

Priority: P1.

Purpose: focused analytical Nik for Transfer Challenge and other high-concentration states.

Target visual: same A01 face identity; gaze down/side toward tactical content, serious concentration without changing jaw, eye baseline, nose or beard boundary. Hand/tablet/tactics gesture only if it composes cleanly.

Primary reuse: Transfer Challenge, Shared Transfer Challenge phases, Tiebreak, waiting/decision states.

Generation mode: one character, one expression/pose.

### A04 DANIEL_FOCUSED_TACTICAL

Priority: P1.

Purpose: focused analytical Daniel for Transfer Challenge and other high-concentration states.

Target visual: same A02 identity; restrained downward/side gaze or paper/tactics attention. Real-photo and AI references may guide gaze/brow geometry only.

Primary reuse: Transfer Challenge, Shared Transfer Challenge phases, Tiebreak, waiting/decision states.

Generation mode: one character, one expression/pose.

### A05 NIK_CELEBRATION_RESOLVE

Priority: P1.

Purpose: positive post-season Nik asset without the previous 'happy face becomes another person' failure.

Target visual: same A01 identity with restrained natural smile or victory resolve. Prefer fist/trophy-oriented body language over exaggerated mouth deformation. Celebration can read through posture and gesture first, face second.

Primary reuse: Season Summary, Trophy Room optional, completed Showdown/Legacy prestige moments.

Generation mode: one character, one expression/pose.

### A06 DANIEL_CELEBRATION_RESOLVE

Priority: P1.

Purpose: positive post-season Daniel asset while preserving the approved lower-face geometry.

Target visual: same A02 identity with restrained warm smile or victory gesture; avoid broad generic advertising smile.

Primary reuse: Season Summary, Trophy Room optional, completed Showdown/Legacy prestige moments.

Generation mode: one character, one expression/pose.

## Conditional character masters

These are not approved scope yet. Generate only after first-pass DOM composition proves a real need.

### C01 NIK_CLUB_PACK_INTERACTION

Trigger: only if A01 cannot frame the live center pack DOM without looking disconnected or obstructing the reveal sequence.

Target: same identity, hands interacting with a generic black/gold pack edge while leaving central card and CTA safe zones clear.

### C02 DANIEL_CLUB_PACK_INTERACTION

Trigger: same as C01 for Daniel.

If core art works, C01/C02 are cancelled and never generated.

## No-generation reuse derivatives

After a character master is owner-approved, these should be produced by deterministic crop/mask/layout work rather than another generative pass:

- square/portrait identity crop
- left safe-zone placement
- right safe-zone placement
- desktop full-height placement
- tablet crop
- mobile fade/omission version
- compact avatar/chip crop

Do not ask the image model to redraw the face for these derivatives.

## Non-character visual assets

### V01 BLACK_GOLD_STADIUM_ATMOSPHERE

Purpose: reusable non-interactive background/final-art atmosphere for Home/Create/League/Club/Season Summary.

Rule: prefer CSS gradients, existing licensed/procedural assets and reusable non-subject atmosphere before generating a different stadium for every page. If one generated stadium treatment is used, make it broad enough to crop safely across surfaces.

### V02 CM17_CROWN_TROPHY_MOTIF_SET

Purpose: crown, trophy/pedestal, gold flare, brush slash and prestige motifs used across Home, Season Summary, Trophy Room and Legacy.

Rule: can be SVG/CSS/procedural where possible. Do not generate raster text into these assets.

### V03 CLUB_PACK_FRAME

Purpose: original black/gold sealed-pack decorative frame surrounding the real DOM club identity reveal.

Rule: pack identity must remain project-original and must not embed official club marks. Prefer HTML/CSS/SVG/procedural implementation over raster text.

### V04 STATUS_AND_CONNECTION_ICON_SET

Purpose: connection, lock, confirmation, waiting, cloud/local, warning and success icons for Remote Joining, Shared Setup, Save Library, Connected Rivalry and recovery states.

Rule: use existing iconography/CSS/SVG first. Generate nothing if current assets are sufficient.

### V05 TROPHY_ROOM_DECORATIVE_SET

Purpose: cabinet/pedestal/glow treatment only if CSS/procedural Trophy Room cannot achieve the approved presentation quality.

Rule: conditional. Character assets A05/A06 may be reused instead of new faces.

## Screen-to-character reuse matrix

| Surface | Nik | Daniel | New character generation? |
| --- | --- | --- | --- |
| Startup | A01 | A02 | No |
| Home | A01 | A02 | No |
| Create Showdown | A01 | A02 | No |
| Remote Joining | A01 crop | A02 crop | No |
| Shared Career Length | optional A01 crop | optional A02 crop | No |
| Shared Confirm | A01 crop | A02 crop | No |
| League Wheel | A01 | A02 | No |
| Club Assignment | A01 or C01 | A02 or C02 | Conditional only |
| Shared Career Start | crop only | crop only | No |
| Dashboard | crop only | crop only | No |
| Transfer Challenge | A03 | A04 | Yes, required |
| Season Entry / Shared Results | crop only | crop only | No |
| Shared Season Commit | crop only | crop only | No |
| Season Summary | A05 | A06 | Yes, required |
| Tiebreak | A03/A01 | A04/A02 | No |
| Statistics | none | none | No |
| Trophy Room | optional A05 | optional A06 | No |
| Legacy | crop only | crop only | No |
| Rule Book | none | none | No |
| Save Library / Settings / Restore / Connected Rivalry | none or tiny crop | none or tiny crop | No |

## Generation order

1. Finalize/freeze A01 Nik Core Thinking Hero.
2. Build/freeze A02 Daniel Core Pointing Hero.
3. Compose A01/A02 into representative Home + League safe-zone wireframe without generating a full fake webpage. This validates whether the core masters actually fit live DOM.
4. Generate A03 Nik Focused Tactical.
5. Generate A04 Daniel Focused Tactical.
6. Generate A05 Nik Celebration/Resolve.
7. Generate A06 Daniel Celebration/Resolve.
8. Attempt live-DOM composition of Club Assignment. Generate C01/C02 only if the core pair objectively cannot support the screen.
9. Produce deterministic crops/placement variants from approved masters.
10. Build final R8.5 black/gold presentation-layer specification and implementation handoff.

## Identity generation contract

Every generated character candidate must satisfy all of the following before it can be promoted:

- same approved person at first glance
- stable eye placement/baseline eye shape
- stable nose bridge/tip relationship
- stable jaw/chin silhouette
- stable beard boundary and hair identity
- no unexplained age shift
- expression accomplished by muscle state/gaze/posture rather than facial recasting
- CM17 AI-character rendering retained; real photos are never composited into shipping art
- no generated typography/logos embedded in the character master
- clean separation from UI controls so the final implementation can crop responsively

Owner approval remains the final likeness authority.

## Scope ceiling

Required character assets: 6.

Conditional maximum: 2 additional Club Pack interaction assets.

Hard planning ceiling for current runtime: 8 unique character masters total. Any ninth character asset requires a mapped screen-level justification and explicit owner approval.

This ceiling prevents expression-library scope creep and keeps quality concentrated on assets the live product actually uses.