# Career Mode Showdown v1.9.1 — Runtime r23

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r23`

Previous known-good runtime: `1.9.1-r22`

Runtime `1.9.1-r23` is the whole-shell release candidate for the player-facing Showdown Data recovery fix discovered during physical acceptance. It advances the installable shell identity because Settings, online product containment and the deletion path changed after r22; r22 remains the immediate known-good whole-shell recovery target.

Ordinary Settings now exposes a concise Showdown Data panel while the engineering Save Library surface remains internal. A player can delete only the current local Showdown from Settings without clearing the remembered Daniel/Nik pairing, player identity, completed Legacy history or application preferences. History, backup export and the full-reset maintenance path remain separate.

The Settings application summary now reflects the current Daniel/Nik connected two-device product instead of the retired local-only one-device description.

This release does not weaken Save Library authority: current-Showdown deletion activates and verifies the established Save Library runtime before mutation, uses the existing clear-active transaction, and fails closed if authority cannot be verified.

Remote Joining and Shared Journey terminology remain engineering provenance only; the player-facing product remains the single Start a Showdown / Continue Career experience.

Firebase remains Spark-only with Billing permanently OFF. App Check enforcement remains OFF. No Cloud Run, Cloud Functions, Blaze/payment dependency, public discovery or paid infrastructure is introduced.

SSJR-1.1 remains exactly `0/100` until new physical two-device evidence passes the acceptance path. Source, CI, merge and deployment do not themselves earn physical-journey acceptance credit.

Production Pages and required release checks must pass on the merged exact main head before the user is asked to retry the deletion flow.
