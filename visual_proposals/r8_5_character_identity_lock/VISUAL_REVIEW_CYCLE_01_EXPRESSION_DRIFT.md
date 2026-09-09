# Visual Review Cycle 01 — Expression-Induced Identity Drift

Status: ACTIVE VISUAL REFINEMENT / PROPOSAL ONLY / NON-OPERATIONAL

## Live source drift

During this visual session, live `main` advanced from the original R8.5 source pin `7f6432213871fb4cb5fb414999e08ac44e0fb318` to `d56b5179be76d05b98a801a4de7c0f4a42262b4f`, publishing Shared Season Results and asset revision `1.9.1-r9`.

The visual branch is intentionally not rebased or merged automatically. Runtime/DOM changes must be re-resolved before eventual implementation. Character identity truth is independent of runtime code and remains sourced from the owner-approved visual references.

## Owner feedback captured

The latest generated expression boards are directionally correct but are not yet approved.

Initial feedback:

- Nik resemblance was estimated by the owner to be roughly 20% below the approved truth in general.
- Nik `thinking` drift was materially worse, estimated roughly 30–40% below approved resemblance.
- Daniel was substantially closer, but the `happy` expression was not accepted.
- The two owner-reprovided main-screen images remain the highest-priority face truth.
- The owner approved the character resemblance, not one frozen expression.
- Future expressions must remain natural and clearly depict the same approved AI characters.

Latest owner refinement feedback:

- Nik `happy` still requires improvement.
- Nik `pointing` still requires improvement in resemblance.
- Nik torso/folded-arm style pose still requires improvement in resemblance.
- Nik side-view / three-quarter side variant still requires improvement in resemblance.
- Daniel far-right first-row downcast / looking-down expression requires improvement in resemblance.
- Stronger expressions are to be preserved and not regenerated merely for consistency.
- Goal is minimum possible identity drift from Tier 0 truth while still permitting natural expression changes.

Current owner decision for Candidate 01: `REVISE`.

## Root cause classification

Current issue is `EXPRESSION_INDUCED_IDENTITY_DRIFT`, not source-selection failure.

The failure occurs when an expression or pose request simultaneously changes too many identity-sensitive variables, especially:

- brow geometry,
- eye aperture/shape,
- cheek volume/tension,
- mouth width and lip geometry,
- jaw/chin silhouette,
- beard boundary,
- apparent age,
- head-angle induced face-width distortion.

## Refinement rule

Use the principle: `SAME PERSON, DIFFERENT MOMENT`.

Expression may change facial muscle state. It may not redesign facial structure.

For every expression candidate:

1. Keep skull/face proportions stable.
2. Keep eye placement and baseline eye shape stable.
3. Keep nose dimensions and bridge/tip relationship stable.
4. Keep jaw/chin silhouette stable.
5. Keep hairline, hair mass and beard boundary stable.
6. Allow expression through limited changes in eyelids, brows, mouth corners, lips, cheeks and head/eye direction.
7. Prefer subtle expression intensity over theatrical deformation.
8. For side or three-quarter poses, preserve the same nose projection, jaw depth, forehead slope and beard boundary seen in Tier 0 references; do not invent a new profile.
9. For gesture poses such as pointing or folded arms, change body pose without unnecessarily changing facial expression.
10. Reject any candidate that feels like a different casting of Nik or Daniel even if it is visually attractive.

## Specific repair targets

### Nik

Priority: HIGH.

Targeted next pass only:

- natural restrained happy,
- pointing with baseline confident face preserved,
- folded arms / torso pose with baseline face preserved,
- three-quarter side view with Tier 0 facial geometry preserved.

Do not regenerate already stronger Nik variants simply to create a uniform sheet.

### Daniel

Priority: MEDIUM.

Targeted next pass only:

- downcast / looking-down expression at low intensity while preserving Daniel's eye spacing, nose, mouth width, jaw and hair mass,
- restrained happy expression remains under review if included in later passes.

Do not turn downcast into a different age, narrower face, altered nose or exaggerated sadness.

## Candidate 01

Library path:

`/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/CANDIDATE_R8_6_EXPRESSION_REFINEMENT_01.png`

Dimensions: `1536x1024`

SHA256: `de8ddd5d8ca3c8d14ea49e85d07a345586e6b96d14009aa3045437c7a1aaa2de`

Classification: `REVISE / NOT OWNER APPROVED`.

This image is retained as visual iteration evidence only. It must not become canonical character art.

## Lightweight QA gate

No automated face-recognition score is treated as authority. Owner visual approval remains final.

Before promotion of any character expression:

- compare directly against Tier 0 owner-approved references;
- confirm identity before evaluating style;
- compare the candidate against the closest approved front or three-quarter view rather than against another unapproved candidate;
- confirm expression reads naturally;
- confirm no structural facial drift;
- preserve stronger previously accepted-looking variants instead of regenerating them without need;
- record PASS / REVISE / REJECT in the visual progress file.

This QA is intentionally lightweight and separate from the main project's SSJR/MDP/POS testing system.
