# HO-077 Rule Book slab at 2X

| File | Size | Weight |
|---|---|---|
| ENV_SLAB_HC_V1_2X.webp | 3072x1728 | 125 KB |

sha256 e79e977a48019e5a98771463fdda6b224c279b4945960ee8afd6f57abcc9093d

- Same picture and same crop as visual-assets/v10_1/plates-hc/ENV_SLAB_HC_V1_1X.webp (HC 03 raw rows 80-944; downsized back to 1536x864 it differs from the 1X by 1.5/255 on average, i.e. WebP noise).
- Method: Real-ESRGAN x4plus (tools/esr.py) then tools/merge.py: colours and shapes from the original, only fine detail from the upscale, light grain. No new glow, no new veins, every original vein kept.
- HO077_BEFORE_AFTER_CROPS.jpg: left = today's 1X stretched to 2X, right = new 2X, 1:1 crops.
- Team G: copy into visual-assets/v10_1/plates-hc/, add the F9c pin, cut the 1920 version, wire like the other rooms.
