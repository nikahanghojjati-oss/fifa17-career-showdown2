# RR_ROOM_V2 · Roster Roulette café room, 4K (Team G ticket RR_ROOM_V2, r90)

Same room as `RR_ROOM.jpg` (main 2fe8d2f, 1672x941), made sharper and moodier in code. No new picture was generated, so nothing new was invented: same bar, columns, gallery, one chandelier, sconces, side tables, tall right window with the dim city. No people, text, logos or screens.

| File | Size | Bytes | SHA-256 |
| --- | --- | --- | --- |
| `../RR_ROOM_V2_4K.webp` | 3840x2160 | 507,346 | `81e9927ce81f12ccb258fa49269b11f278d3778c7a351dad92973a24863c48c5` |
| `../RR_ROOM_V2_1080.webp` | 1920x1080 | 271,644 | `3a7b0a2f1330e1a163e475ee4955cda5337d9494e8cba62340b4e709b00e4c09` |

## How it was made
1. `esr.py`: Real-ESRGAN x4plus (RRDBNet, public weights from the xinntao/Real-ESRGAN v0.1.0 release, loaded weights-only) upscales 4x to 6688x3764, CPU, tiled.
2. `grade.py`: crop 1 px top and bottom to exact 16:9, Lanczos to 3840x2160, blend 22% of the plain stretch back in (keeps natural texture), then the grade:
   - about 0.8 stop dimmer overall (mean brightness 67 to 37 of 255),
   - key light from above slightly right,
   - calm darker upper centre (title zone, ellipse at 50%/20%),
   - edge vignette,
   - floor below the bar calmer (softer veins and reflections) and darker towards the bottom,
   - lamp highlight roll-off: 0.0002% of pixels at 250+ (today 1.09%), no blown lamps,
   - slight warm mids, mild S-curve, light unsharp mask, fine grain (seed 1851) against AI waxiness.
3. WebP method 6, quality 80 (4K) and 86 (1080).

Geometry unchanged: one-point perspective down the centre, bar counter base at 59% from the top.

Previews: `BEFORE_AFTER.jpg` (whole frame) and `CROP_100PCT.jpg` (chandelier and gallery at 100% 4K).

Rebuild: `python3 -I esr.py RR_ROOM.jpg x4.png RealESRGAN_x4plus.pth && python3 -I grade.py x4.png RR_ROOM.jpg out 80 86` (weights not in the repo).
