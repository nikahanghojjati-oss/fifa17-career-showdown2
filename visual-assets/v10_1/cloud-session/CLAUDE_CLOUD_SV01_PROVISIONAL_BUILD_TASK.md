# CLAUDE CLOUD SESSION TASK — SV01 V10.1 PROVISIONAL C2 BUILD

Task ID: CLOUD-SV01-01
Executor: Claude Code Cloud Session
Coworker model: Claude
Base authority: visual/cinematic-system-v10@ddb5a2544e9680cbc3194a55f797c3c8fc9cf6d5
Task branch: claude-cloud/sv01-v10-1-c2-provisional-build
Production main: READ ONLY
Status required on output: PROVISIONAL_ASTRA_REVIEW_PENDING

## Naming

Claude = the model/coworker.
Cloud Session = hosted Claude Code execution environment.

Do not confuse the two.


## HARD ASSET AVAILABILITY GATE

Before implementing any visual candidate, verify that these exact binaries are physically available in the Cloud Session workspace:

- `POSE_TRANSFER_DANIEL_FOCUSED_V1.png`
- `POSE_TRANSFER_NIK_TACTICAL_V1.png`
- `ENV_STADIUM_WARM_BASE_V1.webp`
- prior 1366×768 V10 baseline screenshot
- prior 390×844 V10 baseline screenshot

If any required implementation asset is unavailable:

- STOP THE BUILD;
- report `ASSET_IMPORT_BLOCKER`;
- do NOT create placeholder asset slots;
- do NOT approximate or substitute a pose/environment;
- do NOT continue to a candidate/fingerprint;
- wait for the owner-provided exact asset import package.

When the owner supplies `SV01_CLOUD_SESSION_EXACT_ASSET_IMPORT.zip`, unpack it and commit the exact files under:
`visual-assets/v10_1/cloud-session/assets/`
with filenames unchanged. Verify their SHA-256 values against the package manifest before resuming.

## Objective

Build one browser-openable provisional SV01 Transfer Guess Entry golden-frame candidate that materially addresses the owner-rated 7/10 baseline.

The task is implementation, not visual-system invention.

## Read before editing

1. visual-assets/v10/V10_STATE.md
2. visual-assets/v10/V10_NEXT.md
3. visual-assets/v10_1/SHOWDOWN_VISUAL_V10_1_CINEMATIC_AUTHORITY.md
4. visual-assets/v10_1/SV01_C2_DECISION_DESK_SPEC.md
5. visual-assets/v10_1/SV01_C2_BLOCKING_ADDENDUM.md
6. visual-assets/v10/SV01_TRANSFER_GUESS_PRODUCT_TRUTH_CARD_V10.md
7. current approved asset registry
8. current production Guess Entry source for behavior only

## Owner decisions already resolved

N1:
Daniel must remain visually left of Nik, but the pair may shift together. They are not locked to fixed screen halves.

N2:
A deterministic CSS/SVG operations room is authorized for this provisional build.

No new environment image is authorized.

## Product behavior

Do not change:
- routes
- phases
- privacy
- guess validation
- number of guesses
- Guess Entry action
- save/network authority
- scoring
- timer behavior

No active 15-minute timer in Guess Entry.

Primary action remains:
LOCK MY GUESSES.

## Visual implementation contract

Implement the blocking addendum exactly enough to test:

- standing C2 camera
- right-weighted live display
- Daniel left of Nik in shared left/world region
- one horizon / one vanishing point
- pitch-level glass-fronted operations room
- standing-height console
- camera-facing live monitor
- physical stand/contact shadow
- stadium seen through glass
- privacy-safe eyelines to each manager's own device
- fixed manager staging across states
- warm camera-right key + cool-neutral ambient
- lower contrast behind live display
- explicit mobile manager identity
- screen-aligned semantic live UI

## Existing assets

Use only approved assets unless the repository already contains another explicitly approved asset for the same role.

Relevant:
- POSE_TRANSFER_DANIEL_FOCUSED_V1
- POSE_TRANSFER_NIK_TACTICAL_V1
- ENV_STADIUM_WARM_BASE_V1

Do not mirror either manager.

Do not bake live/private text into images.

## CSS/SVG room rules

Allowed:
- matte graphite console
- 2–3 px brushed-brass console edge
- restrained concrete/acoustic panel wall
- glass/mullions with visible thickness
- restrained reflection band
- subtle grain
- real contact shadows

Forbidden:
- glowing room borders
- generic neon dashboard look
- heavy bevel gradients
- unsupported floating task board
- fake perspective on live form text

## Required states

At minimum:
- Nik editable, three empty rows — primary golden frame
- Daniel editable
- Nik locked/waiting
- historical replay
- error/recovery
- real busy/pending button-disabled state

Keep manager geometry fixed across states.

## Responsive requirements

Desktop evidence:
1366×768

Mobile evidence:
390×844

Mobile:
- 52–60 px top bar
- 150–200 px human/identity scene region
- both faces visible
- Daniel left / Nik right
- at least one spatial cue
- live task begins within 300 px
- 16 px+ form values
- no scenic tail
- no sticky action over keyboard

## QA

Before finish:
- verify production copy/state ownership
- verify no product behavior changed
- verify no rival-private data exposed
- verify no forbidden timer
- verify Daniel remains left of Nik
- verify no asset mirroring
- verify live controls remain semantic DOM
- verify mobile and desktop source integrity

## Required deliverables

1. Browser-openable candidate in an isolated visual/proposal path.
2. Exact changed-file list.
3. Desktop 1366×768 rendered evidence if the Cloud Session environment can produce it.
4. Mobile 390×844 rendered evidence if the environment can produce it.
5. If screenshots cannot be produced, explicitly say so; do not fake browser proof.
6. Source/state QA report.
7. Candidate SHA-256 fingerprint.
8. Implementation notes including any CSS/SVG fidelity limitation.
9. No merge to main.
10. Do not open a PR unless Nik explicitly asks.

## Stop condition

Stop after one coherent provisional candidate and its QA.

Do not start redesigning Home, League, Club, or other screens.

Do not consume Cloud Session time on unrelated research.

Return a concise handoff for GPT-5.6 Sol and Claude Chat Project RT-01 review.
