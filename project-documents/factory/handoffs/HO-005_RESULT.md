# HO-005 result · V-243 · Home phone overlays V2

Ticket: `leads/relay` → `project-documents/leads-relay/handoffs/HO-005_mobile-home-hero-ghost-coat-between-dani.md`

## What changed
New phone overlays, each with only its own manager:

| File | Size | SHA-256 |
| --- | --- | --- |
| `visual-assets/v10_1/home/assets/OVL_HOME_DANIEL_PHONE_V2.webp` | 489×800, 57,720 bytes | `9c2bde331c0025b69d9122b0dc8e76200b914e2d10dc4e1f476525562f825193` |
| `visual-assets/v10_1/home/assets/OVL_HOME_NIK_PHONE_V2.webp` | 637×800, 48,458 bytes | `8b65513283e570a8a66a6de8762369f33354d751764e2dbf71f715338bddf374` |

* **Ghost coat gone.** Each overlay was cut from a person matte of the desktop plate and split along Nik's sleeve and shoulder edge. Daniel's overlay no longer carries Nik's sleeve, and Nik's overlay no longer carries Daniel's shirt and coat. The two coats now meet once, with Nik's arm in front.
* **Jacket line gone.** The thin light line across Nik's jacket comes from the desktop plate (2x rows 1313 to 1319). It was painted out before the cut. The desktop plate file itself is unchanged.
* **Plate text gone.** The old "The Maestro / SKILL. VISION. MAGIC." lettering, which sat beside Daniel's head, is gone too. It was baked into V1's Daniel overlay.
* **Placement unchanged.** Both V2 files use V1's exact crop box and pixel size, so the phone CSS stays the same and only the file names change. The frame (`home/index.html` and `home.css`) now points to V2. The V1 files stay in place.
* **Masters and recipe.** The masters are `OVL_HOME_{DANIEL,NIK}_PHONE_V2_2X.png`. The recipe is `project-documents/factory/tools/home_phone_overlays_v2.py`, and it reproduces both webp files byte for byte.

## Checked
The standalone frame was rendered at DPR 3 at 390×844, 430×932 and 393×660, with V1 on the left of each image and V2 on the right:
`project-documents/factory/evidence-claude-check/V-243/before_after_*.jpg` and `shoulder_before_after_390x844.jpg`.

## For Team G
Copy the two V2 webp files into the app, then point `css/homeV10.css` (and the `<picture>` sources, if the app has them) at the V2 names. Pin the hashes above. Please render 390×844 and 430×932 on the live layout and tell us if your placement differs from the frame.
