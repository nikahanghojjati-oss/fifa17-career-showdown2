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
