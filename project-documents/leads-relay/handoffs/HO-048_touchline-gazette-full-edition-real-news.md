# HO-048 · Team V → Team G · Touchline Gazette full edition: real newspaper copy, stories and commentary (r87)

```ticket
{
 "id": "HO-048",
 "from": "V",
 "to": "G",
 "title": "Touchline Gazette full edition: real newspaper copy, stories and commentary (r87)",
 "kind": "build",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-31T01:52:26Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-31T02:01:58Z", "by": "G", "status": "RECEIVED", "note": "r87 lead: building it now (branch claude-gameplay/r87-gazette); season edition after each Season Results, final after Final Winner (Nik 01:28 UTC). Paper text deterministic per Showdown+season so both phones match."}]
}
```

# Touchline Gazette full edition: real copy for the newspaper and commentary (r87)

**From:** Team V (thread "Gazette full edition") · **Date:** 31 Oct 2026 · **Nik:** approved the look and copy 31 Oct 01:51 UTC ("ok"), wants it finished in r87.

## What this is
The full Touchline Gazette: the newspaper front page after every season and the final page after the Showdown, with press photos, a lead story, pull quote, small print, and new commentator lines. All copy is checked (rules, meaning, fit on phone and desktop). It replaces the r86 newspaper and commentary text, which were written to old rules (Europa +3, Golden = 10 seasons, big win 10+).

## Where
Branch `claude/project-thread-fyjnky` @ `8fa67110`, folder `visual-assets/v10_1/content/`:
- `fixtures/frontPages.js` → replaces `data/frontPages.js`. Same API (`season`, `final`), `contentVersion: 2`. 477 season + 258 final headlines (kicker, headline, subhead), 12 season and 7 final situations.
- `fixtures/commentaryLines.js` → replaces `data/commentaryLines.js`. Same API. `results`: 960 new lines (40 per situation, same 24 situation names as r86). `clubs`: the r86 club lines, unchanged.
- `fixtures/gazetteCopy.js` → NEW `data/gazetteCopy.js` (`CareerModeGazetteCopy`): `stories` (114: 6 per situation, byline + 3 paragraphs + pullquote), `duets` (288 two-voice commentary lines, lead + co), `small` (briefs, captions by photo, ears, quotes; 30 each).
- `frontpage.js` + `content.css`: the full-edition paper (photo, story columns, numbers box, briefs, inside strip) and a smaller size for headlines over 24 characters.
- `gazette/GZ_*.webp` press photos and `gazette/fonts/`.
- `preview.html` frames FP1-FP3 (season), FW1-FW2 (final, golden), CM1-CM2 (commentary bar) show it all; `?pick=n` cycles variants; `?size=p` is phone.

## How to wire
1. Pick rows by `situation`, never by id (ids were renumbered). Pick at random per show, avoiding the last few used.
2. Fill `{placeholders}` exactly like r86: `{winner} {loser} {winnerClub} {loserClub} {margin}` (bare number) `{winnerPoints} {loserPoints} {seasonNo} {seasonsTotal} {leader} {trailer} {managerA} {managerB} {clubA} {clubB} {points}`.
3. Situation mapping (same names as r86): draw / level-overall / showdown-drawn = equal totals, never pick a winner row. final-season-decider = shown BEFORE the last season. golden-showdown-won = one manager first to 110. won-on-the-final-day = Showdown decided in its last season. showdown-won-1/3/5-seasons by Showdown length (10 seasons → showdown-won-5-seasons or dominant-win).
4. Commentary lines are at most 92 characters so the phone bar keeps Continue on screen. Duets need a two-line bar (lead, then co).
5. Lazy-load `gazetteCopy.js` with the front page (gzip about 53 KB; frontPages about 43 KB, commentaryLines about 45 KB).

## Done when
Season front page and Final Winner page in the live game show real copy from these files, both desktop and phone (393×660, 375×553), Continue visible, no `{` left on screen. Send a screenshot or the build link back on this ticket.

## Rebuild
`python3 visual-assets/v10_1/content/gazette/copy/build_copy.py` regenerates all three files from the checked batches.
