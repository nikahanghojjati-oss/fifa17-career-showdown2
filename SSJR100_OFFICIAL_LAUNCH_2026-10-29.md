# SSJR 100/100: official launch, 2026-10-29

**Career Mode Showdown is officially launched as fully playable.**

## The run

- **When:** 2026-10-29, 02:27-02:33 UTC (Boston: 28 October, 10:27-10:33 pm).
- **Build:** live production r85, `1.9.9-r85`, main `ac2f021d`.
- **Who:** Daniel as playerOne/host on a Chromebook over Wi-Fi, and Nik as playerTwo/peer on an iPhone over mobile data.
- **What:** one real 3-season Shared Showdown played start to finish. It covered setup, league and clubs, Career Start, three transfer windows, results, scoring, and history. Each device went offline and came back, each reloaded mid-game and resumed, and the closed Showdown was confirmed again after a reload.
- **Check:** `scripts/validate-ssjr-physical-journey-evidence.mjs` returned `valid: true` with zero issues.
- **Owner:** Nik confirmed the run and accepted the build as stable at 02:36 UTC.
- **Credit:** `scripts/ssjr2-physical-run-credit.mjs --record` credited all 20 capabilities, 0 -> 100. The ledger is `SHARED_SHOWDOWN_JOURNEY_READINESS_SSJR2.json` (#1041), and the evidence is in `acceptance/ssjr2-runs/2026-10-29/`.

## The road

- **2026-09-05:** the SSJR-1.1 model is set: 20 capabilities, weights adding to 100.
- **2026-09-28/29:** SSJR-2.0 and then SSJR-2.1 allow one validated longer real run to prove everything.
- **2026-10-04:** a smooth 1-season real game on r52, but the recorder missed the reconnect and reload, so it earned no credit.
- **2026-10-12:** CE2PG emulator runs take over day-to-day proof. Real SSJR credit waits for one simpler real-device run.
- **2026-10-26:** SSJR-2.2 evidence rules: one `?ssjr=1` link, no typing, and the checks happen during play.
- **2026-10-29:** the first 3-season try (00:54 UTC) was played fine but failed the check because of a recorder bug, fixed in r86 #1038. A 1-season game (02:08 UTC) passed and scored 82. A fresh 3-season game (02:27 UTC) passed and scored **100**.

54 days from the first model to 100/100.
