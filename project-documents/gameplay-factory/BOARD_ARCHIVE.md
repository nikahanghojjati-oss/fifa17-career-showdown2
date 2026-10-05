# Team G gameplay board: all jobs

[Back to the board](BOARD.md) · generated 2026-10-05 9:13 AM Boston time (EDT)

| # | G id | Job | Phase | Type | Lane | Depends on | Codex | Progress | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | G-0 | [Factory smoke test (chat lane)](jobs/JOB-00.md) | 0 Setup | test | chat | - |  | ██████████ 100 % | DONE |
| 90 | G-0W | [Factory smoke test (Work lane)](jobs/JOB-90.md) | 0 Setup | test | work | - |  | ██████████ 100 % | DONE |
| 1 | G-1 | [Fast regression CI on every gameplay push](jobs/JOB-01.md) | 0 Setup | build | work | - |  | ██████████ 100 % | MERGED |
| 2 | G-2 | [Two-manager journey on the emulator (provider level)](jobs/JOB-02.md) | 1 Safety net | test | chat | 1 |  | ██████████ 100 % | MERGED |
| 17 | G-2c | [Simultaneous result taps: loser gets stale, not denied](jobs/JOB-17.md) | 1 Safety net | fix | chat | 2 |  | ██████████ 100 % | MERGED |
| 16 | G-2b | [Two-manager browser journey (localhost-only emulator switch)](jobs/JOB-16.md) | 1 Safety net | test | chat | 2, 7, 17 |  | ██████████ 100 % | MERGED |
| 12 | G-12 | [Composed production Rules regression](jobs/JOB-12.md) | 1 Safety net | test | work | 7, 8, 10 | yes | ██████████ 100 % | MERGED |
| 3 | G-3 | [Pure shared career model + tests](jobs/JOB-03.md) | 2 Career model | build | work | - |  | ██████████ 100 % | MERGED |
| 5 | G-5 | [Active Showdown adapter (Rivalry, Continue, tiebreak, final state)](jobs/JOB-05.md) | 2 Career model | build | work | 3 |  | ██████████ 100 % | MERGED |
| 4 | G-4 | [Renderer seams: screens take a model, never the local path](jobs/JOB-04.md) | 2 Career model | build | work | 3 |  | ██████████ 100 % | MERGED |
| 6 | G-6 | [Start/Join view model + nav.locked](jobs/JOB-06.md) | 2 Career model | build | chat | - |  | ██████████ 100 % | MERGED |
| 11 | G-11 | [Contract fixtures generated from the real model](jobs/JOB-11.md) | 2 Career model | test | work | 3, 5 |  | ██████████ 100 % | MERGED |
| 7 | G-7 | [Career index Rules + client + emulator proofs](jobs/JOB-07.md) | 3 Career history | rules | work | 1, 2 | yes | ██████████ 100 % | MERGED |
| 8 | G-8 | [Completed-only read grant + session-free reader](jobs/JOB-08.md) | 3 Career history | rules | work | 7 | yes | ██████████ 100 % | MERGED |
| 9 | G-9 | [Closed-Showdown adapter into the career model](jobs/JOB-09.md) | 3 Career history | build | work | 3, 8 |  | ██████████ 100 % | MERGED |
| 10 | G-10 | [Transfer history, completed only](jobs/JOB-10.md) | 3 Career history | rules | work | 8 | yes | ██████████ 100 % | MERGED |
| 13 | G-13 | [Part 1: Trophy Room and Career Statistics on the real career model](jobs/JOB-13.md) | MERGED | build | work | 4, 5, 6, 9 |  | ██████████ 100 % | MERGED |
| 14 | G-14 | Acceptance: directive §12 and Sol's 8 proofs on the emulator | SKIPPED | test | work | 13 |  | ██████████ 100 % | SKIPPED |
| 15 | G-15 | One real two-device run with Nik | SKIPPED | nik | nik | 14 |  | ██████████ 100 % | SKIPPED |
| 18 | G-2d | [Nik's pair code survives the pair-panel re-render](jobs/JOB-18.md) | 1 Safety net | build | chat | - |  | ██████████ 100 % | MERGED |
| 19 | G-2e | [Resume a Shared Showdown after reload; closed Showdowns stay on Home](jobs/JOB-19.md) | 1 Safety net | fix | lead | - |  | ██████████ 100 % | MERGED |
| 20 | G-2f | [A late season acknowledgement retries instead of failing](jobs/JOB-20.md) | 1 Safety net | fix | lead | - |  | ██████████ 100 % | MERGED |
| 21 | G-2g | [Same-moment taps retry quietly (bug hunt 1)](jobs/JOB-21.md) | 1 Safety net | fix | lead | - |  | ██████████ 100 % | MERGED |
| 24 | G-13a | [Part 2a: foundation (loader, top bar, shared kit, caching)](jobs/JOB-24.md) | IN PROGRESS | build | lead | 13 | yes | ██████████ 100 % | MERGED |
| 25 | G-13b | [Part 2b: Home, music (Audius) and Loading](jobs/JOB-25.md) | READY | build | codex | 24 | yes | ██████████ 100 % | MERGED |
| 26 | G-13c | [Part 2c: Start/Join, League wheel and Club packs](jobs/JOB-26.md) | READY | build | lead | 24 | yes | ██████████ 100 % | MERGED |
| 27 | G-13d | [Part 2d: Transfer War](jobs/JOB-27.md) | READY | build | lead | 24 | yes | ██████████ 100 % | MERGED |
| 28 | G-13e | [Part 2e: Rivalry Statistics and Legacy (History)](jobs/JOB-28.md) | READY | build | work | 24 | yes | ██████████ 100 % | MERGED |
| 29 | G-13f | [Part 2f: Season Results, Final Winner and Standings](jobs/JOB-29.md) | READY | build | work | 24 | yes | ██████████ 100 % | MERGED |
| 30 | G-13g | [Part 2g: Rule Book and Settings](jobs/JOB-30.md) | READY | build | work | 24 | yes | ██████████ 100 % | MERGED |
| 31 | G-2h | [Ten-season games: session expiry, long-game limits, 10-season emulator run](jobs/JOB-31.md) | MERGED | build | lead | - |  | ██████████ 100 % | MERGED |
| 32 | G-2i | [Fewer taps: audit the flow for steps we can safely drop](jobs/JOB-32.md) | DONE | audit | lead | - |  | ██████████ 100 % | DONE |
| 33 | G-2j | [Fewer taps: auto-refresh while waiting, skip hops, drop duplicate banners](jobs/JOB-33.md) | IN PROGRESS | build | lead | 32 |  | ██████████ 100 % | MERGED |
