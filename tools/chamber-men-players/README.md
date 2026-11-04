# Chamber Men players: Mixamo FBX to one glTF

Inputs (not in the repo: Mixamo's terms allow the character and clips inside the game, not as loose source files):
Nik's Mixamo downloads, "Remy", FBX Binary, 30 fps; the first file with skin, the rest without. Put them in `in/`
next to `convert.html` with the names in `clips.json` (file, clip name).

Run (three@0.187.0 and meshoptimizer@0.22.0 in node_modules, any static server on port 8766 serving this folder):

    node convert.cjs desktop out && node convert.cjs phone out

What it does: scales the body to a 1.83 m player with feet on y 0; takes each file's "mixamo.com" clip onto the shared
skeleton (bone names mixamorig*), with keyframe reduction (quaternions 0.0015, hips 2 mm); turns Phong into
MeshStandardMaterial; merges the repeated body atlas; adds a Socks mesh (the lower-leg skin pushed out 4 mm, own uv:
left sock u 0..0.5, right 0.5..1, front of the shin at the middle of each half, v 0 at the boot, 1 under the knee); renames
Tops/Bottoms/Shoes to Shirt/Shorts/Boots with materials kitShirt/kitShorts/kitSocks/kitBoots; welds and (phone) simplifies
with meshoptimizer; writes WebP textures (2048 desktop, 1024 phone) via EXT_texture_webp; draws the uv layouts.

## Keeper clips (measured on the converted rig: keeper faces +z, so the keeper's left is +x; times from the clip start)

| clip | way | gloves at full stretch | lands |
|---|---|---|---|
| gkDive | keeper's left, mid height, comes ~2 m forward | 1.1 s: x +2.1, y 0.8 (z +2.0) | 1.3 s |
| gkDive1 | keeper's right, high, ~1 m forward | 0.9 s: x -2.45, y 1.2; 1.1 s: x -2.9, y 0.9 | 1.3 s |
| gkBlock | keeper's left, low | 0.8 s: x +1.4, y 0.4 | 0.9 s |
| gkBlock1 | keeper's right, along the ground | 0.7 s: x -1.3, y 0.05 | 0.7 s |
| gkBlock2 | keeper's left, low | 0.7 s: x +1.2, y 0.2 | 0.8 s |
| gkCatch | step right, waist-height catch | 1.6 s: x -0.9, y 0.9 | stays up |
| gkCatch1 | middle, chest-high catch | 0.4 s: x -0.2, y 1.4 | stays up |
| gkCatch2 | jump, catch over the head | 0.8 s: x -0.65, y 2.25 | stays up |

## v2: one shared clip file plus a light file per body (`convert2.html`, `convert2.cjs`)

    node convert2.cjs anims - desktop out && node convert2.cjs anims - phone out
    node convert2.cjs body remy desktop out   # also Ch38, Ch42; tier desktop or phone

Inputs as above plus Nik's Mixamo characters `Ch38.fbx` and `Ch42.fbx` in `in/` (not in the repo).

Outputs in `visual-assets/v10_1/chamber-men/players/`:
- `anims_{desktop,phone}.glb`: Remy's skeleton and all 18 clips, no meshes worth drawing. Load once.
- `body_{remy,ch38,ch42}_{desktop,phone}.glb`: one rigged body each, no clips. Every body has the same bone names
  (`mixamorig*`), meshes Body, Hair, Eyelashes, (Eyes), Shirt, Shorts, Socks, Boots and materials Bodymat, Hairmat,
  Eyelashmat, Eyesmat, kitShirt, kitShorts, kitSocks, kitBoots. Bodies without socks (Remy, Ch42) get the generated sock.
- `uv/uv_<body>_<Mesh>.webp`: uv layouts for the kits thread (`uv/uv_<Mesh>.webp` is Remy's, kept for the v1 file).
  Ch38 and Ch42 kit meshes share their body's texture atlas, so a kit canvas paints the regions shown on the sheet.

Playing a clip on a body: the body's root carries `userData.cmHipsScale` (body hips height / Remy hips height; Remy 1,
Ch38 0.444, Ch42 0.461; it may sit on the scene's first child). Clone the clip and multiply every `.position` track value
by it, then play it on the body with an AnimationMixer. Set `frustumCulled=false` on the skinned meshes (root motion moves
the body away from its bind box). Rotation tracks need nothing.

Checked: every clip on every body at 60 fps, front three-quarter contact sheets (skinning, shirt and shorts) and planted-toe
slide measured against Remy: the retargeted bodies slide no more than Remy does on the source clips. Ch42's toes sit
up to 3 cm under y 0 in some poses; lift that body by 0.02 m.

Mixamo characters dropped: Ch01 (polo and jeans), Ch08 (hoodie tracksuit, long trousers), Ch28 (turtleneck and
trousers), none of them can carry shorts and socks; Ch12 is one merged mesh, no separate shirt or shorts to tint.

Approved skin and hair pairs (RGB multipliers on Bodymat and Hairmat colour; only these pairs, never mixed):
- remy: [1,1,1]+[1,1,1]; [1,1,1]+[.55,.42,.3]; [.92,.84,.78]+[.32,.22,.13]; [.86,.76,.68]+[.16,.11,.07];
  [.7,.56,.46]+[.07,.05,.04]; [.52,.39,.31]+[.05,.04,.035]
- ch38 (black hair, a hair tint does nothing): [1,1,1]+[1,1,1]; [1.12,1.05,1]+[1,1,1]; [.88,.84,.82]+[1,1,1];
  [.75,.7,.68]+[1,1,1]
- ch42: [1,1,1]+[1,1,1]; [.92,.84,.78]+[1,1,1]; [.86,.76,.68]+[.6,.6,.6]; [.7,.56,.46]+[.5,.5,.5];
  [.52,.39,.31]+[.4,.4,.4]; [1,1,1]+[1.6,1.3,1]
