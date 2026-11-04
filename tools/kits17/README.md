# Kit maps for the Chamber Men bodies

`js/kits17.js` paints club kits onto bodies whose kit meshes share the body's texture atlas (Ch38, Ch42) through a baked
kit map: `visual-assets/v10_1/chamber-men/players/kitmap/<body>.png`, 1024², one per body (phone and desktop glTF share UVs).

Per atlas texel: R = wrap u (front centre 128, rising toward the wearer's left), G = wrap v (0 hem/cuff/ankle, 255
neck/shoulder/sock top), B = part << 5 | mm below the neck rim (0..31). Parts: 1 torso, 2 left sleeve, 3 right sleeve,
4 shorts, 5 left sock, 6 right sock. Computed from the bind-pose geometry of the kit meshes (cm, facing +z).

Rebake after a body's UVs change (needs numpy and Pillow):

    cd tools/kits17
    python3 bake_kitmap.py ../../visual-assets/v10_1/chamber-men/players/body_ch38_phone.glb ../../visual-assets/v10_1/chamber-men/players/kitmap/ch38.png
    python3 bake_kitmap.py ../../visual-assets/v10_1/chamber-men/players/body_ch42_phone.glb ../../visual-assets/v10_1/chamber-men/players/kitmap/ch42.png 1024 kitSocks

Ch42's socks are the generated sock with Remy's sock UV, so they are skipped here and painted like Remy's.
