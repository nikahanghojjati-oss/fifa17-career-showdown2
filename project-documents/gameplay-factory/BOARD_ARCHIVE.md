# Board history

[Back to the Bug hunt board](BOARD.md) · generated 2026-10-10 2:37 PM Boston time (EDT). History only: every job of the first factory plan and every bug report. What is open now is on the [Bug hunt board](BOARD.md); the old detailed board that used to sit here was retired on 2026-10-09 because it repeated stale moves (Nik, 22:49 UTC).

## All jobs

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

## Every bug report


> Updated **Sat 10 Oct, 2:37 PM Boston time** · rebuilds itself on GitHub every 3 minutes while jobs run, no Claude usage · [Job board →](BOARD.md)

| 🔓 Open | 🔴 Top priority | 🔧 Fixing or waiting for release | ✅ Fixed and live |
| :---: | :---: | :---: | :---: |
| **1** | **0** | **0** | **11** |

**Lanes:** 🟦 Sol chat · 🟩 Sol Work mode · ⬜ Codex · 🟧 Opus · 🟪 Sonnet · 🟨 Haiku

### 🔧 Open bugs

| Bug | What happened | Where | Type | Lane | Status | Progress / note |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **BH-12** | Pairing product calls: RESTORE BACKUP as the main button instead of DELETE, a CANCEL CODE button with visible expiry, show the masked linked email and confirm before JOIN, "revoke mine and join" when both phones host, a clearer same-account message | Pairing | 🎮 gameplay | — | 🆕 NEW | waiting on Nik later; the lead asks once his two current cards are answered |


<details>
<summary><b>✅ Closed: 14</b> (11 live in the game) · click to open</summary>

| Bug | What happened | Where | Type | Lane | Status | Progress / note |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **BH-1** | Both managers tap at the same second and the slower one sees an error | — | 🎮 gameplay | — | ✅ LIVE | job 21, PR #344; live since r53 (2026-10-04) |
| **BH-11** | 🔴 **top** · Pairing and reconnect fixes: a reload mid-game strands the reconnect (high), durable storage and an explicit confirm before closing the shared career, a lost join reply shows "code already used", startup retry with plain text, a stray local copy after a failed join, wording and a phone clock hint, a pasted code with extra text is rejected | Pairing, reconnect | 🎮 gameplay | 🟧 Opus | ✅ LIVE | live in r62 (e7b556cd, 8:35 PM Boston time) |
| **BH-2** | A tied season is decided by league position | — | 🎮 gameplay | — | ✅ LIVE | Nik chose league position; docs fixed in PR #343 (merged) |
| **BH-3** | Nobody cross-checks the two managers' season results | — | 🎮 gameplay | — | ✅ LIVE | PR #346; live since r53 (2026-10-04) |
| **BH-4** | Lock buttons have no confirm | — | 🎮 gameplay | — | ✅ LIVE | PR #345 adds the "Lock N of 3?" confirm; live since r53 (2026-10-04) |
| **BH-5** | The 4-hour private session ends long games | — | 🎮 gameplay | — | ✅ LIVE | job 31, PR #350 (fb0dd02): one-tap reconnect after expiry; live since 2.0 (r54) |
| **BH-7** | 🔴 **top** · Transient hardening: Setup survives one failed read, throttled Terminal Close retry, quiet re-read for the phone that loses a simultaneous CLOSE, one stale transfer status line | Setup, Terminal Close, Transfer Window | 🎮 gameplay | 🟧 Opus | ✅ LIVE | live in r62 (e7b556cd, 8:35 PM Boston time); two-manager journey 36/36 locally |
| **BH-8** | 🔴 **top** · Final winner only appears after tapping PREVIEW LOCAL RECONCILIATION (likely the old J10 flake) | Final Winner | 🎮 gameplay | 🟧 Opus | ✅ LIVE | live in r62 (e7b556cd, 8:35 PM Boston time); fixed on 54dd53a and in the r62 batch (gameplay/release-r62); journey 36/36 twice |
| **BUG-1** | Raw error codes show in the Setup settle text | Setup | 🎮 gameplay | 🟪 Sonnet | ✅ LIVE | live in r62 (e7b556cd, 8:35 PM Boston time); same batch: neutral Manager 1/2 fallbacks, 80-character limit on transfer signing names |
| **G-F6** | Transfer screen race: a slow load raised a 10-second red ResizeObserver toast over REFRESH on phones, and the desktop window button landed below the screen | Transfer Window tests | 🎮 gameplay | 🟧 Opus | ✅ LIVE | live in r62 (e7b556cd, 8:35 PM Boston time); fixed on 6fcda70b and in the r62 batch (gameplay/release-r62); failures went from about 1 in 7 runs to 0 of 66 |
| **G-F6b** | Same ResizeObserver fix on the Club screen, and the harmless browser "ResizeObserver loop" warning never shows players an error toast | Club screen, error toasts | 🎮 gameplay | 🟪 Sonnet | ✅ LIVE | live in r62 (e7b556cd, 8:35 PM Boston time) |
| **BH-6** | 🔴 **top** · Audit every still-open item from the 4 Oct bug hunt and Team G notes | Two-writer ledgers, Setup read, J10 final:null, Terminal Close retry, R1-to-R2 restart, mid-game service worker update | 🎮 gameplay | 🟪 Sonnet | ☑️ DONE | report /mnt/project-files/bug-hunt/OPEN_ITEMS_AUDIT_2026-10-05.md; confirmed fixed: lost races on every ledger, season-results race, clash warning, stale scoring-locked text, session-expiry resume; new items became BH-7, BH-8 and BH-9 |
| **BH-9** | 🔴 **top** · Audit of pairing and the persistent pair | Pairing | 🎮 gameplay | 🟪 Sonnet | ☑️ DONE | report /mnt/project-files/bug-hunt/PAIRING_AUDIT_2026-10-05.md; 11 findings, no way for a third account to get in without the code; fixes are BH-11, product calls are BH-12 |
| **BH-10** | Later, low: a full 3-of-3 lock asks no confirm (Nik decides later); session-expiry reconnect is still host, code, join rather than one tap; no release-version handshake between the two phones | Locks, reconnect, versions | 🎮 gameplay | — |  PARKED | cleared by Nik 2026-10-06: low priority, off the board; reopen only if it shows up in play |

</details>

---

<sub>Bug list: `BUGS.json` (kept by the Bug reports thread). Progress: the ```` ```progress ```` block in each job's PR description. Statuses: 🆕 NEW · 🔍 TRIAGED · 🔧 FIXING · 👀 REVIEW · 🔀 MERGED · ✅ LIVE · ☑️ DONE · ♻️ DUPLICATE · 🚫 NOT A BUG. Made by `tools/bug_board.py`.</sub>
