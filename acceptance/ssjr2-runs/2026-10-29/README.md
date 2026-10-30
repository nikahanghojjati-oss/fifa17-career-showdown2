# SSJR-2.1 physical run, 2026-10-29

Real two-device 3-season Shared Showdown on production r85 (1.9.9-r85, main `ac2f021d`), played 02:27-02:33 UTC.

- `ssjr-daniel-export.json`: Daniel, Chromebook, Wi-Fi, playerOne/host.
- `ssjr-nik-export.json`: Nik, iPhone, mobile data, playerTwo/peer. This is the second export from the same tab, taken after the closed-Showdown check finished. The first export, taken 33 s after close, did not have the after-close reload tick yet.
- `owner-attestation.json`: the hash-bound owner attestation. Nik confirmed the run and accepted the build as stable on a decision card in the Team G lead thread at 2026-10-29 02:36 UTC.

`scripts/validate-ssjr-physical-journey-evidence.mjs` reports `valid: true` with no issues. `scripts/ssjr2-physical-run-credit.mjs --record` credited all 20 capabilities, 0 -> 100. The ledger event is in `SHARED_SHOWDOWN_JOURNEY_READINESS_SSJR2.json`.

An earlier 1-season pair the same night (02:08-02:12 UTC) also passed, scoring 82 on its own. It is not recorded, because the 3-season pair covers it.
