# R88/R87 Prime Pack: Icons missing from ICON-01 (check of 2026-11-01)

Claude checked the 145 ICON-01 players against the male outfield Legend and Icon rosters of every allowed game (Nik 2026-11-01: the list is the Icons we have plus any Icon we were missing, plus base Heroes and Hall of FUT). Read-only web research; FUT.GG was the only card database reachable from this environment (FUTWIZ, FUTBIN, OvrUp and FIFPlay card pages were blocked or refused).

## Result

One player was missing: **Pep Guardiola** (`pep-guardiola`), added with his Prime Icon card, FIFA 22, CDM 90 (PAC 78, SHO 65, PAS 88, DRI 81, DEF 88, PHY 83), card page https://www.fut.gg/players/243781-guardiola/22-243781/. He was an Icon in FIFA 20 to 22 only, with the same Prime 90 card each year, so the newer game wins the tie. Base 85 / Mid 87 / Prime 90 per the FIFA 20 reveal; the 91 cards are Prime Icon Moments and are excluded. Files: `R88_ICON_03_missing_icons.csv`, `R88_ICON_03_missing_icon_cards.csv`.

None of the Hero or Hall of FUT players has an allowed Legend or Icon card. Players who moved from Hero to Icon (Yaya Touré, Lúcio, Maicon) were already in the 145.

## How the rosters were built (whole list / male outfield)

| Game | Source | Players |
|---|---|---|
| FIFA 15 Legends | fifauteam launch list | 56 / 52 |
| FIFA 16 Legends | fifarosters (same list as FIFA 17) | 76 / 71 |
| FIFA 17 Legends | fifarosters | 76 / 71 |
| FIFA 18 Icons | fifauteam launch list | 40 / 37 |
| FIFA 19 Icons | gamewave list | 74 / 70 |
| FIFA 20 Icons | fifplay | 86 / 83 |
| FIFA 21 Icons | fifplay | 95 / 90 |
| FIFA 22 Icons | fifplay | 105 / 100 |
| FIFA 23 Prime Icons | fifplay | 100 / 95 |
| FC 24 Icons | fifplay | about 100 / 95 |
| FC 25 Icons | fifplay | 112 / 95 |
| FC 26 Icons | fifplay and the fifauteam tracker | 126 / about 103 |
| FC 27 Base Icons | FUT.GG base-icon pages, fifplay, fifauteam tracker | 124 to 136 / about 100 |

Names were matched against the 145 by full name, card name, accepted names and surname, ignoring accents.

## Ruled out

| Name | Where it came from | Why |
|---|---|---|
| Andy Cole | fifplay FIFA 21 list | Mislabel for Ashley Cole; no Andy Cole Icon card |
| "Pablo Hernández" | gamewave FIFA 19 list | Mislabel for Luis Hernández |
| Dirk Kuyt, Claudio Marchisio | fifplay FC 26 list | Hero cards only on FUT.GG |
| John Arne Riise | FC 27 rumour | His FC 27 card is a base Hero 86 (in the Hero list) |
| Arjen Robben, David Silva, Michel Platini, Paolo Rossi | "in testing" or rumoured for FC 26/27 | No Icon card on FUT.GG |

## Doubts

- FC 24 and FC 25 rosters come from fifplay only; FUT.GG's older lists need filters that could not be applied here. Every name on them is already in the list.
- Several rosters are launch lists, so an Icon added mid-season could be missing. A cross-check of FUT.GG's "last card in FIFA 22/23" lists found no other Icon.
- If Robben, Silva, Platini or Rossi get a Base Icon later in FC 27, they would need adding (with a new `LIST_VERSION` once released).
