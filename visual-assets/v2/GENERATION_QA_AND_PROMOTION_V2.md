# SHOWDOWN VISUAL — GENERATION QA + PROMOTION ENGINE V2

## Hard gates for character assets

An asset cannot be promoted if any hard gate fails:

IDENTITY
- face clearly matches the approved identity family
- hair silhouette correct
- beard/stubble geometry correct

ANATOMY
- hands/fingers plausible
- no duplicated limbs
- shoulder/arm geometry plausible

POSE
- expresses the intended screen narrative
- directs attention toward the planned composition
- does not copy a forbidden pose family

COMPOSITABILITY
- clean background/alpha
- no baked live UI
- no unsafe crop
- no prop blocking the live-control zone

STYLE
- black/gold cinematic family
- correct warm/cool balance
- compatible material/lighting with paired asset

## Quality dimensions

After hard gates, score 1–5:

- identity fidelity
- pose semantics
- lighting/style match
- anatomy
- edge/alpha quality
- crop flexibility
- screen fit
- reuse potential

No single average can override a hard-gate failure.

## Promotion rules

CANDIDATE
Generated but not accepted.

QA_PASSED
Sol finds no hard-gate failure.

OWNER_ACCEPTED
Nik explicitly approves visually.

APPROVED_FOR_ROLE
Owner-accepted and assigned to a named screen family/role.

GLOBAL_REUSABLE
Rare. Only when art direction explicitly says it is broadly reusable.

## Screen-candidate visual QA

Before behavior review, test:

2-SECOND READ
What is the dominant object?

5-SECOND PATH
Where does the eye go next?

FAMILY TEST
Could this sit beside approved Home/League/Club screenshots?

SPECIFICITY TEST
Does it tell the story of THIS screen?

GENERICITY TEST
Does it resemble SaaS / spreadsheet / generic form app?

CHARACTER TEST
Are Daniel/Nik poses semantically appropriate, not merely attractive?

MOBILE TEST
Is the mobile composition rebuilt around the task rather than scaled down?

Any fail in FAMILY / SPECIFICITY / GENERICITY triggers visual revision before deep product review.