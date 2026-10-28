# MARQUEE-V1 build result (HO-035, r86) — Team V

Marquee Player reveal screen and the MP chip, built as a plate app like `visual-assets/v10_1/club`. Team G wires it ("skin, don't rewire").

## What Nik asked for (27 Oct 2026, 7:54-7:56 p.m. Eastern, Team V lead thread)
Per manager, a longer reveal in this order:
1. **Figure**: a faceless, gold-edged statue figure in the club colours rises behind the shirt (seen from behind, so no face is ever drawn; no likeness, no photo).
2. **Jersey**: the club's shirt wipes up onto the figure. Original designs in club colours and pattern (stripes, hoops, halves, band, sash, contrast sleeves), no crest, no sponsor, no maker mark. 56 clubs + a black-and-gold shirt for Oscar (no club) = 57 shirts (`kits.html`).
3. **Number**: the kit number lands on the shirt back, then a short pause.
4. **Club**: the team name on the plaque.
5. **Name**: the player's name prints on the shirt back (surname as kits print it) and on the plaque.
6. **Rank**: the ranking badge flashes in its tier colour (black-blue-gold top 3, blue-gold top 10, gold top 20, silver top 50, bronze the rest).

Daniel (playerOne) left, Nik (playerTwo) right. Whole reveal about 10 s (`TIMES` in marquee.js; Nik follows Daniel by 0.35 s).

## Files
- `marquee.js` — `window.MarqueePlate`: `app.mount(host, data, {layout})`, `app.frame(n)` (0..6, static), `app.play({onDone})`, `app.unmount()`; `kit(club)`, `shirtSvg(player)`, `chip(player, {size})`, `KITS`, `TIERS`, `backName(name)`.
- `marquee.css` — plate, windows, plaques, tier badges, MP chip. Uses `../plates-v2/ENV_CLUB_PLATE_V2_{1X,2X}.webp` (desktop) and `../plates-v2/ENV_CLUB_PHONE_V2.webp` (upright phones/tablets), fonts from `../shared/fonts/`, panel marble `../../../css/r78-marble-tile.webp`. No new pictures.
- `demo.html` (`?pair=a|b|c&frame=0..6` or `&play=1`, `&layout=desktop|phone`), `kits.html` (all 57 shirts + MP chips).
- `evidence/` — `MP1..MP6_desktop_1440x900.jpg`, `MP1..MP6_phone_393x660.jpg`, pair b (black-blue-gold + silver) and pair c (bronze, Oscar no club, long name) at both sizes, size checks 360x640, 375x553, 1366x768, 768x1024, `kits_all_57_and_chips.jpg`.

## Data in
`{daniel:{rank,name,club,overall,potential,tier,number}, nik:{...}}` exactly as HO-035 (club null = Oscar). Missing number = blank number on the shirt (no crash).

## Wiring notes for Team G
- Mount into an empty, full-screen element inside `#marqueeScreen`; the plate is `aria-hidden`. Keep the real words and buttons in the product DOM.
- Layout: `auto` picks the phone plate with Club's media query (`(max-width:760px) and portrait`, `761-1024px and portrait`), else desktop. Sideways phones use desktop.
- Continue button: desktop free space is plate x 596-940, y 728-786 (between the plaques, on the table); phone keeps the bottom 84 px. `demo.html` shows both (`.mqCta` is demo styling only).
- Desktop plate is centred "cover", so with the top nav the title sits under it; nothing important is in the top 70 plate px.
- Reduced motion (`prefers-reduced-motion` or `html[data-motion-reduced=true]`): `play()` jumps straight to step 6.
- No dimming, no scrim, no see-through: plaques are opaque marble (HO-027). Windows sit inside the pack faces, clear of hands and faces. No flash: the scene is static until `play()`.

## MP chip
`MarqueePlate.chip(player, {size:"desktop"|"phone"})` → `<span class="mpChip mpChip--desktop|phone" data-tier="…"><b>MP</b><span>Name</span></span>`. Desktop 26 px high (13 px type), phone 20 px (11 px). Inline, ellipsis on long names, never overlaid. Team G places it on History, Statistics, Standings, Rule Book, Legacy, Trophy Room, Rivalry, Final Winner and Season Results and sends Team V the gallery to check.
