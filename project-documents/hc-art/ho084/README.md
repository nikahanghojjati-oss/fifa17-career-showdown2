# HO-084 image-made crest pilot (5) + master shirt (Team V, 15 Nov 2026)

All six were made in ChatGPT Work mode, Astra 6, Extra High. Each was one new chat, with no club names in the prompt and nothing attached. The source pictures are in src/.

**Crests**
- Files: CREST_IMG_{BARCELONA,WESTHAM,METZ,CHELSEA,TORINO}_V1_{1024,256,64}.png.
- Format: transparent PNG on a 5:6 canvas (853x1024, 213x256, 53x64), centred, with a 4% margin.
- Cut-out: Barcelona, West Ham and Metz were cut with rembg, with holes filled. Chelsea and Torino were cut with a grey colour key, because rembg dropped the field on those two.

**Master shirt**
- KIT_MASTER_SHIRT_V1_1536.png: 1152x1536, transparent, converted to pure neutral grey. The source saturation was already under 5.
- KIT_MASTER_SHIRT_V1_SHADING_1536.png: the same shirt as a shading-only layer, normalised so the brightest part is white.
- KIT_MASTER_SHIRT_V1_tint_demo.jpg shows a multiply tint in claret, blue and red.

**Checks**
- SHA-256 for every file is in SHA256.json.
- HO084_PILOT_BOARD.jpg shows all five crests at 256 px, with their 28 px versions below.
- No letters or real artwork anywhere.

**Notes**
- Chelsea: the lion looks forward to the right, not back over its shoulder, and the footballs are modern black-and-white ones.
- Torino: the bull is lean rather than heavy.
- Both read correctly at game sizes.
