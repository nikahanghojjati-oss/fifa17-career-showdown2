# Owner Milestone Delivery Progress Instruction — 2026-09-07

Historical owner-direction provenance only. Current source and any later explicit owner instruction remain authoritative.

The owner explicitly replaced the visible `Estimated focused sessions to genuine SSJR100` forecast with a new tracker that coexists with, and does not replace, SSJR.

The requested concept is engineering completion of the current milestone across all of its required features: design the feature, build it, test it, correct needed bugs/review findings, test it again, and make it part of the product once its lifecycle gates pass. The owner asked that every milestone be understood as a set of features moving through that lifecycle and that the project report the resulting milestone progress continuously on a 0.00–100.00 scale.

The owner explicitly distinguished this tracker from SSJR. SSJR remains the tighter evidence-based readiness score and can stay unchanged while engineering work advances. The new tracker is expected to move reasonably with actual project work and will often be numerically above SSJR, without creating a mathematical invariant between them.

Repository implementation of that direction is named `Milestone Delivery Progress (MDP-1)`. Its exact scoring model lives in `MILESTONE_DELIVERY_PROGRESS_MODEL.json`; its current milestone ledger lives in `MILESTONE_DELIVERY_PROGRESS.json`; its explanation and anti-inflation rules live in `00_MILESTONE_DELIVERY_PROGRESS.md`.

This provenance file does not grant SSJR credit, does not authorize changing the frozen SSJR-1.1 capability model, and does not itself authorize product-runtime implementation beyond current owner/source authority.
