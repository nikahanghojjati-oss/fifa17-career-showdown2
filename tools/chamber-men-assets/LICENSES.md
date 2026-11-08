# Chamber Men stadium kit: licences

Every file in this folder is original work made for Career Mode Showdown by code in
`tools/chamber-men-assets/` (numpy + Pillow; rebuild with `python3 build_all.py`), except the pitch grass (r90), which is
TextureCan "Ground 0040" (https://texturecan.com/details/469), released under CC0 1.0 (public domain; no attribution
required, credited here anyway), resized and converted by `gen_grass.py`, and the match ball (r90), which is Innerscene "Soccer ball"
(https://www.innerscene.com/tools/library/3d-parts/soccer-ball-f39dfd50), CC0 1.0, its mesh kept and its maps re-made with
match wear by `gen_ball_v3.py`. No real ball maker, league, club or sponsor mark
appears anywhere.

The LED ad boards are drawn at run time by js/chamberMenStadium3d.js (r90): the CM17 wordmark in
the page's own font and the two clubs' crests from js/visualIdentity.js. No board image ships.

Crowd fans are simple drawn figures with no likeness of any real person.

| File | What | Made by |
|---|---|---|
| ball_mesh_V3.glb | match ball mesh (32-panel UVs), Innerscene Soccer ball, CC0 | gen_ball_v3.py |
| stadium_bowl_V1_1k.glb | big stadium for High and above (tiers, hospitality band, roof, floodlights, facade; seat rows in extras), Innerscene "Football stadium", CC0 1.0 (innerscene.com), trimmed, WebP textures | gen_bowl.py |
| ball_color_V3_2k.webp, ball_color_V3_1k.webp, ball_color_V3_512.webp | ball colour with match wear (sRGB), one size per device level | gen_ball_v3.py |
| ball_normal_V3_2k.webp, ball_normal_V3_1k.webp, ball_normal_V3_512.webp | ball normal map (glTF +Y), from the source | gen_ball_v3.py |
| ball_orm_V3_2k.webp, ball_orm_V3_1k.webp, ball_orm_V3_512.webp | ball G roughness (worn panels rougher), B metalness 0 | gen_ball_v3.py |
| crowd_atlas_2k.webp, crowd_atlas_1k.webp | 96 fans x 2 poses (arms down / up), 16 x 12 cards | gen_stadium.py |
| crowd_tint_1k.webp | mask: where a fan's shirt takes the club colour | gen_stadium.py |
| grass_color_V2_4k.webp, grass_color_V2_2k.webp, grass_color_V2_1k.webp, grass_normal_V2_2k.webp, grass_normal_V2_1k.webp, grass_normal_V2_512.webp | pitch grass, one size per device level (3.5 m a tile); TextureCan Ground 0040, CC0 | gen_grass.py |
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
