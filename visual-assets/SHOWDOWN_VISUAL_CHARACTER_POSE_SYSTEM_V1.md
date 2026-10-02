# SHOWDOWN VISUAL — CHARACTER IDENTITY + POSE SYSTEM V1
Status: ACTIVE VISUAL ASSET POLICY
Owner: Nik
Art director: Sol
Production builder: Luna
Image generation: LOCKED by default; unlock only for one bounded asset ticket at a time.

## 1. The key correction

Identity master is not pose master.

The approved Nik and Daniel core renders are authoritative anchors for:
- facial identity;
- hair;
- general age;
- complexion;
- wardrobe/material language;
- black/gold lighting family;
- overall illustration/photoreal hybrid style.

They are NOT universal hero art for every screen.

The prior mistake was treating:
- Nik thinking pose, and
- Daniel forward-pointing pose

as reusable screen art everywhere.

Those two assets are now classified as:
`CORE_IDENTITY / HOME-HERO APPROVED`

They may anchor identity and may appear on Home where appropriate, but they are not the default pose for Transfer, Results, Club, Rules, Stats, Trophy, or other major screens.

## 2. Screen-family pose rule

Every major screen family gets a pose intent matched to the screen's emotional/job story.

A pose may be reused across closely related states of the SAME screen family, but major screen families should not all reuse the Home heroes.

This avoids both:
- identity drift from generating everything from scratch; and
- visual repetition from using the same two cutouts everywhere.

## 3. Pose family matrix

HOME / SHOWDOWN HUB
- Daniel: direct/confident pointing or welcoming rivalry gesture.
- Nik: iconic thinking/chin pose or confident hero stance.
- Existing core heroes allowed.

CREATE SHOWDOWN / SETUP
- Daniel: presenting/open-hand/decision gesture.
- Nik: composed confident stance, clipboard/tablet optional.
- Goal: "we are setting the rivalry."

LEAGUE
- Daniel: lateral point toward wheel.
- Nik: analytical gaze toward wheel / restrained decision pose.
- Pose relationship should point attention toward the dominant wheel.

CLUB ASSIGNMENT
- Daniel: holding/presenting sealed pack.
- Nik: holding/presenting sealed pack.
- Existing owner-liked pack-holding candidates may be reused only after Sol verifies identity/geometry and labels them accepted for this role.

TRANSFER FAMILY
- Daniel: focused scouting/report analysis; paper/clipboard/pen allowed as decorative prop with NO readable product data baked in.
- Nik: tactical-board/tablet/strategy-analysis pose; leaning/pointing toward the central operations surface.
- Expressions: concentrated, competitive, decision-making.
- Do not reuse Home pointing + Home chin-thinking by default.

SEASON RESULTS ENTRY
- Daniel: competitive/focused, controlled emotional energy.
- Nik: competitive/focused counterpart.
- Avoid celebration before the result is established.

SEASON SUMMARY / WINNER
- winning manager: celebration / trophy / fist / high-energy positive result.
- losing manager: restrained/composed result reaction if shown.
- draw: balanced rivalry pose.

STATISTICS / LEGACY
- analytical / review / records pose.
- clipboard, notebook or table-study gesture allowed.
- not celebration.

TROPHY ROOM
- presenting/holding/flanking trophy.
- Showdown trophy remains the dominant object.

RULE BOOK
- playbook/presenting pose or character-free dense composition.
- character art is optional if it hurts information density.

## 4. Asset ticket contract

Sol must write a ticket before any new character generation.

Every ticket includes:

- Asset ID
- Manager: Daniel or Nik
- Screen family
- Pose description
- Expression
- Body angle
- Gaze direction
- Hand placement
- Wardrobe
- Crop/full-body requirement
- Transparent-background requirement
- Expected safe zones
- Reference identity anchors
- Style anchors
- Allowed props
- Forbidden props/text/logos
- Mobile eligibility
- Acceptance checks

Image generation receives only the bounded ticket and the relevant identity/style references.

## 5. Generation policy

Generation is subordinate.

Sequence:
`SOL ART DIRECTION -> ASSET TICKET -> GENERATE ONE ROLE -> SOL IDENTITY/ANATOMY QA -> ACCEPT/REJECT -> PACKAGE -> LUNA INTEGRATES -> BROWSER RENDER -> SOL SCREEN QA`

Do not generate both managers at once unless the composition itself genuinely requires one combined source image.

Prefer separate transparent character renders. This lets Luna place and scale them without baking product UI into art.

## 6. Quality gate for character assets

Reject immediately for:
- face drift;
- wrong manager identity;
- extra fingers/limbs;
- broken hands/wrists;
- impossible object contact;
- wrong wardrobe language;
- text baked into clipboard/paper/tablet;
- official club/league marks unless explicitly authorized;
- transparent-background failure when the role requires isolation;
- pose direction that fights the screen composition;
- inconsistent lighting relative to the visual family.

## 7. Screen integration rules

Characters:
- pointer-events none;
- never own live data;
- never contain real product labels;
- never block controls;
- never become necessary to understand state;
- may sit partially behind foreground panels;
- must keep face/hand safe zones clear.

Desktop:
- page-specific hero art may be prominent.

Mobile:
- character art may be hidden, cropped shallowly, or replaced by a compact identity treatment.
- do not force a giant desktop hero into the form viewport.

## 8. Ownership

Nik owns final taste and may reject any asset.

Sol owns:
- choosing whether a new pose is required;
- exact ticket;
- generation timing;
- QA;
- selecting the asset Luna receives.

Luna does not generate or choose character art.

Luna only integrates the exact accepted asset IDs listed in the screen blueprint.