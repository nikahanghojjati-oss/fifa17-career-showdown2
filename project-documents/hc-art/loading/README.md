# HO-072 Loading layers (Team V)

Reus cut-out from the real photo: "Marco Reus (16204330530).jpg", Tim Reckmann, CC BY 2.0, Wikimedia Commons, full size 4086 x 2724, sha256 4b3b42feeba0e1a7186e65efd023a32f68bbb25b73f30d0af6943cb09486f005 (copy in project files factory/loading-ho072/). Credit line stays: "Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display" (Team G adds "edited").

- Cut: BiRefNet-portrait matte (rembg), largest body only, green spill cleaned on the edge band only. No smoothing, no denoise, no face repaint; photo grain kept. Crest, sponsor and kit as in the photo.
- Grade: small warm white balance, -10% exposure, -8% saturation to sit in the dim tunnel; desktop gets a soft warm edge on his image-right side (the tunnel's caged wall lamp side).
- Files (alpha WebP): REUS_D_1X (scale 0.65 of source, no upscaling), REUS_D_2X (scale 1.30; Nik picked "big like the old screen" 12 Nov, so Retina gets a mild 1.3x), REUS_P (0.854, for the 1179 x 2096 phone), REUS_P_590W.
- placement.json: where each layer sits in its frame (left/top px). The layer runs below the tunnel ledge lip (92.5% desktop, 95% phone): stack room, then Reus, then the ledge strip of the room (rows under the lip) on top, so the ledge cuts him (desktop: at the waist, phone: mid-thigh).
- Room plates LOAD 1 / LOAD 2 come from the picture ticket factory/tickets/TICKET-HANDCRAFTED_HO072_LOADING.md.
- Rebuild: tools/cut_reus.py then tools/build_reus.py (crop box 2080,80,3300,2140 of the original).

## Rooms (12 Nov, from Nik's LOAD 1 try 2 and LOAD 2 try 2)
- ENV_LOADING_PLATE_HC_1X.webp 1920x1080 (137 KB), _2X 3840x2160 (384 KB): LOAD 1 locked to the approved HC 07 tunnel outside the men's zones (LOCK_MASK_LOAD1.png, 8 px feather; a leftover jacket scrap by the left pilaster was added to the mask), 16:9 crop rows 100-964 of the 1536x1024, Real-ESRGAN x4plus then down, fine grain.
- ENV_LOADING_PHONE_HC.webp 1179x2096 (122 KB), _590W (37 KB): LOAD 2 centre 9:16 crop, same upscale path. No lamp in the phone frame (house rule).
- Ledge (occluder, draw the room's rows from here down on top of Reus): desktop 92.6% of height (top of the marble slab), phone 87.9%.
- Weights, first paint: desktop 1x = room 1X 137 + REUS_D_1X 74 = 211 KB (cap 220). Phone first paint must use the 590W pair (room 37 + REUS_P_590W 45 = 82 KB, today 94 KB); the 1179 pair (122 + 106) loads only on sharp screens.
- Odd windows: 1363x936 and 820x1180 crop the sides, so anchor all layers left (Reus hand stays in); 844x390 crops top and bottom, so anchor top (his head stays in) and let the status line sit on the runner.
