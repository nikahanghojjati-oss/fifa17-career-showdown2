# R8 Final Screenshot Approval Index

Status: HARD FINALITY GATE — OPEN

Owner rule established 2026-09-10:

The visual proposal is not `FINAL` merely because contracts, prototypes and internal QA are complete. Before final status, the owner must receive screenshots of every built page / substantial non-route surface and every materially different user-visible version/state. The owner must then explicitly approve the complete screenshot set.

No implicit approval. No approval-by-silence. No substitution of internal QA for owner review.

## How to use this index

For every row below:

- `Required` means a materially distinct screenshot belongs in the final approval package.
- `Existing QA` means an internal screenshot already exists and may be reused only if it still matches the final proposal after final-main reconciliation.
- `Refresh` means an older screenshot exists but must be rendered again after later proposal changes or because its retained evidence is incomplete.
- `Open` means the final owner-review screenshot has not yet been captured.
- `Owner approved` may become `YES` only after the owner explicitly approves the final screenshot represented by that row.

A single review-sheet image may satisfy multiple rows only when it visibly contains each required state at final quality and the owner can evaluate each state independently.

Desktop, Chromebook/reduced-wide and mobile variants do not need mechanically duplicated screenshots when responsive geometry is materially identical. They do require separate screenshots when layout, character art, control placement, density or visibility changes.

## Routed screens

| ID | Surface / version | Why materially distinct | Required viewport | Evidence status | Owner approved |
| --- | --- | --- | --- | --- | --- |
| H-1 | Home — wide dual-character presentation | A02 Daniel left + A01 Nik right; full wide landing architecture | wide desktop | OPEN after exact A01/A02 packaging | NO |
| H-2 | Home — reduced-wide / Chromebook | character treatment and menu geometry change before mobile | Chromebook/reduced-wide | OPEN | NO |
| H-3 | Home — mobile | characters omitted; stacked primary actions / media geometry | 390px mobile | OPEN | NO |
| H-4 | Home — media native compact state | Showdown Radio integrated into actual Home composition | wide or Chromebook | OPEN after media integration reconciliation | NO |
| 02-1 | Create Showdown — default wide | full form/season choice hierarchy | 1600×900 | EXISTING QA `01a08bb7-6c59-7f5c-a6af-85c5fd2020ff`; refresh only if final changes | NO |
| 02-2 | Create Showdown — mobile | 2×2 season grid and stacked fields | 390×844 | EXISTING QA `01a08bb7-e245-7fed-8913-3c0736478844`; refresh only if final changes | NO |
| 02-3 | Create Showdown — validation/error | only if final real-DOM validation creates materially different visible treatment | responsive representative | OPEN / conditional | NO |
| 03-1 | League Wheel — ready | pre-spin hierarchy / safe zone | wide | OPEN | NO |
| 03-2 | League Wheel — active/resolved | wheel motion/selection result treatment materially changes state | wide + reduced motion if different | OPEN | NO |
| 03-3 | League Wheel — shared host/peer/waiting | only runtime-reachable distinct shared state | representative | OPEN | NO |
| 04-1 | Club Assignment — sealed packs | both manager packs unopened | wide | OPEN | NO |
| 04-2 | Club Assignment — reveal progression | one/both pack reveal state | wide | OPEN | NO |
| 04-3 | Club Assignment — rivalry locked | final permanent clubs confirmation | wide/mobile representative | OPEN | NO |
| 05-1 | Showdown Home Dashboard — active season | ordinary in-progress dashboard | wide | OPEN | NO |
| 05-2 | Dashboard — later Multi Season | r13 Season 2+ / last-season / progression presentation | wide/mobile representative | OPEN | NO |
| 05-3 | Dashboard — completed/terminal | only if terminal dashboard visibly differs from summary/Legacy | representative | OPEN / conditional | NO |
| 06-1 | Transfer Challenge — ready/privacy | pre-window instructions / equal managers | wide | OPEN | NO |
| 06-2 | Transfer Challenge — active | live timer + signing/guess entry | wide/mobile representative | OPEN | NO |
| 06-3 | Transfer Challenge — verdict/release resolution | post-window result and required release semantics | wide/mobile representative | OPEN | NO |
| 07A-1 | Local Season Results — incomplete entry | validation / required fields if materially visible | representative | OPEN | NO |
| 07A-2 | Local Season Results — completed/ready | full local result entry | wide/mobile representative | OPEN | NO |
| 07B-1 | Shared Season Results — canonical review sheet | published managers + commit + canonical score + history | 1600×1100 | EXISTING QA `01a08bb8-b035-7fb2-8cbb-7466818f0554` | NO |
| 07B-2 | Shared Season Results — mobile exact composition | one-column authority order | 390px | EXISTING QA `01a08bc5-c225-763c-b0ea-84cfe7c774b9` | NO |
| 07B-3 | Shared Multi Season — history not witnessed | Continue blocked pending history visibility | may share final review sheet | EXISTING inside 07B review | NO |
| 07B-4 | Shared Multi Season — ready to continue | history converged and next-season action available | may share final review sheet | EXISTING inside 07B review | NO |
| 07B-5 | Shared Multi Season — season-plan terminal | all planned seasons accepted, Final Reconciliation separate | may share final review sheet | EXISTING inside 07B review | NO |
| 08-1 | Season Summary — winner | winner hierarchy and next action | wide/mobile representative | OPEN | NO |
| 08-2 | Season Summary — draw | no false winner emphasis | representative | OPEN | NO |
| 08-3 | Season Summary — terminal showdown | final-season action hierarchy differs from continuing season | representative | OPEN | NO |
| 09-1 | Rivalry Statistics — populated | standard comparative analytics | wide | OPEN | NO |
| 09-2 | Rivalry Statistics — sparse/tied | no misleading dominant manager, low-data state | mobile or representative | OPEN | NO |
| 10-1 | Career Statistics — empty | no saved/completed career data | representative | OPEN | NO |
| 10-2 | Career Statistics — populated | cumulative manager comparison / honours | wide | OPEN | NO |
| 10-3 | Career Statistics — unresolved/partial | only if product exposes a materially distinct unresolved state | representative | OPEN / conditional | NO |
| 11-1 | Trophy Room — empty | no invented trophies | representative | OPEN | NO |
| 11-2 | Trophy Room — populated | generic original trophy-symbol family + actual honours | wide/mobile representative | OPEN | NO |
| 12-1 | Legacy — normal/populated | archive + data management contrast boundary | 1600×900 | EXISTING QA `01a08bb9-d628-71c1-bea3-b5d7d4620b0c` | NO |
| 12-2 | Legacy — mobile | responsive data-management readability | 390px | REFRESH REQUIRED; old pass ID not retained | NO |
| 12-3 | Legacy — corrupt/fail-closed/import issue | destructive/data-safety state if runtime reachable | representative | OPEN | NO |
| 13-1 | Rule Book — standard | scoring and competition rules | wide | OPEN | NO |
| 13-2 | Rule Book — mobile/long copy | text density and navigation | 390px | OPEN | NO |

## Substantial non-route surfaces

| ID | Surface / version | Why materially distinct | Required viewport | Evidence status | Owner approved |
| --- | --- | --- | --- | --- | --- |
| 20-1 | Save Library / Settings — populated desktop | active save, profiles, settings dialog hierarchy | wide | OPEN final capture | NO |
| 20-2 | Save Library / Settings — mobile | stacked dialog, destructive separation, profile readability | 390px | EXISTING QA `01a08bc7-1b03-7785-a02b-dffd05df54ed` | NO |
| 20-3 | Save Library — delete confirmation / empty | capture only if final runtime exposes materially different dialog/state | representative | OPEN / conditional | NO |
| 21-1 | Connected Account / Pairing | signed-in + registered device + one-use pairing | wide | OPEN | NO |
| 21-2 | Connected / Remote Joining — mobile | stacked capability/revision/recovery presentation | 390px | EXISTING QA `01a08bc5-0e0f-7dc1-b992-5944186c9756` | NO |
| 21-3 | Remote observed vs Local applied | reconciliation preview distinction | may share 21 review sheet | EXISTING inside mobile review | NO |
| 21-4 | Recovery pending / unresolved Join | distinct from fresh Join; exact capability preserved | may share review sheet if clear | EXISTING visual warning, final state screenshot still OPEN | NO |
| 22-1 | Restore — verify/snapshot/incomplete plan | no mutation + Apply disabled | 1600×900 | EXISTING QA `01a08bba-8475-743a-ae79-d11cec41d6f9` | NO |
| 22-2 | Restore — mobile | same safety hierarchy at 390px | 390px | REFRESH REQUIRED; old pass ID not retained | NO |
| 22-3 | Restore — apply-ready | explicit confirmation state if materially distinct | representative | OPEN | NO |
| 22-4 | Critical Recovery / conflict | reserved destructive-risk hierarchy | representative | OPEN final state capture | NO |
| 23-1 | Cross-product Empty | shared state grammar | representative | OPEN | NO |
| 23-2 | Cross-product Error | error without false data loss | representative | OPEN | NO |
| 23-3 | Offline / provider unavailable | local Career availability remains clear | representative | OPEN | NO |
| 23-4 | Update state | application update treatment | representative | OPEN | NO |
| 23-5 | Reduced Motion | visible state where treatment differs materially | representative | OPEN | NO |
| 24-1 | Startup presentation | loading/startup visual architecture | wide/mobile representative | OPEN | NO |
| 24-2 | Header / runtime notice | normal + meaningful runtime notice | representative | OPEN | NO |

## Media player surface

| ID | Surface / version | Why materially distinct | Required viewport | Evidence status | Owner approved |
| --- | --- | --- | --- | --- | --- |
| 25-1 | Showdown Radio — native playing + expanded queue | new recommended free default music architecture | 1600×1200 review sheet | EXISTING QA `01a08be3-8a1c-71c1-a33c-4896cd7ef504` | NO |
| 25-2 | Showdown Radio — mobile | transport/queue/provider stack at 390px | 390×2400 | EXISTING QA `01a08be4-10db-7751-9912-38f553d08602` | NO |
| 25-3 | FIFA 17 Originals — provider mode | commercial originals remain provider-backed and visibly separate | may share final media sheet if unchanged | EXISTING inside 25-1/25-2 | NO |
| 25-4 | Track unavailable/offline | native media failure without breaking Home | may share final media sheet if unchanged | EXISTING inside 25-1/25-2 | NO |
| 25-5 | Native ready/paused compact Home integration | differs from review-sheet expanded player and must be shown in actual Home | Home representative | OPEN | NO |

## Final product-drift additions

The main developer is still advancing the product. Any new user-visible screen/state created after r13 must be added here during final-main reconciliation.

Known expected next area at the current stopping point:

- MDP100 / Journey Reconnect.

Do not pre-invent its final screenshot rows. Add them only after its actual production UI/state contract exists.

## Final capture quality rules

Every final approval screenshot must:

- come from the final reconciled proposal composition, not an obsolete exploratory transcription;
- identify its viewport/device class;
- preserve readable text without pinch zoom;
- include no accidental browser/provider overlays unrelated to the proposed state;
- make Manager 1 = Daniel and Manager 2 = Nik correct wherever manager labels appear;
- use exact frozen A01/A02 masters wherever the Home character composition requires them;
- preserve rights-safe/provenance rules;
- contain no invented product capability;
- show disabled/waiting/error states through text and structure, not opacity alone;
- receive a stable evidence ID/URL or repository-backed screenshot asset so the owner is approving a specific image.

## Final owner review procedure

When all rows are ready after final-main reconciliation:

1. assemble the screenshots in screen order;
2. group multiple states under the same page heading;
3. present the full set to the owner, not a cherry-picked highlight reel;
4. allow the owner to approve, reject or request changes by page/state;
5. revise rejected states and replace their screenshots;
6. mark `Owner approved = YES` only for explicitly accepted final images;
7. call the proposal `FINAL` only when every required row is approved and all other final gates are also closed.

Current finality status: `NOT FINAL — SCREENSHOT SET INCOMPLETE / OWNER APPROVAL NOT YET REQUESTED`.
