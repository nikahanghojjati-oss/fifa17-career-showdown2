# Owner production proof — fresh Connected Rivalry and Player Two unavailable code

Recorded: 2026-08-25 ET

Status: PASS

Runtime observed in the owner production session: application `v1.8.1`, build `1.8.1-r3`.

## Scope

This artifact records privacy-safe facts from owner-supplied production screenshots. It does not contain full account IDs, full device IDs, full active rivalry IDs, pairing capabilities, local Save IDs, raw tokens, or Firebase secrets.

The proof used two isolated browser-storage contexts on the owner Chromebook: normal Chrome for Player One / Nik and Incognito Chrome for Player Two / Gop. It intentionally replaced the no-longer-usable historical local-binding proof after the old local profile/save identities had been deleted. The historical Firestore rivalry was not modified.

## Fresh positive-path evidence

1. A fresh private pairing was created using the current stable Player One / Nik local manager identity and joined by the current stable Player Two / Gop identity.
2. Both production browser contexts attached to the same fresh Connected Rivalry. Privacy-safe recognition fingerprint: `pair_8f24ae...3528c`.
3. Before publication, both contexts reported that no authoritative shared state existed and that the first publish would create revision 0.
4. Player One / Nik published the local gameplay projection exactly once. The UI reported: `Shared gameplay projection published at revision 0. Local Save Library remains unchanged.`
5. Player One / Nik refreshed the shared state and the UI reported authoritative revision 0 with no local Save overwrite.
6. Player Two / Gop refreshed the same rivalry and observed `REMOTE OBSERVED: Revision 0`; the UI reported authoritative revision 0 with no local Save overwrite.
7. No Preview or Candidate C Apply occurred. Player Two showed `LOCAL COMMIT: Not applied this session`.

This re-proves the already-credited production pairing / attachment / revision-zero / cross-manager-read capabilities using the owner's current replacement local identities. It is continuity evidence, not new RJR capability credit.

## One-shot Player Two unavailable-code regression

After the fresh good rivalry was stable at observed revision 0, Player Two / Gop entered the authorized non-secret fixture `pair_` plus 64 zero hex digits in the Private Pairing JOIN field and pressed `JOIN PRIVATE PAIRING` exactly once.

The deployed UI returned the privacy-safe bounded failure guidance:

`This one-use pairing code could not be joined. It may be expired, already used, or unavailable to this account. Create a new code on the other device, or use Connected Rivalry below if these managers are already paired. Local saves were not changed.`

Required post-failure state is visibly preserved in the owner screenshots:

- selector remains `PLAYER TWO · GOP`;
- no raw `Missing or insufficient permissions` text is shown;
- the same fresh Connected Rivalry fingerprint `pair_8f24ae...3528c` remains attached;
- `REMOTE OBSERVED` remains revision 0;
- Player Two local target remains present;
- `LOCAL COMMIT` remains `Not applied this session`;
- the UI explicitly reports that local saves were not changed.

The zero fixture is now consumed for owner evidence and must not be repeated merely for duplication.

## RJR decision

RJR-1 remains `78/100`.

The unavailable-code starter explicitly assigns zero RJR points to this UX regression proof. The fresh positive pair also re-proves capabilities already credited by earlier production Stage 3 / Stage 4 evidence rather than establishing a new fixed-domain capability.

The next distinct pending milestone is the separate Stage 4 owner remote-to-local reconciliation proof: non-mutating Preview, stale-intent rejection, exact canonical backup, explicitly confirmed Candidate C Apply, identity and unrelated-Save preservation, observed/committed convergence, and proof that local Apply does not mutate remote authority. Stage 5 remains locked until that and remaining required hardening are production-proven.
