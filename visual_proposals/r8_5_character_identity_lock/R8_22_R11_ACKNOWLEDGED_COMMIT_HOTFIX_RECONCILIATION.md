# R8.22 r11 acknowledged-commit hotfix reconciliation

Date: 2026-09-09
Lane: independent visual proposal
Controller: GPT-5.6 Sol reasoning
Production mutation: none
Firebase mutation: none
Billing: permanently off

## Authority change observed after Package 3 QA

After the Package 3 static composition QA had been completed against r11 main `be5289cdbfcc8285ab8ddd33cd9fe9f1b3b7198e`, production main advanced again to:

- main SHA: `61e16bb0357352a5c38c02aa072233e851226caf`
- runtime revision: `1.9.1-r11`
- change: SSJR r11 hotfix gating Canonical Shared Scoring on acknowledged Season Commit authority

The hotfix changes only `js/productionSharedCanonicalScoring.js` and its production contract test relative to the previously studied r11 main.

## Exact visual effect

The hotfix adds an early `pcscCommitReady(request)` check before refreshing shared setup / Season Commit dependencies. If the cached Season Commit state is not already:

- `committed === true`
- `phase === "ACKNOWLEDGED"`
- `revision === 3`
- matching the current season and rivalry

then the canonical scoring view is cleared, the scoring panel stays hidden, and provider scoring verification is not attempted.

After setup and commit refresh, the existing second `pcscCommitReady(request)` check still runs. Only after both gating stages may the provider projection be read, and the projection still must satisfy:

- `phase === "SCORING_RECONCILED"`
- `revision === 1`
- `seasonCommitRevision === 3`
- matching season number

The visible `#sharedCanonicalScoringPanel` remains eligible only when the view is authoritative and `SCORING_RECONCILED`.

## Drift verdict

`NO_PACKAGE_3_RECOMPOSITION_REQUIRED`.

This hotfix strengthens the visual-state authority contract that R8.22 already used. It does not change the Package 3 DOM geometry, safe zones, responsive rules, character rails, or the 66-case obstruction result.

The final shared-outcome presentation rule is now:

1. no winner / loser art during Shared Results
2. no winner / loser art during Shared Season Commit before acknowledgement completion
3. canonical scoring art remains dormant unless cached Season Commit authority is already ACKNOWLEDGED revision 3
4. refreshed Season Commit authority must still remain ACKNOWLEDGED revision 3
5. only authoritative `SCORING_RECONCILED` provider-derived scoring may drive winner / draw presentation
6. the visual layer may derive ephemeral A01/A02 luminance / prominence only; it may not persist outcome art state or write Firebase

## Asset decision

No generation gate reopens.

- A03 Nik tactical: HOLD / CLOSED
- A04 Daniel tactical: HOLD / CLOSED
- A05 Nik celebration: HOLD / CLOSED
- A06 Daniel celebration: HOLD / CLOSED

The successful A01/A02 reuse proof remains authoritative for Package 3.

## Safety seal

No production main mutation, deployment, Firebase write, scoring change, Save Library change, Remote Joining change, billing change, or generated-image call was performed by the visual lane.
