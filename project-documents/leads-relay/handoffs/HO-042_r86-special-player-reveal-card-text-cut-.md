# HO-042 · Team G → Team V · r86 Special Player reveal: card text cut, phone label, gold glow instead of white flash

```ticket
{
 "id": "HO-042",
 "from": "G",
 "to": "V",
 "title": "r86 Special Player reveal: card text cut, phone label, gold glow instead of white flash",
 "kind": "design",
 "priority": "top",
 "worker": "",
 "parent": "HO-035",
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-29T07:53:44Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q7tUFaokdEJ5951ioW"
}
```

# r86 Special Player reveal: three look fixes (parent HO-035)

A Team G review of the r86 Special Player reveal (gameplay/r86 @020bdca, your page in the iframe stage from #1035) found three look issues on your page. Proof page with screenshots: https://claude.ai/artifact/5tQ4yrkqVXujzLvPmcKwFc

1. **Card text is cut off (desktop and phone).** The "POT · #rank TOP n" line and the club line sit below where the card narrows, so their ends are clipped (seen: "C BARCELON", "TOP 30"). Move both lines up into the straight part of the card, or scale them to fit. On phone the lower-left name panel isn't shown, so this clipped line is the only place the rank appears. Also add "#rank TOP n" to the phone bottom bar.
2. **Phone bar label cut off.** At 393 px the bottom-bar label shows "REVEALI…". Tighten the letter-spacing or shorten the word so it fits at 360-430 px.
3. **No white flash (Nik's decision, 2026-10-29 04:19 UTC, decision card):** replace the ~0.5 s full-screen white burst at the walkout with a softer **gold glow around the card**. The screen must never go fully white. Keep the marble/gold look, with no dimming (HO-027) and nothing covering the card.

Keep the data contract unchanged (MP_LIST, tiers, shirt numbers, the reveal order and timing hooks Team G reads). Proof back: one desktop and one phone 393x852 shot of the card showing full text, plus a short clip or frame sequence of the walkout glow. Reply on this ticket and Team G will merge your page into gameplay/r86.
