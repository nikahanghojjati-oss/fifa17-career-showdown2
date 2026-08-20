# Remote Joining Readiness model RJR-1 — 2026-08-20

Purpose: preserve why the project uses a fixed evidence-backed 100-point Remote Joining readiness denominator rather than carrying forward intuition-based percentages.

Authoritative machine-readable ledger: `REMOTE_JOINING_READINESS.json`.

RJR-1 fixed capability weights:

- Deterministic sync and recovery safety: 20
- Identity, authentication, authorization and trust: 20
- Production cloud and security activation: 20
- Devices, pairing, Connected Rivalry and actual Remote Joining: 30
- Real-device hardening and stable release: 10

Total denominator: 100.

The score is not PR completion, roadmap-stage completion, infrastructure-only readiness, WEC age, Handoff proximity or a count of visible owner actions.

A score increase requires verified evidence that materially improves one of the fixed capability domains. A score decrease requires invalidation of previously credited evidence or a proven capability regression. Changing weights or denominator requires a new model version, explicit rationale and backcast so historical comparisons remain meaningful.

The RJR-1 baseline was reconstructed at approximately 58 after denominator drift was discovered between infrastructure/prerequisite completion and actual end-to-end Remote Joining readiness. Provider-verified production reCAPTCHA Enterprise/Firebase App Check registration then increased the ledger by one point in Production cloud and security activation, producing the current evidence-backed score recorded by the machine-readable ledger.

This provenance file does not freeze the current numeric score. Permanent contracts intentionally calculate the current score from domain evidence and require the latest evidence event to match that calculation. Future legitimate progress therefore changes the ledger, not the model merely to make tests pass.
