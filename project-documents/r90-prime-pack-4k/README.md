# r90 Prime Pack desktop stage, 4K master (Team V)

File: `visual-assets/v10_1/icon-guess/assets/stage_desktop_4k_V1.webp`
3840 x 2160, WebP (quality 85, method 6), 376,820 bytes. sha256 `c6050854d41cb12988607b9071934fe3f0c548c014cacbff5667ed896139f157` (pinned in F9c).

Same picture as `stage_desktop.webp` (2560 x 1440). Nothing added, moved or removed; no text, no logos.

How it was made
1. Source = Nik's original PNG (leads/relay `attachments/HO-051/06_prime_stage_desktop_2560x1440.png`). That PNG was already soft
   (an upscale of a smaller GPT picture), so it was first brought down to 1536 x 864 to drop the blur and grid noise.
2. Real-ESRGAN x4plus (`sr_realesrgan.py`, weights loaded tensor-only) rebuilt fine detail at 6144 x 3456, then Lanczos to 3840 x 2160.
3. `merge_detail.py 3 1.15`: colours, light and every shape come from the original (Gaussian low-pass, sigma 3 px at 4K);
   only the fine detail (marble veins, gold edges, rims) comes from step 2. Mean brightness is unchanged (44.14 vs 44.14).

Geometry check (measured)
- Phase correlation against stage_desktop.webp at 2560: shift 0 px, 0 px.
- Strongest pedestal edges on the centre column: 67.29 / 75.9 % (2560) vs 67.27 / 75.9 % (4K). Same lines.
- So STAGE_ART.wide ped .705, front .05 and centring stay exactly right; only w/h change to 3840/2160 if the page reads them.

Preview: `PREVIEW_STAGE_4K_V1.jpg` (top: whole stage with the 70.5 %, 75.5 % and centre lines; below: current file stretched vs new master).
