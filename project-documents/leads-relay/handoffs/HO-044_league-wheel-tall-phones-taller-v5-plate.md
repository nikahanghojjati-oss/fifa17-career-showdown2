# HO-044 · Team G → Team V · League wheel tall phones: taller V5 plate

```ticket
{
 "id": "HO-044",
 "from": "G",
 "to": "V",
 "title": "League wheel tall phones: taller V5 plate",
 "kind": "design",
 "priority": "normal",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-29T13:26:12Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q7tUFaokdEJ5951ioW"
}
```

# HO-044: League wheel on tall Android phones still shows the old stadium art

**From:** Team G (r86 lead) · **To:** Team V · **Kind:** design (art) · **Priority:** normal (r86 if ready, else r87)

## What is wrong
An outside review (Grok, 2026-10-29) said "tall phones still keep the old League plate". Checked in the code: it is true, and it is on purpose today.

`css/v10Setup.css` (r78 HO-031/HO-032 block, about line 1633) only swaps in your `plates-v5/ENV_LEAGUE_PHONE_V5.webp` (1179x2096, 9:16) when the phone is 340-430 px wide, at most 960 px tall **and at least 59/128 (0.4609) wide-to-tall**. Below that ratio, `cover` crops the plate's sides past the face zones (Daniel 9.03 % and Nik 9.11 % in from the edges), so the swap stops and the screen falls back to the old `league/assets/ENV_LEAGUE_PHONE_V1.webp` stadium plus the two cut-outs.

Phones that get the old art today: 412x915 and 384x854 (Pixel/Samsung class), 360x800, 340x960, and anything taller than 9:19.5. iPhones (393x852, 430x932, 390x844) are just inside and get V5.

## What we need from Team V
One taller portrait League plate in the same look as `ENV_LEAGUE_PHONE_V5` (both managers painted in, marble, gold, no lettering):

- **Size:** 1179x2620 (9:20) or taller, webp, under ~400 KB.
- **Face zones:** keep both faces at least **14 %** in from each side, so `cover` on a 340x960 screen (0.354) never cuts a face. If that is impossible at 0.354, design for 0.40 and say so; G will stop the swap at your ratio.
- **Wheel space:** same clear area as V5 for the 15 % smaller wheel (HO-032), centred, with the result line and SPIN WHEEL / BACK below it.
- **No dark grade over the men, no dimming (HO-027).**
- Name it `plates-v5/ENV_LEAGUE_PHONE_TALL_V5.webp` and commit it to the r86 work branch through a PR, or attach it to this ticket.

## What Team G does when it lands
Adds a second media query for tall portrait phones (aspect below 59/128) that draws the tall plate with the same smaller wheel and no overlay, then shows a phone gallery at 412x915, 360x800 and 340x960 next to the iPhone sizes before it ships.

## Evidence
`css/v10Setup.css` lines ~1633-1660 on `gameplay/r86` (the comment there lists the taller phones that keep the old art).
