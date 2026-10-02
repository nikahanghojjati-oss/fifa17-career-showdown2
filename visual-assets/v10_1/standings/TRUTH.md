# Standings truth sheet

Job: 126. Contract: DATA_CONTRACT_V1 1.0, §§0, 5, 6, 7, 10.
Product source: main @ 2de237391e17c7de2c6deb606b102b68ee640212.
Read-only evidence: js/statistics.js, blob 08f56f577ed4ced0d195744ad9f80a6d3cd8b27a.
This document specifies a visual projection of existing models, not a new gameplay model.

## Route and views

STANDINGS is the shared navigation tab (contract §10). It stays visible in loading and unavailable states. Route through the app's navigateTo integration; no new screen id or product handler is claimed to exist on main.

- This Showdown: current Showdown head-to-head data from Rivalry Statistics (§5), through Team G's provider adapter (G-5). Default when current Showdown data is available.
- Career: Trophy Room standings (§7) from Team G G-9. Use the shared career model, not local storage or a separate read.
- Toggle selection changes the projection only. It does not start gameplay, change scores or trigger extra Firestore reads.
- Daniel is always the first/left column and first/top on phone. Nik is always second/right. A leading Nik never swaps the columns.
- Respect the shared navigation lock (§10): transfer-window, season-entry and setup show "Finish this step first" instead of leaving the live step.
- Standings is a hub: reserve the 56 px phone bottom bar plus safe area. Product Truth §7 explicitly limits that bar to hubs; the contract's broader "hidden on Loading only" sentence does not override this factory layout rule.
- No Standings mockup is specified by this job; no reference image or production art is changed here.

## Fields and scopes

E means an existing main value needing only an adapter; A means Team G must add the provider model or adapter. Fixture envelopes (version, strings, frames, view, note, previewLabel) are preview metadata, not gameplay fields.

| Visible item | Contract field | E/A | Level / scope | Display rule |
| --- | --- | --- | --- | --- |
| Availability | status | A (provider availability envelope; §0) | Selected view | loading, empty, unavailable, partial or ready |
| Manager identity | daniel / nik slot keys | E (§0) | Both views | Static labels Daniel and Nik; never account/profile ids |
| Current points | score.daniel / score.nik | E (§5) | This Showdown | App-computed cumulative accepted scores |
| Season progress | season / totalSeasons | E (§5) | This Showdown | "Season {season} of {totalSeasons}"; season is current round, not completed count |
| Season wins | per-manager seasonWins | E (§5); A for career (§6) | Selected scope | Counts only |
| Season draws | per-manager seasonDraws | E (§5); A for career (§6) | Selected scope | Counts only |
| Season losses | per-manager seasonLosses | E (§5); A for career (§6) | Selected scope | Counts only |
| Champions League wins | per-manager championsLeagues | E (§5); A (§7 cabinet) | Selected scope | Count of titles, not their 5-point score |
| League title wins | per-manager leagueTitles | E (§5); A (§7 cabinet) | Selected scope | Count of titles, not their 3-point score |
| Domestic cup wins | per-manager domesticCups | E (§5); A (§7 cabinet) | Selected scope | Count of titles |
| Total trophies | per-manager totalTrophies | E (§5); A (§7 cabinet) | Selected scope | Sum of the three title counts |
| Career points | per-manager careerPoints within standings | A (§6, §7) | Career | Sum of counted season scores |
| Career comparison | standings | A (§7, G-9) | Career | Higher careerPoints, then higher seasonWins; equal both means level |
| Partial coverage | coverage.readable / coverage.indexed | A (§6), required by §0 partial | Incomplete provider history | Show readable/indexed counts; never label this as complete career history |
| Review-only fallback | interimLabel | A (review-only envelope; §0) | Current Showdown only | Exact approved sentence; never a launch state |

This Showdown uses role-keyed managers containing the §5 counts. Career preview standings uses two role-keyed entries containing the §6/§7 values. The contract defines standings semantics but not its nested wire shape: this fixture layout is a preview representation, not a new binding provider schema. A future adapter projects Team G's delivered shape without inventing fields. Render identity order remains Daniel, Nik.

Do not add league table position, match W/D/L, games played, goal difference, league tables, win rates, Showdown wins, transfer totals, bonuses, player names or new stats to this screen. Season W/D/L describes completed seasons, never individual matches. Trophy counts are titles won.

## Leader and level

- This Showdown: highlight the higher score only. If scores match, show "Level". Season wins, trophies, league position and league points do not break a tied cumulative Showdown total.
- Career: use the §7 standings comparison: careerPoints first, seasonWins second, otherwise "Level". Higher trophy counts do not break a career tie.
- Leader/level text is derived presentation; it is not a stored winner, rank, account identity or additional contract field.
- Before anything is played, show the empty message with real zeros only after a successful read. Do not celebrate either manager or declare a final winner.
- Do not fabricate ranks or sort the managers to match rank. A tie is explicitly level, never an arbitrary Daniel win.
- The final Showdown outcome remains total points only. This screen never reuses career comparison rules to decide it.

## Data and privacy

Use acknowledged provider seasons only. Active and completion-pending Showdowns contribute accepted seasons to career points, W/D/L and trophies; Showdown outcomes count only after verified Terminal Close. Abandoned Showdowns contribute nothing, including previously accepted seasons. Rebuild career aggregates after abandonment. No historical backfill. Unreadable Showdowns contribute no invented records.

Main's renderRivalryComparison at lines 366–401 supplies the current head-to-head labels and existing totalPoints/count mapping. createCareerStandingsTable at lines 170–204 is a legacy visual reference; its positional rank, profileId, Showdown W/D/L and totalPoints property are not copied into this provider-facing screen. Contract score and careerPoints names are used instead. Main's empty text at line 511 is retained exactly for no current Showdown. Season Losses is new screen copy for an existing §5 field, not a newly recorded statistic.

No private guesses, signings or unpublished rival season inputs appear in any frame. Counters update only from acknowledged public model data. Fixture values are fictional and visibly labelled "Preview data"; they are never substituted into production.

## Five states

| status | This Showdown | Career |
| --- | --- | --- |
| loading | Show loading message/skeleton; no numeric values or leader | Same; selection and shared navigation remain reachable |
| empty | Successful read, no active Showdown: exact existing no-active message. A valid first season with nothing played may show confirmed zero totals and the no-season message | Successful read, new career: empty message; no invented standings |
| partial | Only provider-confirmed readable data, coverage visible; if current data is unreadable render unavailable | Use "Available history", show coverage; never "Career standings", "all-time", complete totals or an overall career leader. Available subset values may be shown without winner emphasis |
| unavailable | Read failed: explicit unavailable message; absent data is not zero | Same; do not relabel failure as new career or silently use local data |
| ready | Confirmed current totals, progress, W/D/L and trophies; derived score comparison | Provider standings and allowed career comparison |

Loading and unavailable payloads omit score, counts, standings and coverage unless coverage genuinely exists. Empty differs from failed. A level comparison only appears with readable values.

Before provider history is real, owner review can select Career but show the current-Showdown projection with interimLabel exactly "Current Showdown only. Career history is not yet available." Keep the section headed "This Showdown", use score rather than careerPoints, do not claim a career ranking, and never ship this interim mode.

## Build obligations

All dynamic labels, values and manager identities are semantic live DOM. No names or numbers baked into art. Original rights-safe art only; no real logos, trophies or player images. All controls keyboard reachable and labelled; announce changes and state messages without relying on gold highlight alone.

Phone: 393 × 660 and 360 × 640 without page scroll; primary control visible at 375 × 553. Daniel first, Nik second. Reserve hub navigation height. Typography/body contrast and touch targets follow QUALITY_BAR. This job contains truth and fixtures only; screenshots, responsive fit and visual-score gates belong to build job 127.

## Exact strings

The following dictionary is copied into fixtures.json. Existing current comparison labels are copied word for word from main renderRivalryComparison; no-active and no-season messages from renderRivalryStatistics/renderSeasonProgression are retained. New Standings-only headings, Season Losses, toggle and availability copy are Team V-owned presentation (§10), not claims that main already contains these strings. Manager labels are static product identities.

```json
{
  "heading": "STANDINGS",
  "viewThisShowdown": "This Showdown",
  "viewCareer": "Career",
  "sectionThisShowdown": "HEAD-TO-HEAD",
  "sectionCareer": "CAREER STANDINGS",
  "sectionPartial": "Available history",
  "sectionInterim": "This Showdown",
  "managers": {
    "daniel": "Daniel",
    "nik": "Nik"
  },
  "fields": {
    "score": "Showdown Points",
    "careerPoints": "Career Points",
    "seasonWins": "Season Wins",
    "seasonDraws": "Season Draws",
    "seasonLosses": "Season Losses",
    "totalTrophies": "Total Trophies",
    "championsLeagues": "Champions Leagues",
    "leagueTitles": "League Titles",
    "domesticCups": "Domestic Cups"
  },
  "seasonTemplate": "Season {season} of {totalSeasons}",
  "level": "Level",
  "leaderTemplate": "{manager} leads",
  "leaderSeasonWinsTemplate": "{manager} leads on season wins",
  "emptyShowdown": "No active showdown is available.",
  "emptySeason": "No season has been completed yet. Statistics will build automatically as seasons are finished.",
  "emptyCareer": "Career standings will appear after the first recorded season.",
  "loading": "Loading standings.",
  "unavailable": "Standings are unavailable right now.",
  "partial": "Some Showdowns could not be read. These totals cover available history only.",
  "coverageTemplate": "{readable} of {indexed} Showdowns available.",
  "interimLabel": "Current Showdown only. Career history is not yet available.",
  "previewLabel": "Preview data",
  "navLocked": "Finish this step first"
}
```

Use sectionPartial for partial history rather than the Career heading. Interpolate only the listed model values; manager is Daniel or Nik. Neither loading nor unavailable has a leader. For equal careerPoints but unequal seasonWins use leaderSeasonWinsTemplate; for equal points and wins use level. For partial history suppress leader text entirely. No retry, export, delete, backup or other new product action is introduced.

## Fixture index and preview structure

fixtures.json follows the Home example's version/authority/strings/frames envelope. Each frame has view, previewLabel, note and a selected model. All preview labels must be rendered visibly. managers and the role-keyed standings entries are fixture grouping only, not newly agreed wire fields. Keys and rendered order are always Daniel then Nik. No rank/leader is stored; comparison is derived as specified above.

| Frame | Selected view | status | Purpose |
| --- | --- | --- | --- |
| SD1 | This Showdown | ready | Season 3 of 5; two accepted seasons, score 9 / 8 |
| SD2 | Career | ready | Points 22 / 27; Nik leads, Daniel still first |
| SD3 | This Showdown | empty | First season, no completed season; confirmed zeros |
| SD4 | Career, interim | ready | Exact interim label; only current-Showdown data |
| SD5 | Career | loading | No numbers supplied |
| SD6 | Career | unavailable | No numbers supplied |
| SD7 | Career selection, available history heading | partial | Coverage 1 of 2; no complete-career leader |
| SD8 | Career | empty | Successful new-career read; no standings |
| SD9 | Career | ready | Equal points and season wins; Level |

SD1–SD6 are the required frames. SD7–SD9 additionally exercise partial coverage, new-career empty and a true level comparison without fabricating a drawn season. SD1 and SD4 share current values, not career totals. The SD7 readable subset has equal points but different season wins; this also demonstrates why partial data must not receive complete-career leader emphasis.

All numeric scores are achievable with the unchanged 5/3/1/max-1/max-1 scoring rules. Current W/D/L totals match two completed seasons, SD2 five, SD7 three, and SD9 four. Trophies equal title counts, never weighted points. League ids and totalSeasons follow §0; no league position, points, goals or yes/no input fields are needed in these models.
