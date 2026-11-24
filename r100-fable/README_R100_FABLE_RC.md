# r100 Fable final check (3.0.0 Phoenix release candidate)

Nik 2026-11-24 18:59 UTC: one Fable round, run when the release is ready, about $90 in total (Playground credit). It replaces the rolling FB1-FB8 schedule in the driver plan and the r99 packets FJ1-FJ11 (retired: they are pinned to 2.11.0, which has shipped).

## When
**Moved one day sooner (Nik 2026-11-24 22:26 UTC: "We will do fable check one day sooner").** The feature freeze is now **Sun 29 Nov noon Boston**, and the lead writes the packets then, or earlier if every 3.0 PR has merged. Nik runs the round on Sun 29. Mon 30 is left for verifying and fixing findings, plus the one re-check, so release stays Tue 1 Dec. The build cut line (Sat 28 Nov 8 PM Boston) is unchanged. **Early freeze (Nik card 2026-11-24 22:29 UTC):** if every 3.0 PR is merged and proven by Thu 26 Nov night, the freeze moves to Fri 27 evening, Nik runs Fable on Sat 28, and release is Mon 30. Otherwise Sun 29 stays. All packets pin ONE release-candidate SHA of `gameplay/r100`. Nik runs them in the Playground on Fable 5.2 (MAX effort, as before) and pastes each report into the lead thread. The lead routes each claimed finding to Opus high for verification against the code, and confirmed findings get fixed before "merge r100".

## Budget
8 packets at about $10-11 each, plus about $5 kept for one re-check of a fix. Each packet stays tight: one area, 8-12 files, sharp questions, a fair normal-play threat model (no hacking, no modified app), and pre-launch scope (no old saves, no mixed versions).

## Packets (areas fixed now, files and questions written at the freeze)
| ID | Area | Main 3.0 changes it covers |
|---|---|---|
| FR1 | Season commit and next season | W8 listener rebuild, commit wait #1596, Cut A reads #1608 |
| FR2 | Resume on a swapped, killed or fresh phone | W2 #1590, W3 tap memory #1592, W5 reset |
| FR3 | Pairing, JOIN, remembered sign-in, SIGN OUT | #1591, #1598, #1599 |
| FR4 | End of a Showdown | Terminal Close, END SHOWDOWN #1603, Sacked, Final Winner, Turning Points #1576, History |
| FR5 | Points truth | EL/CL bonus, Prime Pack 4/3/2/1 (W12), perfect 15, Golden 150, draws with no tiebreak, the one finished Arsenal v Burnley game unchanged |
| FR6 | Transfer War and Squad lock races | locks, refusals, guessed players, Cut B reads |
| FR7 | Chamber Men and Roster Russian Roulette | turn order, bullets = goals, a crash is a miss, one pull per season, the 7-hole spin |
| FR8 | Start-up and updates | service worker, Reus Gate, clubhouse plates and flash, the phoenix rise never blocking a step |

Report IDs FR1-NN and so on. Format as in `r100-sol/_HOUSE_RULES_R100.md`.
