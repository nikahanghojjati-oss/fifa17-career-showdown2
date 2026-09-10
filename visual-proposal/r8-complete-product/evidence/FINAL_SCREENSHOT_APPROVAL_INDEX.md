# R8 Final Screenshot Approval Index

Status: HARD FINALITY GATE — OPEN

Owner rule established 2026-09-10:

The visual proposal is not `FINAL` merely because contracts, prototypes and internal QA are complete. Before final status, the owner must receive screenshots of every built page / substantial non-route surface and every materially different user-visible version/state. The owner must then explicitly approve the complete screenshot set.

No implicit approval. No approval-by-silence. No substitution of internal QA for owner review.

## How to use this index

- `EXISTING QA` is internal evidence only and may be reused only if unchanged after final-main reconciliation.
- `REFRESH REQUIRED` means the composition changed or the retained screenshot reference is insufficient.
- `OPEN` means final owner-review evidence does not yet exist.
- `Owner approved` becomes `YES` only after explicit owner approval of that exact final screenshot.

One review sheet may satisfy several state rows only when every state is independently readable at approval scale. Responsive duplicates are required only when geometry, density, art visibility or control placement materially changes.

## Routed screens

| ID | Surface / version | Why materially distinct | Required viewport | Evidence status | Owner approved |
| --- | --- | --- | --- | --- | --- |
| H-1 | Home — wide dual-character presentation | A02 Daniel left + A01 Nik right; full wide landing architecture | wide desktop | OPEN after exact A01/A02 render access | NO |
| H-2 | Home — reduced-wide / Chromebook | large characters omitted; menu geometry changes before mobile | Chromebook/reduced-wide | OPEN | NO |
| H-3 | Home — mobile | characters omitted; stacked primary actions / media geometry | 390px mobile | OPEN | NO |
| H-4 | Home — Audius compact player integrated | final Showdown Radio state inside actual Home composition | wide or Chromebook | OPEN after Audius/Home reconciliation | NO |
| 02-1 | Create Showdown — default wide | full form/season choice hierarchy | 1600×900 | EXISTING QA `01a08bb7-6c59-7f5c-a6af-85c5fd2020ff`; refresh if final changes | NO |
| 02-2 | Create Showdown — mobile | 2×2 season grid and stacked fields | 390×844 | EXISTING QA `01a08bb7-e245-7fed-8913-3c0736478844`; refresh if final changes | NO |
| 02-3 | Create Showdown — validation/error | only if final runtime validation creates materially distinct treatment | representative | OPEN / conditional | NO |
| 03-1 | League Wheel — ready | pre-spin hierarchy / safe zone | wide | OPEN | NO |
| 03-2 | League Wheel — active/resolved | motion/selection result materially changes state | wide + reduced motion if different | OPEN | NO |
| 03-3 | League Wheel — shared host/peer/waiting | runtime-reachable distinct shared state | representative | OPEN | NO |
| 04-1 | Club Assignment — sealed packs | both manager packs unopened | wide | OPEN | NO |
| 04-2 | Club Assignment — reveal progression | one/both pack reveal state | wide | OPEN | NO |
| 04-3 | Club Assignment — rivalry locked | permanent clubs confirmation | wide/mobile representative | OPEN | NO |
| 05-1 | Showdown Home Dashboard — active season | ordinary in-progress dashboard | wide | OPEN | NO |
| 05-2 | Dashboard — later Multi Season | Season 2+ / last-season / progression presentation | wide/mobile representative | OPEN | NO |
| 05-3 | Dashboard — completed/terminal | only if terminal dashboard visibly differs from summary/Legacy | representative | OPEN / conditional | NO |
| 06-1 | Transfer Challenge — ready/privacy | pre-window instructions / equal managers | wide | OPEN | NO |
| 06-2 | Transfer Challenge — active | live timer + signing/guess entry | wide/mobile representative | OPEN | NO |
| 06-3 | Transfer Challenge — verdict/release resolution | post-window result and release semantics | wide/mobile representative | OPEN | NO |
| 07A-1 | Local Season Results — incomplete entry | validation / required fields when materially visible | representative | OPEN | NO |
| 07A-2 | Local Season Results — completed/ready | full local result entry | wide/mobile representative | OPEN | NO |
| 07B-1 | Shared Season Results — canonical review sheet | published managers + commit + canonical score + history | 1600×1100 | EXISTING QA `01a08bb8-b035-7fb2-8cbb-7466818f0554` | NO |
| 07B-2 | Shared Season Results — mobile exact composition | one-column authority order | 390px | EXISTING QA `01a08bc5-c225-763c-b0ea-84cfe7c774b9` | NO |
| 07B-3 | Shared Multi Season — history not witnessed | Continue blocked pending history visibility | may share final review sheet | EXISTING inside 07B review | NO |
| 07B-4 | Shared Multi Season — ready to continue | history converged and next-season action available | may share final review sheet | EXISTING inside 07B review | NO |
| 07B-5 | Shared Multi Season — season-plan terminal | all planned seasons accepted; Final Reconciliation remains separate | may share final review sheet | EXISTING inside 07B review | NO |
| 08-1 | Season Summary — winner | winner hierarchy and next action | wide/mobile representative | OPEN | NO |
| 08-2 | Season Summary — draw | no false winner emphasis | representative | OPEN | NO |
| 08-3 | Season Summary — terminal showdown | final-season action hierarchy differs | representative | OPEN | NO |
| 09-1 | Rivalry Statistics — populated | standard comparative analytics | wide | OPEN | NO |
| 09-2 | Rivalry Statistics — sparse/tied | no misleading dominant manager | mobile or representative | OPEN | NO |
| 10-1 | Career Statistics — empty | no saved/completed career data | representative | OPEN | NO |
| 10-2 | Career Statistics — populated | cumulative manager comparison / honours | wide | OPEN | NO |
| 10-3 | Career Statistics — unresolved/partial | only if final product exposes materially distinct unresolved state | representative | OPEN / conditional | NO |
| 11-1 | Trophy Room — empty | no invented trophies | representative | OPEN | NO |
| 11-2 | Trophy Room — populated | original generic trophy symbols + actual honours | wide/mobile representative | OPEN | NO |
| 12-1 | Legacy — normal/populated | archive + data management contrast boundary | 1600×900 | EXISTING QA `01a08bb9-d628-71c1-bea3-b5d7d4620b0c` | NO |
| 12-2 | Legacy — mobile | responsive data-management readability | 390px | REFRESH REQUIRED | NO |
| 12-3 | Legacy — corrupt/fail-closed/import issue | destructive/data-safety state if runtime reachable | representative | OPEN | NO |
| 13-1 | Rule Book — standard | scoring and competition rules | wide | OPEN | NO |
| 13-2 | Rule Book — mobile/long copy | text density and navigation | 390px | OPEN | NO |

## Substantial non-route surfaces

| ID | Surface / version | Why materially distinct | Required viewport | Evidence status | Owner approved |
| --- | --- | --- | --- | --- | --- |
| 20-1 | Save Library / Settings — populated desktop | active save, profiles, settings hierarchy | wide | OPEN final capture | NO |
| 20-2 | Save Library / Settings — mobile | stacked dialog, destructive separation, profile readability | 390px | EXISTING QA `01a08bc7-1b03-7785-a02b-dffd05df54ed` | NO |
| 20-3 | Save Library — delete confirmation / empty | only if final runtime exposes materially distinct dialog/state | representative | OPEN / conditional | NO |
| 21-1 | Connected Account / Pairing | signed-in + registered device + one-use pairing | wide | OPEN | NO |
| 21-2 | Connected / Remote Joining — mobile | stacked capability/revision/recovery presentation | 390px | EXISTING QA `01a08bc5-0e0f-7dc1-b992-5944186c9756` | NO |
| 21-3 | Remote observed vs Local applied | reconciliation preview distinction | may share 21 sheet | EXISTING inside mobile review | NO |
| 21-4 | Recovery pending / unresolved Join | distinct from fresh Join | representative | OPEN final state capture | NO |
| 22-1 | Restore — verify/snapshot/incomplete plan | no mutation + Apply disabled | 1600×900 | EXISTING QA `01a08bba-8475-743a-ae79-d11cec41d6f9` | NO |
| 22-2 | Restore — mobile | safety hierarchy at 390px | 390px | REFRESH REQUIRED | NO |
| 22-3 | Restore — apply-ready | explicit confirmation state | representative | OPEN | NO |
| 22-4 | Critical Recovery / conflict | reserved destructive-risk hierarchy | representative | OPEN | NO |
| 23-1 | Cross-product Empty | shared state grammar | representative | OPEN | NO |
| 23-2 | Cross-product Error | error without false data-loss implication | representative | OPEN | NO |
| 23-3 | Offline / provider unavailable | local Career availability remains clear | representative | OPEN | NO |
| 23-4 | Update state | application update treatment | representative | OPEN | NO |
| 23-5 | Reduced Motion | visible treatment only where materially different | representative | OPEN | NO |
| 24-1 | Startup presentation | loading/startup visual architecture | wide/mobile representative | OPEN | NO |
| 24-2 | Header / runtime notice | normal + meaningful runtime notice | representative | OPEN | NO |

## r14 Journey Reconnect

These rows are derived from the real r14 protocol and production status surface, not invented future states.

| ID | Surface / version | Why materially distinct | Required viewport | Evidence status | Owner approved |
| --- | --- | --- | --- | --- | --- |
| JR-1 | Journey Reconnect — `OFFLINE_HOLD` | durable journey preserved while provider authority is deliberately not claimed | review sheet / representative | OPEN | NO |
| JR-2 | Journey Reconnect — `RECOVERY_PENDING` | exact private-session operation unresolved | review sheet / representative | OPEN | NO |
| JR-3 | Journey Reconnect — `FRESH_SESSION_REQUIRED` resumable | preserved journey + expired/missing session action requirement | review sheet + 390px representative | OPEN | NO |
| JR-4 | Journey Reconnect — `ACTIVE_RECOVERED` | active season/history resumed without reset/redraw | review sheet / representative | OPEN | NO |
| JR-5 | Journey Reconnect — `TERMINAL_RECOVERED` | terminal plan cannot be resurrected by new session | review sheet / representative | OPEN | NO |

Prototype authority: `prototypes/28-journey-reconnect-r14-reference.html`.

## Media player surface — current Audius-first authority

Earlier native/YouTube and SoundCloud-first screenshot evidence is historical exploration. It does not satisfy the final owner gate after the Audius-first architecture decision.

| ID | Surface / version | Why materially distinct | Required viewport | Evidence status | Owner approved |
| --- | --- | --- | --- | --- | --- |
| M-1 | Showdown Radio / Audius — ready + compact queue | current primary audio-only architecture before playback | wide/Chromebook | OPEN | NO |
| M-2 | Showdown Radio / Audius — playing + paused | real HTML-audio state and transport | wide + 390px if geometry differs | OPEN | NO |
| M-3 | Showdown Radio / Audius — buffering/error/offline | fail-closed media state without app failure or paid fallback | representative | OPEN | NO |
| M-4 | Audius queue — track switch | selected row, source attribution, one-player reuse | desktop/mobile representative | OPEN | NO |
| M-5 | FIFA 17 Picks / SoundCloud — Full vs Preview | optional exact-song nostalgia; preview limitation explicit | representative if retained | OPEN | NO |
| M-6 | FIFA 17 gameplay trailer — YouTube video | video is intentional and separate from music | representative if retained | OPEN | NO |
| M-7 | Home — final integrated Audius player | compact Showdown Radio inside the actual Home composition | wide + 390px when geometry changes | OPEN | NO |

Functional/reference authority: `prototypes/27-audius-showdown-radio-reference.html`.

Historical internal media QA retained for comparison only:

- old native review desktop `01a08be3-8a1c-71c1-a33c-4896cd7ef504`;
- old native review mobile `01a08be4-10db-7751-9912-38f553d08602`.

They are not owner-final Audius screenshots.

## Final product-drift additions

Production is now reconciled through main `97c28b1efea6ee6e901e6076a834ec419cbad5aa` / r14 for Journey Reconnect.

If `main` advances again before final owner review, add only real user-visible deltas and refresh affected screenshots. Do not restart unaffected proposal work.

## Final capture quality rules

Every final approval screenshot must:

- come from the final reconciled composition;
- identify viewport/device class;
- preserve readable text without pinch zoom;
- contain no accidental renderer/provider overlay;
- preserve Manager 1 = Daniel and Manager 2 = Nik;
- use exact frozen A01/A02 masters wherever Home wide requires them;
- preserve rights-safe/provenance rules;
- contain no invented capability;
- show disabled/waiting/error state through text/structure, not opacity alone;
- receive a stable evidence ID/URL or repository-backed screenshot asset.

Media screenshots additionally disclose the active provider and whether content is full, preview, unavailable or video.

## Final owner review procedure

1. finish final-main reconciliation;
2. capture every required final row;
3. assemble screenshots in product journey order;
4. group materially different states beneath their page/surface;
5. disclose media provider/functionality and final track list;
6. present the complete set to the owner;
7. allow approval/rejection/change request per page/state;
8. replace rejected screenshots after revision;
9. mark `Owner approved = YES` only for explicitly accepted exact images;
10. call the proposal `FINAL` only when every required row is approved and all other final gates are closed.

Current finality status:

`NOT FINAL — AUDIUS DEVICE/TASTE PROOF OPEN / SCREENSHOT SET INCOMPLETE / OWNER APPROVAL OPEN / FUTURE FINAL-MAIN RECHECK REQUIRED`.
