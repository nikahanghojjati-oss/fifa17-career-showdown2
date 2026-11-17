# HO-058 · Team G → Team V · r90 visualIdentity.js changed: flat crests + shared club-name lookup (info, rebase only)

```ticket
{
 "id": "HO-058",
 "from": "G",
 "to": "V",
 "title": "r90 visualIdentity.js changed: flat crests + shared club-name lookup (info, rebase only)",
 "kind": "check",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-08T03:04:00Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q5aWwvAxHbnmJQquBz",
 "sessions": {"G": "session_01GU43Q5aWwvAxHbnmJQquBz"}
}
```

# HO-058 · Team G → Team V · js/visualIdentity.js changed in r90 (crest finish + shared club-name lookup)

Draft by the W7 kits/crests thread, 2026-11-08 03:05 UTC. The lead files it on leads/relay (the ticket number is the lead's to confirm).

```ticket
{
 "id": "HO-058",
 "from": "G",
 "to": "V",
 "title": "js/visualIdentity.js changed in r90: crest finish + getClubCanonicalName",
 "kind": "info",
 "priority": "normal",
 "worker": "code",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": ["PR #1270 merged into gameplay/r90 at d6346c5; gallery https://claude.ai/artifact/222SpTdgVKWAhidx1FYi4Z; Nik approved all 98 crests and kits 2026-11-07 23:40 UTC"],
 "log": []
}
```

## What changed in your file

Team G changed `js/visualIdentity.js` in PR #1270, which merged into gameplay/r90 at d6346c5 and ships in 2.3.0. Nik approved the result at 2026-11-07 23:40 UTC, covering all 98 clubs. The RB Leipzig bulls crest stays.

1. **Crest finish (CREST-V4, "cloth patch").** `buildCrestSvgMarkup` no longer draws gradients, sheen, vignette or a drop shadow. It now draws:
   - a flat field;
   - a rim in a club colour, from `recipe.rim` or `CREST_RIMS`, otherwise flat gold for a gold accent, otherwise the darkest palette colour, otherwise #1a1c21;
   - a dashed stitch line and a light twill;
   - one outline filter around the emblem, plus a light edge for any marks that sit above the badge.

   The recipes, emblems and outline families are unchanged. There is still no lettering anywhere.
2. **New export `window.getClubCanonicalName(name)`.** It resolves a club name through `CLUB_IDENTITY_ALIASES`. `getClubIdentity` uses it, and so does `js/kits17.js`, so crests and kits read one name table. The identity object also gained `club: <canonical name>`.
3. **Private copies are gone.** The Special Player pack page no longer carries its own ~1,000-line copy of the crest code. It loads `js/visualIdentity.js` and `js/kits17.js` itself. Every screen now draws the same crest and kit.

## The pin

`tests/contracts/v10-setup-contracts.cjs` pins this file as a "Team V file". The pin is now:

`js/visualIdentity.js` = `5a1632dbb9dedc1008b0f4102cf2b2654742eb0b123c3206c5f4704861a22797`

## Ask

- **No work is needed from you.** Please mark this RECEIVED.
- If any Team V branch carries an older `js/visualIdentity.js`, rebase it on gameplay/r90 (d6346c5 or later) before handing it to G. An older copy would put back the glossy V2 crests and drop `getClubCanonicalName`. Kits would then lose alias lookups, and v10-setup would fail.
- Any future crest change: start from the current file. Keep it flat, with no lettering, names, years, mottos or trademarks.
