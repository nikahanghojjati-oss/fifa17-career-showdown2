# Ticket HANDCRAFTED V1 · the Showdown art system (HO-061 + HO-062)

- **15 pictures:** 14 ChatGPT runs plus 1 reserve. Together they replace about 40 plate files, the phone cut-outs and the five mismatched cups.
- **Order:** the Home lounge first (HC 01, then HC 02 on the real Home screen), then the slab, board room, cups, tunnel, box, office and archive. Every later picture is edited from approved ones.
- **Time:** about 2 minutes of your time per picture (attach, paste, check), plus ChatGPT's own wait. Nothing runs until Claude says OK to the picture it depends on.

## The answer: how Showdown stops looking prompted

**Why today's art reads as AI.** Every plate was made alone, from a prompt full of adjectives ("luxury", "premium", "epic"). Adjectives all lead to the same poster: gold LED strips on every edge, mirror floors with veins that light up, a sparkle field for a crowd, a crown, a slogan banner, a script name tag. Each picture invented its own room, its own light and its own trophy, so twelve screens look like twelve prompts. A stranger reads that in one second.

**The system: One House, built as a set.** The Showdown is one clubhouse standing above one football ground, on one night. Every screen is a room in it: the **lounge** (Home), the **tunnel** (Connect Players, Standings, Rivalry), the **directors' box** (League, Club), the **office** (Transfer War), the **board room** (Season Results, Final Winner, Career Statistics) and the **archive** (Trophy Room, Legacy). Settings and the Rule Book are **the house wall stone, seen close up**.

**Material, not adjectives.** Prompts name things you could buy and touch: honed black marble (matte, never polished) with a few dull ochre and off-white veins, a 1 cm brushed-brass lip on the counter, smoked oak, black steel windows, an old laced leather ball. ChatGPT draws what it is told, so we tell it objects, not moods.

**Light from real lamps.** Every light has a fixture you can point to: one dark-brass dome pendant above each man, one wall lamp, one lamp inside each glass case, the small lamp banks on the far stand roof. No strips, no beams, no glow. The light is warm 2700 K, and the men keep the light they already have.

**Restraint and calm planes.** Most of each frame is plain stone, oak or night glass, exactly where the page puts its title and panels. Gold appears in two places only: the brass lip and the one cup family. Calm planes are also why the files get small. Noise is what makes a WebP heavy, so a quiet room fits 200 KB on its own, with no dim filter on top.

**Wear in a few places only.** The brass lip is rubbed dull where Daniel's hands rest on the left and Nik's on the right. There is one chipped counter corner in the lounge and old match balls in the archive. Everything else is clean. Wear everywhere looks generated; wear in two spots looks lived in.

**One grammar.** The same night, lamp colour, stone, lip and far stand roof appear in every room. The camera height, wall material (stone, oak or glass) and pose pair change per room, so the screens read as one shoot, not one prompt used twelve times.

**Built gradually.** HC 01 (the lounge) is the master. You approve it as "the house" before anything else runs. Claude then cuts faceless **room cards** from each approved picture (stone, brass, lamp, night, no people). Every later picture attaches one, so ChatGPT copies one building's materials instead of inventing a new one.

**Faces are never generated.** Every picture with you and Daniel is an edit of an approved plate. Claude's lock tool then puts the original men back pixel for pixel, and refuses any result that is flipped or does not fit. For phones, Claude places the locked men on one phone grid inside a cyan guide, and ChatGPT paints only the cyan. Daniel is always LEFT and Nik always RIGHT.

**Home icons are vector code (HO-065).** You moved the icons out of this job on 8 Nov at 10:25 a.m. Eastern. Team G builds them as one engraved-gold-on-black-marble vector set, so they stay sharp at 48 px and weigh almost nothing. The trophy art in this ticket uses the same light from high front-left, so the cups and the icons agree.

**Claude's intake makes it one product.** Claude locks the men back, applies one shared grade to every room (the same black point, wall tone, lamp white and gold hue, with the men masked so they are never regraded) and encodes to Team G's weights. Last, Claude lays all the rooms out side by side on one contact sheet and reshoots any room that stands out.

## Beyond the pictures (ideas for Team G)

These are proposals. You approve them, and then Team G builds them. Nothing here changes how the product behaves.
1. **Dim layers out, slogans out** (no-dim rule, L11): once each room lands, delete the Home scrimTop and dockBed gradients (css/homeV10.css:93, :964-968), the dark radial pools behind the Connect, Season Results and Final Winner titles (css/connectPlayersV10.css:1197, js/seasonFinalV10.js:1751, :1811), the Final Winner #000b edge and fill gradients over its plate (js/seasonFinalV10.js:1797-1801), and any Settings or Rule Book scrim. Delete 'TWO MANAGERS · ONE LEGACY', 'More Than A Game' and the 01/02 strip (index.html:74-78) in the same PR.
2. **One phone grid with set.json, and a counter plane** (L23; no scroll at 393x660, 360x640, 375x553): each plate ships lipY, chestY, the title band, the head boxes, the empty column and the lamp positions. On phones the page continues the counter front below the painted lip as an opaque HC 03 stone panel. On short phones the lip may rise only to chestY, never over a face. On tall 9:20 phones it extends downward, which retires the faded OVL bottoms and the TALL file.
3. **Props stand on the lip** (L18, L19, L20, L21, L26): the typographic wheel, two sealed crest-shaped packs in the league's colours, and the one HC 06 cup all stand on lipY. Each gets a small soft contact shadow under the object only, falling back and to the right, with no glow or halo. The Trophy Room shows only cups that have been earned, with no rows of dashes. The honours rows use the 256 W cups instead of Σ.
4. **The brass rail is the only state light** (L09, L17, L22): a 2 px rail over the painted lip, split at the centre. It rests as dull brass. The active manager's half turns Daniel silver-white or Nik gold once, in 250 ms, and then holds. Gold is kept for the live choice, the points just earned and the winner.
5. **Cuts, never a slideshow** (motion that ends; Reduce Motion): the plate sits still from the first frame, with no Ken Burns, parallax, zoom or fade from black. A screen change is a cut or a crossfade of 180 ms or less. Rooms shared by several screens keep the same plate, and only the props change, rising 8 px and settling once (300-400 ms).
6. **Quality levels pick files, never effects** (QUALITY_LEVELS, G answer 4, L28): Light and Save-Data get 1X or 590 W files. 2X loads only at High and up, and only where it passed at 1:1. The 3D café hall and the lighter High hall take their wall texture from HC 03 and model the house pendant at 2700 K. No new level, and no 4K or 8K for 2D screens.

## Which tool

**Stay on ChatGPT image (Plus).** No free tool is clearly better at keeping two real faces in an edited interior. TechRadar (2026-04-28) chose ChatGPT Images 2.0 for face-keeping edits. eWeek (2026-05-06) chose Nano Banana 2 by 4-2, but gave ChatGPT the background-swap edit. Tom's Guide (2026-04-29) ran text-to-image tests only, and eWeek (2026-06-15) found that ChatGPT kept identities intact. None of these reviews tested two people from one photo. Claude's lock step makes face drift harmless in any case.

## Screen by screen

| Screen | Plan | Why | HUNT_LOOK rows |
|---|---|---|---|
| Home | **new**: HC 01 desktop, HC 02 phone | the master room; slogans, LED gold and the mirror floor go; phone faces go to about 35% | L11, L06, L31, L23, L25 (code) |
| Connect Players | **new**: HC 07, HC 08 (tunnel) | the sound tunnel is kept and cleaned; the title gets a dark, even zone | L11, L06, L02, L17, L23 |
| Standings | **derived** from HC 07/08 | same tunnel; the managers stay; the centre stays calm for tables | L11, L23, L22 (code) |
| Rivalry Statistics | **derived** from HC 07/08 | the crowd-of-lights plate retires, and so do the OVL_RV cut-outs | L11, L23 |
| League | **new**: HC 09, HC 10 (box) | one draw room; the page draws the wheel | L11, L20, L06, L31 |
| Club Assignment | **derived** from HC 09/10 | same box; the page draws sealed packs, so nothing is painted | L11, L19 |
| Transfer War | **new**: HC 11, HC 12 (office) | no props, no skyline; quiet glass for the page clock | L11, L19, L03, L06, L17, L07, L33 |
| Season Results | **derived** from HC 04/05 (board room) | one room with Final Winner; the kit-shirt plate with its '17' retires | L11, L19, L21, L17 |
| Final Winner | **new**: HC 04, HC 05, plus HC 06 cup | no confetti, beams or plinth; one cup on the lip | L11, L18, L21, L22, L31 |
| Career Statistics | **derived** from HC 04/05, or **cleaned** in HC 15 | board room; HC 15 cleans its own plate if OVL_CS cannot retire | L11, L17 |
| Legacy | **new**: HC 13, HC 14 (archive) | the sound gallery is kept; crowns, shirts and the hero cup go | L11, L21, L26, L23, L06 |
| Trophy Room | **derived** from HC 13/14, plus HC 06 | same archive; only earned cups show; the light cone goes | L11, L26, L31 |
| Settings | **quieter surface**: HC 03 slab | a reading screen with no managers; the busy lounge fights the text | G answer 3; L14 (code) |
| Rule Book | **quieter surface**: HC 03 slab | the library plate is the heaviest file; the slab is about 100 KB | G answer 3, L11; L16 (code) |
| Story | **keep** | already quiet typography | L15 (code) |
| Loading | **keep** | the Reus photo is out of scope | — |
| Home icons | **Team G code** (HO-065) | one vector set in engraved gold on black marble | L12 |

**Scope changes from Team G answer 3, and why.** Answer 3 asked for no scene on Standings, Career Statistics and Trophy Room. Those screens have managers, and the fixed rule is that managers always stay, so they move into calm shared rooms (tunnel, board room, archive) with an empty centre instead. Club shares League's room, because the page now draws the packs. Season Results shares Final Winner's room, because one pose pair works for any result. Home icons are out (HO-065). Trophy art is in, as one family.

## Count and build order

**15 pictures** (14 runs plus 1 reserve). Before any run, Claude prepares five things (step 1 of the judge's plan): the lock men-mask mode, the guides.py phone grid, the room-card cropper, the set.json writer, and the house paragraph and ban list used below.
1. **HC 01 LOUNGE_D** depends on Claude's tools. **Gate A:** you approve it as "the house". Claude then cuts RC_LOUNGE and writes the grade sheet.
2. **HC 02 LOUNGE_P** depends on HC 01, RC_LOUNGE and guide HC02. **Gate B:** Team G wires Home alone, and you judge the system on one real screen.
3. **HC 03 SLAB** depends on RC_LOUNGE.
4. **HC 04 BOARD_D** depends on RC_LOUNGE. Claude then cuts RC_BOARD.
5. **HC 05 BOARD_P** depends on RC_BOARD and guide HC05.
6. **HC 06 TROPHIES** depends on HC 03. Claude stands the cups on the HC 04 and HC 05 lips to check them before approval.
7. **HC 07 TUNNEL_D** depends on RC_LOUNGE. Claude then cuts RC_GROUND (the tunnel mouth).
8. **HC 08 TUNNEL_P** depends on RC_GROUND and guide HC08.
9. **HC 09 BOX_D** depends on RC_GROUND (the same ground, seen from higher up). Claude then cuts RC_BOX.
10. **HC 10 BOX_P** depends on RC_BOX and guide HC10. The 9:20 tall copy comes from it at intake, with no run.
11. **HC 11 OFFICE_D** depends on RC_LOUNGE. Claude then cuts RC_OFFICE.
12. **HC 12 OFFICE_P** depends on RC_OFFICE and the SMALLER guide HC12.
13. **HC 13 ARCHIVE_D** depends on RC_BOARD. Claude then cuts RC_ARCHIVE.
14. **HC 14 ARCHIVE_P** depends on RC_ARCHIVE and guide HC14.
15. **HC 15 RESERVE** depends on the contact-sheet gate. It runs only if a room stands out, one cup needs a redo, or Career Statistics needs its own plate.

## How to run each picture

1. Open a **new normal ChatGPT chat outside any project**, never a Temporary Chat. Use one picture per chat.
2. Attach **exactly** the file(s) named. Open each GitHub link in Safari, press and hold the picture, choose **Save to Photos**, then attach it. Links under attach/HC/ (guides and RC_ room cards) work only after Claude posts that file, so wait for Claude's OK. If ChatGPT will not take a .webp, ask Claude for a PNG copy. With two files, attach them in the order listed (picture 1 first).
3. Paste the prompt **exactly**. If ChatGPT offers to rewrite it or asks a question, reply: `No, use my prompt exactly.`
4. Check the result against the Pass check. Claude replaces the faces anyway, so judge the room, the sides and the words.
5. If it fails, start a **new chat** from the same attachment(s), paste the prompt, and add that picture's Fix line at the end. You get up to 3 tries; never correct in the same chat. After 3 tries, tell Claude.
6. If it passes, drop it in the Team V thread **"Remove plate slogans and fix phone face crops"** with its code (for example `HC 01 LOUNGE_D`). Wait for Claude's OK before running any picture that depends on it.

Shared fix line, for a leftover object in any picture (add it to the end of the prompt in a new chat):
```
Wrong last time: something from my Remove or Never add list came back (writing, a banner, a crown, a light strip, a glow, a shiny floor or leftover cyan). Paint those parts as plain house stone, brass, oak, glass or night, sharp and real. Keep the two men exactly as they are, the man on the left on the left.
```

## 1 of 15 · Desktop · Home · code `HC 01 LOUNGE_D`
- **Depends on:** Claude's tools. This is the master: nothing else runs until you approve it.
- **Attach (1 file):** [ENV_HOME_PLATE_V2_2X.webp](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/gameplay/r90/visual-assets/v10_1/plates-v2/ENV_HOME_PLATE_V2_2X.webp).
- **Save as:** `HC01_LOUNGE_D.png`
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Change only the room. This is a first-floor lounge of a clubhouse, high above the halfway line of a football ground at night, seen at the men's chest height with a 35 mm lens, straight on, everything sharp. House materials: honed black marble, matte and never polished, with a few thin dull ochre and off-white veins and hairline joints; warm 2700 K light where every light comes from a lamp you can point to.
Back wall: three tall glass panes in thin dull dark-brass frames. Through them: a black cloudless sky, the far stand as a dark mass with small warm lamp banks along its roof edge, a muted green pitch, dark blank boards. Left third of the frame, from the ceiling down to the counter: a plain wall of the honed black marble with one brass wall lamp with a pleated cream fabric shade, making one soft pool on the wall, and nothing else. Ceiling: flat dark plaster; the top 8% and the top-right corner stay plain and dark. Two dark-brass dome pendant lamps hang just above the frame, one above each man, lighting the faces from above-front as they are lit now. The long counter in front of them stays where it is: honed black marble with a 1 cm brushed-brass lip, unlit, rubbed dull in front of each man, one small chip at its left corner, at most one soft long reflection and no reflection of the men. Keep the area right behind the heads about as dark as it is now.
Remove: every banner, both script name tags and their three-word lines, the crown, the gold football and its pedestal, the potted palms, the sofas and side tables, the gold stools, every gold light strip on pillars, ceiling and frames, the bright veins in the floor, the mirror reflections, the sparkle points in the crowd.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Landscape 3:2, the largest size available. Keep the room framed as it is; add only plain dark ceiling above and plain counter below.
```
**Pass check**
- Daniel is LEFT and still points; Nik is RIGHT with his hand at his chin.
- Zoom in everywhere, including the boards and the glass: not one letter, number or crown.
- In the left third, nothing is brighter than the one wall-lamp pool.
- There are no gold strips anywhere, the floor and counter are matte, and the crowd is a dark mass.
- Would you call it "the house"? If you would not live with this stone and lamp on 12 screens, say so now.
```
Wrong last time: the room is still too busy. Make the left wall plain honed black marble with only the one wall lamp, the counter matte with one soft reflection, no gold light strips anywhere, and the crowd a dark mass with no points of light.
```

## 2 of 15 · Phone · Home · code `HC 02 LOUNGE_P`
- **Depends on:** HC 01 approved. Claude posts RC_LOUNGE and guide HC02.
- **Attach (2 files, in this order):** [GUIDE_HC02_LOUNGE_P.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/GUIDE_HC02_LOUNGE_P.png), then [RC_LOUNGE.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_LOUNGE.png)
- **Save as:** `HC02_LOUNGE_P.png`
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials: copy its stone, brass, lamp and night, never its layout or its objects. The solid cyan areas in picture 1 are empty: paint them as the room below so no cyan is left. The men are already in the right place and size; do not move or resize them.
The same lounge in a tall frame, camera at chest height, 50 mm lens, straight on, everything sharp. Top 16% of the height: plain dark ceiling and the dark tops of the window frames, nothing bright (title band). Behind the men, a narrow slice of the same tall windows in dull dark-brass frames: black cloudless sky, the far stand as a dark mass with small warm lamp banks on its roof edge, a muted green strip of pitch. Keep the area right behind the heads a calm dark tone and light the men from above-front, as they are lit now. At 50% of the height the counter's 1 cm brushed-brass lip runs straight and level across the frame, unlit and rubbed dull in front of each man. Below it: only the plain honed black marble counter front, then a matte dark floor strip with no reflections; nothing below the lip is brighter than mid-grey. This lower half stays calm for cards.
Remove: any leftover cyan, legs, shoes, floor reflections, sofas, palms, gold light strips.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Portrait 2:3, the largest size available. Faces and shoulders stay in the band from about 16% to 50% of the height, about 35%.
```
**Pass check**
- No cyan is left anywhere, including the thin side strips.
- The top sixth is plain and dark; a title could sit there without touching hair.
- The brass lip is one straight level line across the middle.
- The lower half is one calm, dark counter front, with no veins that shine.
- It looks like the same room as HC 01, side by side.
```
Wrong last time: the lower half is busy or the top is bright. Make the top sixth plain dark ceiling, the lip one straight line at the middle, and everything below it plain matte counter front with no reflections.
```

## 3 of 15 · Desktop + Phone · Settings, Rule Book · code `HC 03 SLAB`
- **Depends on:** RC_LOUNGE.
- **Attach (1 file):** [RC_LOUNGE.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_LOUNGE.png)
- **Save as:** `HC03_SLAB.png`. Claude cuts the desktop 1X, the phone (the same image turned 90 degrees), the 512 px panel tile and the counter strip from it.
```
A real photograph of one slab of the same black marble as the wall in the attached picture: copy its stone only, nothing else from it. Honed and matte, black, with a few thin dull ochre and off-white veins running from upper left to lower right, only a little lighter than the stone, and very few veins in the centre 70% of the frame. Shot square-on from straight in front with a 100 mm lens, so there is no perspective. The stone fills the whole frame to every edge: no slab edge, no joint, no trim, no wall, no floor, no object. One large soft window light from the upper left, out of frame, falls evenly, so the surface shows only a faint satin sheen; the corners are as bright as the centre, with no hot spot and no pool of light. The only wear: two small natural pits filled with dark resin, and the fine scratches honing leaves. Normal exposure; the shadows keep detail.
Remove: everything in the attached picture except its stone: the windows, the night, the lamps, the brass lip, the counter and the ceiling.
Never add: words, letters, numbers, slogans, logos, crests, crowns, objects, frames, borders, gold trim, light strips, light beams, sparkles, lens flare, bokeh dots, reflections, polished mirror shine, marble veins that give off light, gold veins, cracks that shine, dark corners, vignette, blur, bright blue, tile pattern.
Landscape 3:2, the largest size available.
```
**Pass check**
- It looks like real stone, not flat paint and not a pattern.
- No vein shines; every vein is dull.
- The corners are as bright as the middle, with no dark edges.
- There is no object, joint or frame anywhere.
```
Wrong last time: the veins shine, or there is a reflection, a bright spot or dark corners. Make it matte honed black stone under even window light, the veins dull ochre and off-white, nothing shining.
```

## 4 of 15 · Desktop · Season Results, Final Winner, Career Statistics · code `HC 04 BOARD_D`
- **Depends on:** RC_LOUNGE.
- **Attach (2 files, in this order):** [ENV_FINAL_WINNER_PLATE_V2_2X.webp](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/gameplay/r90/visual-assets/v10_1/plates-v2/ENV_FINAL_WINNER_PLATE_V2_2X.webp), then [RC_LOUNGE.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_LOUNGE.png)
- **Save as:** `HC04_BOARD_D.png`. If banners or confetti are still there after 3 tries, Claude posts a men-on-cyan guide of this plate to use instead.
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials: copy its stone, brass, lamp and night, never its layout or its objects.
Replace only the room. A windowless board room: a plain wall of large honed black marble slabs, matte, with a few thin dull ochre and off-white veins and hairline joints. One square stone pilaster at the far left and one at the far right, cut off by the frame edges. A dark plain ceiling. Camera straight on at standing chest height, 50 mm lens, nothing distorted, everything sharp. The men stand waist-up behind a long honed black marble counter. Its 1 cm brushed-brass lip runs straight and level across the frame at about 72% of the height, unlit, rubbed dull in front of each man; the plain counter front fills everything below. Two dark-brass dome pendant lamps hang just above the frame, one above each man, giving warm 2700 K light from high front-left, so each man leaves a soft natural shadow on the wall. The wall between the men, from 37% to 63% of the width, stays bare from the ceiling down to the lip, with nothing on it.
Remove: every banner and its writing, the script name tags and three-word lines, all confetti, the light cones from the ceiling, every bulb and string of lights, the stadium tiers and crowd, the gold rings on the columns, the steps, the plinth, the mirror floor.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Landscape 3:2, the largest size available. Keep the room framed as it is; add only plain dark ceiling above and plain counter below.
```
**Pass check**
- Daniel is LEFT with his hand at his chin; Nik is RIGHT with his arms crossed.
- The wall between the men (37% to 63% of the width) is plain: no cup, no plinth, no object.
- There are no confetti, beams, bulbs or stadium.
- The counter is matte, with its brass lip straight across the lower third.
- The stone looks like the HC 01 lounge wall.
- **HO-066 row 2 (L49):** the top band, where the old subtitle sat under the music pill, is plain wall with no words; Claude checks it under the live music pill on Season Results.
```
Wrong last time: confetti, lights or a stadium came back. The room is a plain windowless stone wall with two pilasters at the edges and nothing else; the middle of the wall is bare.
```

## 5 of 15 · Phone · Season Results, Final Winner, Career Statistics · code `HC 05 BOARD_P`
- **Depends on:** HC 04 approved. Claude posts RC_BOARD and guide HC05 (each man placed at 30% and 70% of the width).
- **Attach (2 files, in this order):** [GUIDE_HC05_BOARD_P.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/GUIDE_HC05_BOARD_P.png), then [RC_BOARD.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_BOARD.png)
- **Save as:** `HC05_BOARD_P.png`
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials: copy its stone, brass, lamp and night, never its layout or its objects. The solid cyan areas in picture 1 are empty: paint them as the room below so no cyan is left. The men are already in the right place and size; do not move or resize them.
The same windowless board room in a tall frame, camera at chest height, 50 mm lens, straight on, everything sharp. Top 16% of the height: plain, evenly lit honed black marble wall, nothing on it (title band). Behind and between the men: the same wall of large honed black marble slabs with hairline joints and a few dull ochre and off-white veins; the centre third between them stays bare wall down to the lip. Warm 2700 K light from high front-left, from pendants just above the frame, a soft natural shadow of each man on the wall. At 50% of the height the counter's 1 cm brushed-brass lip runs straight and level across the frame, unlit, rubbed dull in front of each man. Below it: only the plain matte counter front, one calm dark surface, nothing brighter than mid-grey. Nothing important in the outer 8% on either side.
Remove: any leftover cyan, columns, bulbs, confetti, steps, plinth, mirror floor.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Portrait 2:3, the largest size available. Faces and shoulders stay in the band from about 16% to 50% of the height, about 35%.
```
**Pass check**
- No cyan is left; the top sixth is plain wall.
- The centre between the men is bare down to the lip, where the page will stand the cup.
- The lip is one straight line at the middle, and the lower half is calm.
- It is the same stone as HC 04.
```
Wrong last time: something stands between the men or the lower half is busy. Keep the wall between them bare and everything below the lip plain matte counter front.
```

## 6 of 15 · Sheet · Final Winner, Season Results, Trophy Room, Statistics · code `HC 06 TROPHIES`
- **Depends on:** HC 03 approved. Claude stands the cut cups on the HC 04 and HC 05 lips to check them before saying OK.
- **Attach (2 files, in this order):** [TRO_SHOWDOWN_CHAMPION_V1_1536.webp](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/gameplay/r90/visual-assets/v10_1/shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_1536.webp), then your approved HC 03 result
- **Save as:** `HC06_TROPHIES.png` (Claude cuts each cup to 512x768 at 60 KB or less and 256x384 at 20 KB or less; the TRO V1 files stay as rollback)
```
One picture: five metal trophies in one row on a transparent background, a real product photograph. Picture 1 gives the outline of cup 1 only. Picture 2 gives the stone for the feet only.
Layout: canvas 1536x1024 landscape, five equal columns about 300 px wide, one cup centred in each. Every foot stands on the same baseline about 60 px above the bottom edge, at least 40 px between cups, nothing touches the edge. No floor, no table, no backdrop, no shadow on the background.
Cup 1, the tallest, about 820 px: the shape of picture 1, a football of 32 panels in the same metal held by four slim curved uprights on a waisted stem, with the top ornament replaced by a plain rolled collar; one ball panel a little duller from handling. Cup 2, about 700 px: a wide two-handled cup with a round belly and plain loop handles. Cup 3, about 560 px: a squat lidded bowl with a small round knob and two small ear handles. Cup 4, about 760 px: a tall deep cup on a long stem with two large plain handles. Cup 5, about 720 px: a narrow flared flute with no handles.
One alloy for all five: gold-plated brass with a fine satin brushed grain, slightly brighter on edges worn by handling, hairline scratches on the feet only. Identical feet on all five: a round two-step foot of the black stone in picture 2, the same height, with one plain blank brass band. Light: one large soft warm light high at front-left, a dim fill from the right, no rim light, no backlight. Camera: 85 mm lens at the cups' middle height, straight on, all five the same distance.
Remove from picture 1's cup: the crown on top, the swirling arms, the mirror chrome finish, the stacked black-and-gold base and the grey backdrop.
Never add: words, letters, numbers, stars, laurel leaves, ribbons, swirls, crowns, engraving, logos, real trophy shapes, silver bodies, wood, chrome or mirror shine, long white streaks, sparkles, lens flare, glow, a painted checkerboard.
Transparent background. Landscape 3:2, the largest size available. No text anywhere, and the bands stay blank.
```
**Pass check**
- There are five clearly different shapes, all in one gold metal on one baseline.
- The brightest spot sits upper-left on every cup, with no long white streaks.
- Cup 1 still reads as the Showdown cup, but with no crown or swirl arms.
- The feet are identical black stone with blank bands.
- The background is really see-through, not a grey checkerboard.
```
Wrong last time: the metal is shiny or ornate. Make all five plain satin gold-plated brass like real club trophies made by a silversmith, one soft light from high front-left, and no ornaments.
```

## 7 of 15 · Desktop · Connect Players, Standings, Rivalry · code `HC 07 TUNNEL_D`
- **Depends on:** RC_LOUNGE.
- **Attach (2 files, in this order):** [ENV_CONNECT_PLAYERS_PLATE_V2_2X.webp](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/gameplay/r90/visual-assets/v10_1/plates-v2/ENV_CONNECT_PLAYERS_PLATE_V2_2X.webp), then [RC_LOUNGE.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_LOUNGE.png)
- **Save as:** `HC07_TUNNEL_D.png`
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials: copy its stone, brass, lamp and night, never its layout or its objects.
Change only the room. The same players' tunnel under the lounge, the same camera: eye height, 30 mm lens, straight down the tunnel, everything sharp. Walls: honed black marble, matte, with a few thin dull ochre and off-white veins. Pillar edges: unlit brushed-brass trim, catching only spill light. The two wall banner frames become plain recessed black marble panels. One small recessed downlight above each man in a dark ceiling, warm 2700 K, lighting the faces as they are lit now, and no other light inside the tunnel. The far end opens onto the ground: one stand roof with a few small warm lamp banks only at its two outer corners, a dark warm-grey crowd with no faces readable, a black cloudless sky, a strip of grass and a small white goal. Floor: honed black marble with broad soft reflections and no points of light. The front ledge stays: matte black marble with a thin unlit brass lip, nothing on it. The centre 30-70% of the width, from 12% to 70% of the height, stays dark and even, with no light points behind where a title goes.
Remove: the two wall banners and their writing and crowns, the two script names and their three-word lines, both ledge plaques, every gold LED strip, the rows of bare bulbs, the three stacked stand tiers with light bars, the blue crowd, the lettered ad boards.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Landscape 3:2, the largest size available. Keep the room framed as it is; add only plain dark ceiling above and plain floor below.
```
**Pass check**
- Daniel is LEFT and pointing; Nik is RIGHT.
- There is no blue anywhere, and the crowd is a dark warm mass.
- The top centre is dark and even, with no bright points.
- The banner frames are plain stone, with no plaques or writing.
- The floor shows soft reflections only, with no glitter.
```
Wrong last time: the far stand is bright, blue or stacked in tiers. Make it one dark stand roof with a few small warm lamp banks, a black sky, and the tunnel lit only by one small downlight above each man.
```

## 8 of 15 · Phone · Connect Players, Standings, Rivalry · code `HC 08 TUNNEL_P`
- **Depends on:** HC 07 approved. Claude posts RC_GROUND (the tunnel mouth) and guide HC08 (each man cut at the waist, Daniel's hand inside the centre 60%).
- **Attach (2 files, in this order):** [GUIDE_HC08_TUNNEL_P.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/GUIDE_HC08_TUNNEL_P.png), then [RC_GROUND.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_GROUND.png)
- **Save as:** `HC08_TUNNEL_P.png` (it retires CONNECT_PLAYERS_PHONE_V2, STANDINGS_PHONE_V3, RIVALRY_PHONE_V3 and the OVL_RV cut-outs)
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials and the ground outside: copy its stone, brass, pitch, stand and night, never its layout. The solid cyan areas in picture 1 are empty: paint them as the room below so no cyan is left. The men are already in the right place and size; do not move or resize them.
The same tunnel in a tall frame, camera at chest height, 35 mm lens, straight on, everything sharp. Top 16% of the height: plain dark tunnel ceiling of black marble, with no lamps and no light points (title band). Between and behind the men, small and far: the tunnel mouth onto the same night pitch and stand from picture 2, a black cloudless sky. Walls of honed black marble with unlit brass trim. One small warm downlight above each man, out of view, lighting them from above-front as they are lit now. At 50% of the height the top of the tunnel's black marble barrier runs straight and level across the frame, with a thin unlit brass lip; the men stand behind it. Below it: one matte honed black marble slab of even dark tone, faint veins, no reflections, nothing on it, calm for cards and tables.
Remove: any leftover cyan, legs, shoes, the gold grid floor, the gold LED wall strips, any bright point above the heads.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Portrait 2:3, the largest size available. Faces and shoulders stay in the band from about 16% to 50% of the height, about 35%.
```
**Pass check**
- No cyan is left; the top sixth has no bright points.
- The pitch shows small and far between the men.
- The lip is a straight line at the middle, and the lower half is one calm dark slab.
- Daniel is LEFT, and neither face is near the side edges.
```
Wrong last time: lamps or bright points sit in the top band, or the lower half is busy. Keep the top sixth plain dark ceiling and everything below the lip one plain dark matte slab.
```

## 9 of 15 · Desktop · League, Club Assignment · code `HC 09 BOX_D`
- **Depends on:** RC_GROUND.
- **Attach (2 files, in this order):** [ENV_LEAGUE_PLATE_V2_2X.webp](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/gameplay/r90/visual-assets/v10_1/plates-v2/ENV_LEAGUE_PLATE_V2_2X.webp), then [RC_GROUND.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_GROUND.png)
- **Save as:** `HC09_BOX_D.png` (served as 1X at every level unless a 2X passes at 1:1)
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials and the ground outside: copy its stone, brass, pitch, stand and night, never its layout.
Change only the room. The directors' box, one floor below the lounge, camera at the men's chest height, 50 mm lens, level and straight on, everything sharp. Back wall: three tall glass panes in thin dull dark-brass frames looking across at the same far stand as picture 2, from closer: the stand roof with small warm lamp banks, a thin dim strip of pitch along the bottom of the glass, a flat black cloudless sky, floodlights out of frame. Side walls: plain smoked oak, with nothing on them. Top 10%: a plain dark ceiling panel. One long honed black marble table crosses the front, matte, with a few dull ochre and off-white veins; its 1 cm brushed-brass lip runs straight and level at about 72% of the height, unlit, rubbed dull in front of each man, and its plain front fills everything below. One dark-brass dome pendant lamp hangs just above the frame over each man, warm 2700 K, lighting the faces as they are lit now. The centre column, 37% to 63% of the width, holds only glass and bare stone from the top of the glass down to the lip.
Remove: every banner and its writing, the script name tags and three-word lines, the pennant bunting, the strings of bulbs, the bowl of lit stands, the storm clouds, the round plinth, the crowned flags in the front corners, the lines of light in the floor.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Landscape 3:2, the largest size available. Keep the room framed as it is; add only plain dark ceiling above and plain table front below.
```
**Pass check**
- Daniel is LEFT and pointing toward the centre; Nik is RIGHT with his hand at his chin.
- The centre column is empty glass and stone, with no plinth.
- There is no bunting, no bulbs, no flags, and no clouds.
- The table lip is straight and level, about three quarters of the way down.
- The stand outside looks like the HC 07 tunnel's ground.
- **HO-066 row 1 (Club):** Claude previews the plate at 2560x1000 (the 21:10 cover crop in club.js). The empty centre column and the stone just above the lip stay inside the visible part, with room for the two pack labels side by side; if not, Claude sets the crop anchor in set.json, or this picture is rerun with the lip a little higher.
```
Wrong last time: the stadium is a bright bowl or the centre is not empty. Through the glass show only the far dark stand roof with a few small warm lamp banks, and keep the centre column plain glass and bare stone.
```

## 10 of 15 · Phone · League, Club Assignment · code `HC 10 BOX_P`
- **Depends on:** HC 09 approved. Claude posts RC_BOX and guide HC10 (faces at least 16% in from the side edges).
- **Attach (2 files, in this order):** [GUIDE_HC10_BOX_P.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/GUIDE_HC10_BOX_P.png), then [RC_BOX.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_BOX.png)
- **Save as:** `HC10_BOX_P.png` (Claude makes the 9:20 tall copy from it and retires LEAGUE_PHONE_TALL_V5 with no extra run)
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials: copy its stone, oak, brass, lamp and night, never its layout or its objects. The solid cyan areas in picture 1 are empty: paint them as the room below so no cyan is left. The men are already in the right place and size; do not move or resize them.
The same directors' box in a tall frame, camera at chest height, 50 mm lens, straight on, everything sharp. Top 16% of the height: a plain dark ceiling panel and the dark top of the glass, nothing bright (title band). Behind the men: the tall glass in dull dark-brass frames, the far dark stand with small warm lamp banks, a flat black sky; plain smoked oak at the sides. One pendant lamp above each man, just out of view, lighting them as they are lit now. The centre column, 36% to 64% of the width, stays empty glass and bare stone from 25% of the height down to the table lip. The table's 1 cm brushed-brass lip runs straight and level at about 58% of the height, unlit, rubbed dull in front of each man. Below it: only the plain matte honed black marble table front and a dark floor strip, very low detail, calm for cards.
Remove: any leftover cyan, the round plinth, the lines of light in the floor, the stadium bowl, the bunting, the flags.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Portrait 2:3, the largest size available. Faces and shoulders stay in the band from about 16% to 50% of the height, about 35%.
```
**Pass check**
- No cyan is left; the top sixth is plain.
- The centre column is empty, so the wheel or the packs will stand in front of the chests, never a face.
- The lip is straight, a little below the middle, and everything below it is calm.
- It is the same box as HC 09, with the same oak and the same glass.
```
Wrong last time: the centre between the men is not empty or the floor is busy. Keep the centre column plain glass and stone down to the lip, and below the lip only plain matte table front.
```

## 11 of 15 · Desktop · Transfer War · code `HC 11 OFFICE_D`
- **Depends on:** RC_LOUNGE.
- **Attach (2 files, in this order):** [ENV_TRANSFER_PLATE_V2_2X.webp](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/gameplay/r90/visual-assets/v10_1/plates-v2/ENV_TRANSFER_PLATE_V2_2X.webp), then [RC_LOUNGE.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_LOUNGE.png)
- **Save as:** `HC11_OFFICE_D.png` (at intake Claude's men-mask leaves out Daniel's sheet, so ChatGPT's blank sheet is kept and the old printed lines do not come back)
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials: copy its stone, brass, lamp and night, never its layout or its objects.
Change only the room, the table and the objects. The manager's office on the lounge floor, camera across the table at the seated men's chest height, 40 mm lens, level, the table's front edge straight along the bottom, everything sharp. Walls: dark smoked-oak panels. Behind the men: one wall of tall black-steel windows with wide mullions, looking along the dark stand roof to one floodlight mast with only its lamp banks lit, against a near-black sky with no city and no clouds. One long honed black marble table, matte, a few dull ochre and off-white veins, with a 1 cm brushed-brass lip worn dull at the front-left corner. One black leather blotter under each man's hands: the left one with pale grey stitching, the right one with small brass corners. The left man's sheet is blank cream paper. A dark-brass dome pendant lamp hangs just above the frame over each man, warm 2700 K, lighting the faces and hands as they are lit now. Kept plain: the bottom 40% of the frame is bare table; the glass at top centre (41-63% of the width, 5-28% of the height) is plain dark glass between two mullions; the oak panel at top left (0-26% of the width, 5-34% of the height) is bare.
Remove: every slogan and script name, the binders, the books, the ball, the mug, the tablet, the plants, both desk lamps, the gold light strips, the stepped plinth, the skyline, the blue clouds and the black strip along the bottom edge.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, clocks, screens, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Landscape 3:2, the largest size available. Keep the room framed as it is; add only plain wall above and plain table below.
```
**Pass check**
- Both men are seated as before; Daniel is LEFT, holding a blank sheet.
- The table holds only two blotters and the paper; nothing else.
- There is no city, no skyline and no blue sky.
- The top-centre glass and the top-left oak panel are empty, with no clock and no lettering.
- The table is matte and reflects nothing.
- **HO-066 row 3 (L35):** this plate now shows at every width (W7). Claude previews it at 1180x620 and 1920x906: both faces and the top-left title panel stay clear.
```
Wrong last time: a prop, a clock, a screen or lettering came back. Every surface is plain and unmarked; the table holds only the two blotters and one blank sheet.
```

## 12 of 15 · Phone · Transfer War · code `HC 12 OFFICE_P`
- **Depends on:** HC 11 approved. Claude posts RC_OFFICE and guide HC12, built from the phone plate with the 1851 SMALLER method (the men at about 80% scale, hair starting at about 16%, cyan around them, including the table under their hands and over the printed sheet in the left man's hands).
- **Attach (2 files, in this order):** [GUIDE_HC12_OFFICE_P.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/GUIDE_HC12_OFFICE_P.png), then [RC_OFFICE.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_OFFICE.png)
- **Save as:** `HC12_OFFICE_P.png`
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials: copy its oak, stone, brass, lamp and night, never its layout or its objects. The solid cyan areas in picture 1 are empty: paint them as the room below so no cyan is left. The men are already in the right place and size; do not move or resize them.
The same office in a tall frame, camera just above the seated men's chest height, 35 mm lens, looking slightly down at the table, level, everything sharp. Top 16% of the height: a plain black-painted wood soffit meeting the top of the black-steel window frame, with no lamp shades in view and no lights (title band). Behind the men: the tall black-steel windows, the dark stand roof and one floodlight mast with only its lamp banks lit, a near-black sky. Smoked-oak walls at the sides. The matte honed black marble table top fills the lower 60%, a few faint dull veins at one angle, the soft warm falloff of the two pendants above, no reflection of the men, no lines of light; calm for cards. A black leather blotter under each man's hands, and the sheet in the left man's hands is blank cream paper with no lines.
Remove: any leftover cyan, the mirror table, the upside-down reflections of the faces, the bright vein grid, the ball, the mug, the tablet, the binders, the plants, the skyline, the clouds.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, clocks, screens, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Portrait 2:3, the largest size available. Faces and shoulders take about 35% of the height, inside the middle 84% of the width.
```
**Pass check**
- No cyan is left; the top sixth is a plain dark soffit.
- No face is reflected in the table.
- The table top is matte and calm, with no shining lines.
- Both men are inside the middle of the frame, with Daniel LEFT.
- **HO-066 row 3 (L35):** Claude previews it at 390x844: both faces and the title band stay clear.
```
Wrong last time: the table came back glossy or reflecting. The table top is matte stone like a honed kitchen counter; it reflects nothing.
```

## 13 of 15 · Desktop · Trophy Room, Legacy · code `HC 13 ARCHIVE_D`
- **Depends on:** RC_BOARD.
- **Attach (2 files, in this order):** [ENV_LEGACY_PLATE_V2_2X.webp](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/gameplay/r90/visual-assets/v10_1/plates-v2/ENV_LEGACY_PLATE_V2_2X.webp), then [RC_BOARD.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_BOARD.png)
- **Save as:** `HC13_ARCHIVE_D.png`
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials: copy its stone, brass and lamp light, never its layout or its objects.
Change only the room. The long windowless archive under the stand, the same camera: eye height, 30 mm lens, straight down the hall, everything sharp. Dark stone arches recede down a hall of honed black marble, matte, with a few dull ochre and off-white veins. Recessed glass cases line both sides, about half of them dark. Each lit case holds one old laced brown leather match ball on a small brass stand on black cloth, lit by one small warm lamp inside the top of the case. Two plain pendant lamps hang far back on the centre line, below 35% of the height. Floor: plain honed stone with broad soft reflections and no lines. The men stand behind a long low honed black marble display plinth crossing the front, which hides them from just below the chest down; its 1 cm brushed-brass lip runs straight and level at about 64% of the height, unlit, rubbed dull in front of each man. The far central niche is an empty dark plinth. The top centre (35-65% of the width, 8-30% of the height) is dark arch ceiling with no lamps. The warm key on the faces stays as it is now.
Remove: both banners and their writing, the script names and three-word lines, every crown, the central hero cup, every cup in the cases, the framed numbered shirts, the plaques at the cabinet bases, the rows of bulbs on arches and pillars, the rope, the runner carpet, the palms, the lines of light in the floor.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Landscape 3:2, the largest size available. Keep the room framed as it is; add only plain dark ceiling above and plain plinth front below.
```
**Pass check**
- Daniel is LEFT with his hand at his chin; Nik is RIGHT with his arms down toward his pockets (the plinth hides his hands).
- The cases hold old leather balls only, with no cups, shirts or crowns.
- The far niche is an empty dark plinth.
- The top centre is dark ceiling, with no bulbs.
- The plinth lip runs straight across at about two-thirds of the height, below Daniel's chin hand and above both belts.
```
Wrong last time: cups, shirts or crowns came back in the cases. Each lit case holds only one old brown leather match ball on a small brass stand; the far niche is empty.
```

## 14 of 15 · Phone · Trophy Room, Legacy · code `HC 14 ARCHIVE_P`
- **Depends on:** HC 13 approved. Claude posts RC_ARCHIVE and guide HC14 (the men placed one head-width apart, which fixes today's shoulder overlap).
- **Attach (2 files, in this order):** [GUIDE_HC14_ARCHIVE_P.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/GUIDE_HC14_ARCHIVE_P.png), then [RC_ARCHIVE.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HC/RC_ARCHIVE.png)
- **Save as:** `HC14_ARCHIVE_P.png`
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
Picture 1 is the photo to edit. Picture 2 shows only the building's materials: copy its stone, brass, cases and lamp light, never its layout. The solid cyan areas in picture 1 are empty: paint them as the room below so no cyan is left. The men are already in the right place and size; do not move or resize them.
The same archive in a tall frame, camera at chest height, 35 mm lens, straight on, everything sharp. Top 16% of the height: plain dark stone arch ceiling, no lamps, also clear in both top corners (title band). Behind and between the men: one dark stone arch with two or three recessed glass cases; one of them lit by a small warm lamp inside, holding a single old laced brown leather match ball on a small brass stand; the others dark. The warm key on the faces stays as it is now. At 50% of the height the long low display plinth's 1 cm brushed-brass lip runs straight and level across the frame, unlit, rubbed dull in front of each man. Below it: one plain matte honed black marble plinth front, faint veins, no reflections, calm for cards and cups.
Remove: any leftover cyan, legs, shoes, the floor with lines of light, the many lit cases at the edges, crowns, cups.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight.
Portrait 2:3, the largest size available. Faces and shoulders stay in the band from about 16% to 50% of the height, about 35%.
```
**Pass check**
- No cyan is left, and the top sixth and both top corners are plain dark.
- The men do not overlap; there is a gap of about one head between them.
- At most one lit case shows, holding one old ball.
- The lip is straight at the middle, and the lower half is calm.
```
Wrong last time: the background has many lit cases or cups. Show one arch with two or three cases, only one lit, holding one old leather ball, and keep the top sixth plain dark ceiling.
```

## 15 of 15 · As needed · Reserve · code `HC 15 RESERVE`
- **Depends on:** the contact-sheet gate (see Intake). Claude names the one fault and the one picture to redo.
- **For a room or a cup that stands out:** rerun that picture's section with the same files, and add Claude's one-line change at the end. That is the whole run.
- **For Career Statistics, only if Team G cannot retire OVL_CS_DANIEL_CROSSED_ARMS.** Attach (1 file): [GUIDE_STATISTICS_CLEAN.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-kxgun9/project-documents/factory/tickets/attach/HO061/GUIDE_STATISTICS_CLEAN.png). Today's guide has no boxes over the windows, so Claude first posts an updated guide (same name) with boxes over the blue and white window points, checks that the boxes cover both banners with their crowns and both name tags, and you attach that one.
- **Save as:** `HC15_RESERVE.png`
```
Edit this photo. Keep the two men exactly as they are: same faces, hair, beards, skin, build, suits, shirts, hands, pose and position. The man on the left stays on the left and the man on the right stays on the right; never flip the picture. Do not redraw their faces.
The solid cyan boxes are empty. Paint each one as the plain scenery that would really be behind it, so nobody could tell anything was there: honed black marble wall, matte, with a few dull ochre and off-white veins and hairline joints; the same shelving and lounge chairs that stand next to the boxes; in the window boxes, the same dark night through the same mullions with only a few small warm amber lights. Continue the existing perspective and the warm 2700 K light. Sharp and real, the same grain as the rest of the picture. Keep everything outside the boxes exactly as it is.
Remove: the banners with their writing and crowns, the script name tags and three-word lines, the blue and white points in the windows.
Never add: words, letters, numbers, slogans, banners with writing, name tags, signs, logos, crests, sponsors, crowns, trophies, extra people, light beams, sparkles, lens flare, bokeh dots, glow or outline around the men, dark overlay, vignette, blur, mirror-gloss floors, marble veins that give off light, LED strips, bright blue, daylight. No cyan may remain.
Landscape, the same size and framing as the attached picture.
```
**Pass check**
- No cyan is left, and there is no writing where the boxes were.
- There is no blue in the windows.
- The filled parts are sharp, not smudged.
- Daniel is LEFT with his arms crossed, exactly as before.
```
Wrong last time: some cyan areas still show words, a banner or a blurry patch. Paint every old cyan area again as the real scenery behind it, sharp and real, with no writing. Keep everything else exactly as it is.
```

## Intake (Claude)

1. **Lock the men back.** In desktop men-mask mode, Claude fits the result on keypoints on the men. It keeps the original 2X men inside the mask and takes ChatGPT's pixels only in a 3 px band at the hair and shoulder edges. The mask is clipped at lipY, so a new counter stays in front. Claude refuses any result that is flipped or has too few matches, and checks the seam at 200%, shrinking the mask 2 px if needed. In guide mode, Claude placed the men, so their position is known exactly. Faces and hands are never taken from ChatGPT.
2. **One shared grade.** The grade sheet comes from HC 01: black point, wall tone, lamp white and one gold hue. Claude applies it to the room pixels only, with the men masked.
3. **Crop and size.** Desktop: 1536x1024 to 1536x864, trimming plain ceiling and counter. 2X: the upscaled room plus the original 2X men, kept only if it passes at 1:1; otherwise High serves the 1X. Phone: the centre 864x1536 of the guide, scaled to 1179x2096, with the men from the 2X plate at native size. Tall 9:20: extend the plain bands, or Team G's counter plane does it.
4. **WebP to the caps.** Desktop 1X at 200 KB or less, 2X at 450 KB or less, phone at 250 KB or less, the 590 W copy at 90 KB or less, cups at 60 KB and 20 KB or less, the panel tile at 20 KB or less, the counter strip about 30 KB. lock.py's "1.10 times the old file" limit is not used. A room that will not fit its cap is too busy and gets rerun plainer.
5. **Previews and gate.** For each picture Claude makes a before/after preview. After HC 14, Claude makes a contact sheet of every room at thumbnail size and at 390 px wide, with the men masked. Any room whose stone, lamp white or black level stands out goes to HC 15.
6. **Room cards and set.json.** Claude cuts faceless RC_* crops of 1536x1024 from each approved room, and ships set.json per plate (lipY, chestY, title band, head boxes, empty column, lamps). Every V2, V3 and V5 plate, OVL cut-out and TRO V1 file stays as an unlinked rollback. Each screen group lands in its own PR.
7. **Code notes handed to Team G** (looks only; proposals):
   - **Home:** drop scrimTop and dockBed (css/homeV10.css:93, :964-968), the DOM slogans (js/homeScreensV10.js:103, :108) and the strip (index.html:74-78). Keep one SIGN IN (L25). The phone title goes in the top band or the counter band (css/homeV10.css:716).
   - **Connect:** remove the dark radial pool behind the title. **Standings and Rivalry:** point `#statistics[data-rivalry-legacy-v10] .sd-stage__plate` at the tunnel plate, and retire OVL_RV_*_PHONE_V1 (standings/app-shell.html).
   - **Season Results and Final Winner:** use one plate pair (seasonFinalV10.js:1747, :1801-1803) and one cup path (seasonFinalV10.js:321-334). The honours rows use the 256x384 cups instead of Σ (L18).
   - **Cup paths:** js/careerScreensV10.js:944-948, trophy-room/trophy-room.js:8-16, season-results/app-shell.html:38, final-winner/app-shell.html:49-114, career-statistics.js:16, :111, rivalry-statistics.js:4. Leave the Home tile's TRO_LEAGUE_TITLE_V1_512_170W alone (HO-065).
   - **Club:** rvHalf and rvFlap switch to page-drawn packs in the centre column (x 568-968 at 1X), and platemap.json, handmap.json and OVL_CLUB_* retire. Remove the PHONE_PLATE pack coordinates (js/productionSharedCareerStart.js) and the "CLUB PACK CM17" crown badge (css/v10Club.css).
   - **League:** pin the wheel bottom to lipY from set.json (the lip is painted at 72% of the 3:2 frame, and the 16:9 crop moves it) and give the label anchor a fixed offset. On the phone the wheel stands on the lip at about 58%. Wheel segments become typographic, and the league marks stay in code in one medal grammar: no numeral '1', no PL crown, no real logos (L20).
   - **Transfer:** the page draws the whole clock board, rods included, over the plain glass, and no dossier is painted. The wordmark moves below the nav and the nav dots go (L33).
   - **Career Statistics:** retire OVL_CS_DANIEL_CROSSED_ARMS_V1 and its platemap, or use HC 15. **Settings slab:** it also serves the r78 error screen and #onlinePlayerIdentityOverlay (css/r78-marble-surfaces.css).
   - **H10 mockup-diff baselines:** rebase them on the new plates. The faces are pixel-identical, so only the rooms change.

## Not in this ticket

- **3D scenes** (L01-L10, L27-L34: Chamber Men, RRR, Special Player, Prime Pack): Team G code. They borrow only HC 03's stone and the 2700 K house pendant.
- **Text fixes** (L13-L18: Legacy finder, Settings wording, Story chapters, Rule Book wording, the blue bars, the Σ glyph): Team G code.
- **Home icons:** Team G code, one vector set (HO-065, 8 Nov 10:25 a.m. Eastern).
- **The Loading screen's Reus photo:** out of scope.
