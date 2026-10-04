# CLAUDE FIRST ASSIGNMENT — ASTRA_CONSTRAINED MODE

Assignment ID: COV-01
Role: Interim Senior Art-Direction Reviewer
Write access: NONE
Image generation: LOCKED
Product behavior: FROZEN

## Objective

Perform the focused V10.1 review that Astra would normally perform, but as a provisional independent senior review while Astra capacity is constrained.

Do not redesign the product.
Do not implement the screen.

## Inputs

Read in this order:

1. `SHOWDOWN_FIFA17_PRESENTATION_BIBLE.md`
2. `SHOWDOWN_VISUAL_V10_1_CINEMATIC_AUTHORITY.md`
3. `SV01_C2_DECISION_DESK_SPEC.md`
4. `SV01_TRANSFER_GUESS_PRODUCT_TRUTH_CARD_V10.md`
5. `V10_STATE.md`
6. `MODEL_ROUTER_V10_1.md`
7. desktop 7/10 baseline screenshot
8. mobile 7/10 baseline screenshot
9. approved Daniel Transfer pose
10. approved Nik Transfer pose
11. approved stadium base
12. prior candidate HTML only if needed to verify a visual/source claim

## Review question

Did GPT-5.6 Sol correctly convert the Astra FIFA 17 / The Journey research into a sufficiently precise SV01 C2 Decision Desk specification to justify building a provisional golden frame?

## Inspect deeply

### Camera
- Is C2 sufficiently defined?
- Is the camera position / horizon / eye-height relationship clear enough?
- Is anything still likely to produce poster framing?

### Place
- Does "operations room" have enough concrete spatial requirements?
- Can the frame read as inside a room rather than stadium wallpaper with overlay lines?

### Daniel / Nik
- Do the staging rules create a relationship?
- Are eyelines and scale sufficiently constrained?
- Could the existing poses realistically fit, or is an asset blocker likely?

### Task surface
- Does the board/display have believable support and contact?
- Is UI/world separation correct?
- Is screen-aligned DOM preserved?

### Lighting
- Is shared light specified strongly enough to avoid pasted character art?
- Does the spec explain what should dominate versus recede?

### Hierarchy / typography / material
- Could the result still turn into a generic black/gold dashboard?
- Are UI/world proportions and gold hierarchy sufficient?

### Mobile
- Does it preserve the rivalry without becoming cluttered?
- Are software-keyboard and scrolling rules realistic?

### Build readiness
- What is still underspecified enough that a builder could make a 7/10 interpretation?

## Required output

Return exactly these sections:

### 1. VERDICT
Choose one:
- `PROVISIONALLY READY FOR GOLDEN FRAME`
- `NOT PROVISIONALLY READY FOR GOLDEN FRAME`

### 2. MUST FIX BEFORE PROVISIONAL GOLDEN FRAME
Maximum 7 findings.
Each finding:
- problem
- evidence/reason
- exact spec change
- product-truth risk: NONE / LOW / MEDIUM / HIGH

### 3. SHOULD REFINE
Maximum 7 findings.

### 4. ALREADY STRONG
Maximum 7 items.

### 5. EXISTING ASSET FIT — PRELIMINARY
For Daniel pose, Nik pose and stadium:
- likely FIT
- FIT WITH LIMITS
- likely ASSET BLOCKER
with one-sentence reason.

Do not fabricate image details you cannot actually inspect.

### 6. DASHBOARD / POSTER REGRESSION TEST
State the three most likely ways a builder could still accidentally create another 7/10 composition.

### 7. ASTRA REENTRY QUESTIONS
Maximum 3 questions that genuinely deserve Astra's later judgment.
Do not use Astra as a generic second reviewer.

## Stop condition

End after the review.

Do not create HTML.
Do not generate images.
Do not edit repo files.
