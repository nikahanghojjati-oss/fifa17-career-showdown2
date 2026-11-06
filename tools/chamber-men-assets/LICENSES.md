# Chamber Men stadium kit: licences

Every file in this folder is original work made for Career Mode Showdown by code in
`tools/chamber-men-assets/` (numpy + Pillow; rebuild with `python3 build_all.py`). No third-party
picture, model, scan or texture is used, so there is no outside licence to follow, and no real
ball maker, league, club or sponsor mark appears anywhere.

The ad-board lettering is set in Inter (SIL Open Font Licence 1.1). Only the rendered letters are
baked into the boards; no font file ships here. The boards show only our own marks: CHAMBER MEN,
CMS, CAREER MODE SHOWDOWN.

Crowd fans are simple drawn figures with no likeness of any real person.

| File | What | Made by |
|---|---|---|
| ball_color_4k.webp, ball_color_2k.webp | Showdown match ball colour (sRGB, equirectangular for SphereGeometry) | gen_ball.py |
| ball_normal_4k.webp, ball_normal_2k.webp | ball normal map (OpenGL +Y): seams, print, pebble grain | gen_ball.py |
| ball_orm_4k.webp, ball_orm_2k.webp | ball G roughness, B metalness (gold foil) | gen_ball.py |
| crowd_atlas_2k.webp, crowd_atlas_1k.webp | 96 fans x 2 poses (arms down / up), 16 x 12 cards | gen_stadium.py |
| crowd_tint_1k.webp | mask: where a fan's shirt takes the club colour | gen_stadium.py |
| board_chamber_men.webp, board_cms.webp, board_chevrons.webp | LED ad boards | gen_stadium.py |
| grass_color_1k.webp, grass_normal_1k.webp, grass_normal_512.webp | tiling grass (2 m a tile) | gen_stadium.py |
| net_cell_512.webp | one 12 cm knotted net cell, RGBA | gen_stadium.py |
| seats_512.webp | one stand step: black and gold seats, riser | gen_stadium.py |
| concrete_512.webp | stand concrete | gen_stadium.py |
| flare_256.webp | floodlight glare | gen_stadium.py |

Licence for the files themselves: same as the rest of the Career Mode Showdown repository.

## Players (../players/)

`anims_*.glb`, `body_*.glb` (players/): the "Remy", "Ch38" and "Ch42" characters and animation clips from Adobe Mixamo, downloaded by Nik
with his own free Adobe account (2026-11-04) and converted by `tools/chamber-men-players`. Mixamo's terms allow the
characters and animations to be used royalty-free inside a game or project; they must not be redistributed as stand-alone
assets, so the source FBX files are not kept in the repository. Socks mesh, kit material names, keyframe reduction and
the uv layout pictures in `players/uv/` are ours.
