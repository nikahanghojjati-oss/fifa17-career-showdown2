# Production unauthenticated authorization-negative proof — 2026-08-26

## Scope

This is a bounded production-only supplement to the remaining pre-Stage-5 authorization audit. It proves only that the real production Firestore boundary rejects an unauthenticated direct mutation attempt against a synthetic Connected Rivalry authoritative-state path.

It does not claim or substitute for the still-uncredited authenticated third-account production negative or revoked-registered-device production negative required by `NEXT_TASK.md`.

## Exact production proof

- Production Firebase project: `fifa17-career-showdown-prod`
- Runtime release remained unchanged: `v1.8.1 / 1.8.1-r3`
- Exact one-shot proof head: `a5f4471acd16f9e6c55fcd39da5d444d778c8122`
- GitHub Actions run: `32930937034`
- GitHub Actions job: `98062908885`
- Request: unauthenticated HTTP `PATCH` to the production Firestore REST API
- Target class: `rivalries/pair_<cryptographically-random-64-hex>/state/authoritative`
- Authentication supplied: none
- Existing owner account, device, pairing, rivalry and local-save state touched: none
- Production result: HTTP `403`
- Accepted: `false`

The exact job log emitted:

```json
{"proof":"production-unauthenticated-firestore-mutation-rejected","productionProject":"fifa17-career-showdown-prod","targetClass":"synthetic-rivalry-authoritative-state","authenticationSupplied":false,"existingOwnerDataTouched":false,"accepted":false,"httpStatus":403}
```

The temporary workflow that issued this single probe was removed immediately after the result. It is not a recurring CI lane and must not be restored merely to repeat the same proof.

## Non-evidence attempt

Earlier head `d5075785ee026ef1c52a9d8a44da3bf21054a747` is explicitly non-evidence. Its Node 24 script failed before issuing the network request because the temporary script mixed CommonJS `require()` with top-level `await`. That head did not reach Firebase and must never be cited as production authorization proof.

## RJR accounting

RJR-1 remains `80/100`.

No readiness point is awarded for this result. Current RJR authority already credits the production Firestore strict-authentication boundary, while the explicitly uncredited production-negative gap is narrower: an authenticated third account and/or a revoked registered device. This proof reduces uncertainty around the unauthenticated production boundary but does not close either named capability.

## Remaining authorization dependency

A genuine production third-account denial requires an authenticated third Firebase identity. A genuine production revoked-device denial requires an authenticated owner identity plus a registered device whose server-side revoked state is part of the production request context. The current repository/GitHub execution environment has neither credential/state authority, and fabricating anonymous or synthetic unauthenticated identities would not be equivalent evidence.

Do not recreate owner accounts, pairings, devices, destructive Candidate C Apply or historical rivalries merely to manufacture this proof. Until the minimum legitimate production identity/device evidence is available, continue with another explicitly uncredited pre-Stage-5 hardening lane such as token-lifecycle behavior or adverse-network behavior, while Stage 5 host/join/session orchestration remains locked by current `NEXT_TASK.md`.
