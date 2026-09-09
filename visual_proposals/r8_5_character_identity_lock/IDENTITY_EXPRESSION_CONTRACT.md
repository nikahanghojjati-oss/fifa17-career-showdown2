# Nik + Daniel Identity and Expression Contract

Status: PROPOSAL ONLY / VISUAL AUTHORITY / NON OPERATIONAL

## Core rule

Identity is locked. Expression is not locked.

The approved Nik and Daniel AI likenesses are permanent visual identity truth. A future asset may change expression, pose, gaze, body angle, gesture, lighting and wardrobe within the approved art direction, but it must still unmistakably depict the same approved AI Nik or the same approved AI Daniel.

Use the rule: SAME PERSON, DIFFERENT MOMENT.

The two owner-reuploaded source images in the Showdown visual Library are Tier 0 face truth:

- `/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/OWNER_APPROVED_FACE_TRUTH_A.png`
- `/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/OWNER_APPROVED_FACE_TRUTH_B.png`

Their exact hashes and Library IDs are recorded in `APPROVED_CHARACTER_IDENTITY_LOCK.json`.

## What can vary

Natural expressions may include neutral, subtle smile, focused, thoughtful, confident, competitive, concerned, surprised, determined, relieved, disappointed and celebratory.

Expressions should be selected by product state, not randomly and not permanently attached to one manager.

Nik is not permanently the thinking face. Daniel is not permanently the pointing face. Those are examples from approved screens, not fixed personality masks.

## What cannot vary enough to break identity

Preserve the approved facial structure and recognizable identity, especially:

- face proportions and silhouette
- jaw and chin structure
- eye spacing, eye shape and brow structure
- nose structure
- mouth proportions when relaxed
- hairline and characteristic hair mass
- beard/facial-hair pattern
- apparent age range
- overall likeness and visual character

Expression-driven movement is allowed. Identity redesign is not.

## Natural-expression QA

A new expression passes only if all are true:

1. It immediately reads as the approved Nik or Daniel without relying on the name label.
2. The facial action looks anatomically plausible for the emotion.
3. Teeth, lips, eyes, brows and cheeks do not acquire uncanny or plastic deformation.
4. The expression matches the screen event or state.
5. The face remains consistent when shown beside a Tier 0 reference.
6. No unrelated celebrity, generic model or newly invented face has leaked into the result.

If uncertain, reject the new asset and retain the approved reference rather than averaging between identities.

## Screen expression matrix

This matrix is direction, not a rigid animation script.

| Screen / state | Daniel direction | Nik direction |
| --- | --- | --- |
| Main Menu / Home | confident, welcoming, competitive | calm confidence, thoughtful, subtle smile |
| Create Showdown | engaged, friendly rivalry, anticipation | engaged, measured confidence, anticipation |
| League selection | focused anticipation, curious | analytical focus, thinking, confident |
| Club assignment / sealed packs | tension, excitement, ready | tension, assessment, ready |
| Showdown Home / tied | competitive, composed | competitive, composed |
| Showdown Home / leading | confident without gloating | confident without gloating |
| Showdown Home / trailing | determined, focused | determined, focused |
| Transfer Challenge | concentrated, planning, suspicious/guessing where appropriate | concentrated, planning, suspicious/guessing where appropriate |
| Season Results / winner | natural celebration, relief, pride | natural celebration, relief, pride |
| Season Results / loser | disappointment, resolve, restrained frustration | disappointment, resolve, restrained frustration |
| Season Results / draw | tension, respect, competitive neutrality | tension, respect, competitive neutrality |
| Season Summary | reflective pride, excitement or resolve based on result | reflective pride, excitement or resolve based on result |
| Legacy / trophy context | proud, reflective, celebratory | proud, reflective, celebratory |

Never hard-code winner/loser emotion to a specific identity. The same manager must support both sides of the result state.

## Pose and side variants

R8.5 requires both manager-side compositions where the product needs them:

- Daniel left / Nik right
- Nik left / Daniel right

Do not fake a side variant by simply mirroring text, logos, watches, suit details or asymmetric props. Prefer an identity-preserving regenerated/edited pose or a deliberately mirrored character-only asset when asymmetry is visually safe.

## Isolated-master requirement

Before additional whole-screen concept art, create isolated canonical character assets against transparent or easily removable backgrounds. Recommended first set per manager:

1. neutral/confident
2. focused/thinking
3. competitive/ready
4. celebration
5. disappointment/resolve

These are expression masters, not five different identities.

## Prohibited generation behavior

- no prose-only recreation of either face
- no literal user/friend photo as the shipping character
- no drifted R8.5 CHARACTER MASTERS sheet
- no substitution with a generic handsome male face
- no celebrity face substitution
- no face averaging between Nik and Daniel
- no whole-page generation before identity-critical isolated assets are approved

## Implementation boundary

This contract does not own DOM, gameplay, Firebase, Firestore, save data, authentication, pairing, scoring, transfers or deployment. It is a visual proposal contract for the master developer to consume later.
