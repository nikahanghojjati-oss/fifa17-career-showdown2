# HO-062 · Team G answers (r90 lead, 2026-11-08 ~13:05 UTC)

Full hunt: `project-documents/leads-relay/handoffs/HO-062/HUNT_LOOK.md` (rounds 1 + 2, rows L01-L34, shots under gameplay/r90/hunts/shots/LOOK/ in the project files).

## 1. AI-look tells (backgrounds, plates, tiles, icons)
- **Slogan banners baked into plates** (L11): FOOTBALL BRINGS US TOGETHER, RIVALS MAKE LEGENDS, SKILL. VISION. MAGIC., etc. on ~10 plates. Banners should carry real things (two crests, season number, Showdown name) or stay blank. No slogans at all.
- **Filler subtitles / fake strips** (L11): "TWO MANAGERS · ONE LEGACY" under titles, "01 TWO MANAGER CAREER COMPETITION · 02 FIFA 17 ERA RULESET · READY". Do not paint text like this into any picture.
- **Faces too big on phone** (L23): faces take 55 % of a 390x844 phone before any control, and titles land on chests. Phone plates: faces to about 35 % of the height, with a clean band for the title.
- **Grab-bag icons** (L12): eight tiles, each a different 3D render with its own angle, light and material, plus a player photo on CONTINUE.
- **Mixed mark styles in one set** (L20, L26): league wheel mixes a "1", a bull, generic shields and a crown. Trophy Room cups are recolours of two models.
- **Two renders of the same object** (L21): the scoring-panel trophy differs from the Final Winner trophy. One trophy asset everywhere.
- **Glossy/plastic finishes** (L06, L22, L31): sparkle storms, glossy pills, white light beams, a sunny blue sky in a night game.
- **Generic template pieces** (L19): web stepper circles, crown shield "CLUB PACK CM17", bevelled "RIVALRY VS" frame.
- **Off-palette colour** (L17): bright blue. The game is black and gold; Daniel = white/silver, Nik = gold.
- **Cut lettering** (L03, L06): words cut at a frame edge read as auto-generated.
- **Wordmark in pictures**: the game calls itself CM17; no "CMS" / "CAREER MODE SHOWDOWN" / "FIFA 17 SHOWDOWN" baked into art.

## 2. What Team G already changed in code (don't fight it)
- Flat gold underline tabs on Trophy Room and Standings (#1299, #1300); no glossy pills anywhere.
- Club Assignment stepper removed (#1301); Legacy finder chips content-sized (#1298); Showdown Champion tidy (#1300).
- Crests: flat patch crests for all 98 clubs (W7, approved by Nik 2026-11-07, js/kits17.js). Any crest in a picture should match those, or better, leave space and let the page draw it.
- Chamber Men boards now read club name + crest; RRR café hall (marble, warm lamps) at Extra+; one calm night light shared by the 3D scenes; no corner/side glare lights (Nik 2026-11-08).
- Colour convention: Daniel = white/silver, Nik = gold.
- Settings quota wording and Rule Book engineering detail are text fixes in code (W9 #1297).
- **Home icons:** W9 is redrawing a richer drawn set in code after Nik rejected #1296 ("too basic", the 17 shirt "looks very bad") and said no to the old painted set. **One owner only:** if Team V's prompt job makes icon pictures, tell us and W9 stops; otherwise leave icons out of the prompts. Nik should pick (lead raises it with him).

## 3. Which screens get new pictures
We agree in part. Nik's standing rules: "premium, all marble"; Home = marble lounge; three.js welcome on all screens incl. Home, but light and never crash on first open; Extra/Ultra get the full 3D marble café; low tiers a calm dark room; no flat dimmed "sticker" backdrops.
- **New pictures:** Home (desktop + phone, slogan-free, phone faces ~35 %), Connect Players (phone title off the chest), Legacy, Season Results / Final Winner (one trophy), Transfer War, Club, League (slogans out).
- **Quieter (dark marble or plain dark cloth, no scene):** Settings, Rule Book, Story, Career Statistics, Standings, Trophy Room. These are reading screens; the picture fights the tables.
- **3D behind menus:** not a "never"; Nik welcomed it. Today menus are 2D only and that's fine for 2.3.0. Any future 3D menu backdrop is a gfxTier job (Extra+ only), not a picture.
- Marble on Home only is NOT agreed: marble is the house material everywhere, but on reading screens it should be calm and low-contrast, not a scene.

## 4. Weights and quality tiers
Current Home: 1X 1536x864 = 315 KB, 2X 3072x1728 = 611 KB, phone 1179x2096 = 386 KB. All too heavy for the Chromebook first open.
- Desktop 1X (1536x864): **≤ 200 KB** WebP. This is what Light/Balanced get.
- Desktop 2X (3072x1728): **≤ 450 KB**, served only at High and up (html[data-gfx] / data-assets from js/gfxTier.js).
- Phone (1179x2096): **≤ 250 KB**, plus a half-size copy (~590 W) **≤ 90 KB** for Light.
- Home tiles/icons: **≤ 20 KB** each with a 256 W copy; or SVG.
- No 4K/8K pictures for 2D screens; only the 3D scenes scale to Ultra/8K.
- The quality levels are one shared system (docs/QUALITY_LEVELS.md): Light, Balanced, High, Extra, Ultra (4K), 8K. Pictures must not invent their own levels.

## 5. Icons and Home tiles
- Wrong now: eight unrelated 3D renders (different angle, light, material), a player photo on CONTINUE, emoji-like glyphs elsewhere (Σ, tiny cups, L18).
- Rejected by Nik: #1296 flat line icons ("too basic", the 17 shirt bad) and the old painted set.
- Wanted: one rich family, same angle, same light, same line weight. Our pick is **engraved gold on black marble** (struck medal / embossed metal look, low relief, warm single key light), no glow, no gloss, no text inside the icon. Sizes must read at 48 px. Same family reused on Trophy Room cups and league marks (L20, L26).
