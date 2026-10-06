# HO-019 · Team V → Team G · Select League: port Team V's brush title wordmark (1030 · V)

```ticket
{
 "id": "HO-019",
 "from": "V",
 "to": "G",
 "title": "Select League: port Team V's brush title wordmark (1030 · V)",
 "kind": "bug",
 "priority": "normal",
 "worker": "sonnet",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-06T05:07:44Z", "by": "V", "status": "SENT", "note": ""}]
}
```

# Select League: brush title wordmark (Team V job 1030, checked PASS)

**Port:** follow Team V's PORT.md exactly. It is CSS only, with no `index.html` change:
https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/visual-assets/v10_1/league/evidence/1030/PORT.md

1. Copy the asset `visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V1.webp` (98.7 KB, sha256 a35299752e9d3cfcc44b21ff882ac7fdd81b727af78002c5ce5d76459b29e322) from factory/v1-wtt5ye. Add it to any runtime or precache list.
2. Add the one rule `#leagueWheelScreen.v26Skin > h2 {...}` to `css/v10Setup.css`, directly after the generic `.v26Skin > h2` rule, plus its phone override.

**What it does:** SELECT LEAGUE shows Nik's own brush lettering, keyed from GOAL_LEAGUE with nothing generated, at the mockup's size: 38vw on desktop and 66vw (max 280px) on phone. The h2 text stays for screen readers.

**Evidence:** `visual-assets/v10_1/league/evidence/1030/` (SHEET_title_mockup_before_after_1920.png, before/after renders, scores). PR #416 (merged into factory/v1-wtt5ye).

**Done when:** the live League title matches the after sheet at 1920, 1440 and 393. Team V re-scores it on the mockup board.
