# 1610P · clean premium backgrounds (plates V2)

The approved premium desktop pictures (NEXT_<KEY>.png) with every button, card, title and word removed, so the live game can draw its real UI on top. Same cyan-repaint method as the V1 plates (tickets 023-029).

Nik runs one ticket per screen in a brand-new normal ChatGPT chat outside any project (Temporary Chats cannot make pictures) and drops the result in the factory thread as `1610P <KEY>`. Tickets rewritten 12 Oct 9:25 a.m. Eastern: GPT kept redrawing the whole game screen, so the prompt now asks only for an empty background, and the check fails any picture with a title, card, button, top bar or game words. Claude puts the exact approved faces back at intake (likeness lock), so small face changes by GPT don't matter.

| # | Screen | Ticket |
| --- | --- | --- |
| 1 | Home | DONE 12 Oct (ENV_HOME_PLATE_V2) |
| 2 | Connect Players | DONE 12 Oct (ENV_CONNECT_PLAYERS_PLATE_V2) |
| 3 | Season Results | DONE 12 Oct (ENV_SEASON_RESULTS_PLATE_V2) |
| 4 | Transfer War | DONE 12 Oct (ENV_TRANSFER_PLATE_V2) |
| 5 | Select League | DONE 12 Oct (ENV_LEAGUE_PLATE_V2) |
| 6 | Club Assignment | DONE 12 Oct (ENV_CLUB_PLATE_V2) |
| 7 | Career Statistics | DONE 12 Oct (ENV_STATISTICS_PLATE_V2) |
| 8 | Rivalry Statistics | DONE 12 Oct (ENV_RIVALRY_PLATE_V2) |
| 9 | Legacy | DONE 12 Oct (ENV_LEGACY_PLATE_V2) |
| 10 | Trophy Room | DONE 12 Oct (ENV_TROPHY_ROOM_PLATE_V2) |
| 11 | Settings | DONE 12 Oct (ENV_SETTINGS_PLATE_V2) |
| 12 | Final Winner | DONE 12 Oct (ENV_FINAL_WINNER_PLATE_V2) |
| 13 | Rule Book | DONE 12 Oct (ENV_RULE_BOOK_PLATE_V2) |
| 14 | Standings | DONE 12 Oct (ENV_STANDINGS_PLATE_V2) |

Removed areas per screen (1X px on the 1536x864 picture): tools in the lead's scratchpad, guides in attach/GUIDE_<KEY>_PLATE_V2.png (black bars 80 px top and bottom).

Kept on purpose: the managers, banners, handwritten name tags, the League marble plinth, and the Trophy Room and Final Winner pedestals (left empty for the live trophy art). The Club packs stay in the men's hands with the badge circles blanked, so the live badge can sit on them.

Intake (Team V lead):
- likeness lock with tools/plates_v2/lock.py (GPT pixels only inside the cyan boxes, grown 12 px; everything else from NEXT_<KEY>);
- check: no UI left, no cyan, no new words;
- save visual-assets/v10_1/plates-v2/ENV_<KEY>_PLATE_V2_1X.webp (1536x864) and _2X.webp (3072x1728, Lanczos upscale);
- tell the Team G lead the path.
