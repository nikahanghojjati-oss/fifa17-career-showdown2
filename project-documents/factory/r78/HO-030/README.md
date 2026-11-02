# HO-030 · r78 Loading screen (real Reus photo, black and gold)

The washed-out sepia Loading screen becomes a black-and-gold marble scene. The real licensed Marco Reus photo
(`assets/marco-reus-2015-cc-by.webp` on main, Tim Reckmann, CC BY 2.0) is cut out from the pitch and stands in
the approved empty marble tunnel (`visual-assets/v10_1/plates-v2/ENV_LOADING_PHONE_V2.webp`). The title,
loader and credit sit next to him and never cover his face or the BVB crest.

Before and after: `shots/BEFORE_*.png` (main today, 1440x900 and 393x852) and `shots/AFTER_*.png` (this design at
1440x900, 1366x768, 393x852, 360x640, 852x393). `shots/AFTER_EXTRA_SIZES.webp` shows 13 more sizes (1920x1080,
2560x1080, 1280x800, 940x700, 1024x768, 844x390, 740x360, 768x1024, 820x1180, 800x800, 390x844, 430x932, 375x553).

## Files

| File | What it is | Size |
| --- | --- | --- |
| `LOADING_REUS_DESKTOP.webp` | 1920x1080. Tunnel and Reus on the left, black marble slab with a gold seam on the right (title side). WebP q64. | 92,734 B |
| `LOADING_REUS_PHONE.webp` | Stored at 1080x1920 (same 9:16 crop as the 1179x2096 layout grid; CSS anchors are in 1179x2096 picture px through object-fit, so nothing moves; the markup's width/height 1179x2096 keep the same aspect). WebP q37. Portrait. Reus in the tunnel, dark ceiling above him for the title, dark floor below for the loader. | 93,162 B |
| `loading-r78.css` | The new `#loadingScreen` styles, readable, with comments. | 10 KB |
| `loading-r78.min.css` | The same rules minified (written by `make_loading.py`). This is what goes into `css/app.css`. | 5.3 KB (1.9 KB gzip) |
| `loading-r78.html` | The new `<section id="loadingScreen">` markup and the preload tags. | 2 KB |
| `preview.html` | Opens the design on this branch (serve the repo root, open `/project-documents/factory/r78/HO-030/preview.html`; add `?motion=reduce` for reduced motion). | |
| `make_loading.py` | Rebuilds both pictures from the sources (Pillow and numpy only). Picks the best WebP quality under the release cap (static-app-release-contracts: 95,000 B each; the script aims at 92 KiB) and writes `loading-r78.min.css`. | |
| `make_matte.py`, `source/reus_alpha.png` | The one-time cut-out. The matte is kept, so you only need `make_matte.py` (rembg, pymatting) if the cut-out has to change. | 59 KB |

## What was done to the photo

Allowed edits only: cut out from the pitch, placed at 1:1 scale (his face is the photo's own pixels, no
resizing), colour graded (deeper blacks, warmer gold highlights, more contrast and local clarity, a soft
shoulder so the yellow kit does not clip, skin saturation held back), a faint gold edge light and light wrap
from the lit tunnel behind him, a dark vignette into the marble floor at the bottom. No redraw, no face change,
kit logos (Puma, Evonik, BVB crest, 11) as in the photo. No AI image tool was used. The marble slab on the
desktop picture is drawn by `make_loading.py` (seeded, same every run) to match the tunnel walls.

Crest: the BVB crest is on his shirt (and a small one on the shorts) in the photo. The current screen has no
separate crest element (the round "CM 17" badge is the game's own mark). The shirt crest stays fully visible
and clear of all text on every screen size tested.

## How Team G wires it

1. Copy the two pictures to `assets/LOADING_REUS_DESKTOP.webp` and `assets/LOADING_REUS_PHONE.webp`
   (keep `assets/marco-reus-2015-cc-by.webp` as the licensed source).
2. `index.html`: replace `<section id="loadingScreen"> ... </section>` with the section in `loading-r78.html`
   and change `?v=REV` to the release revision. Ids `#loadingScreen`, `#startupAthlete`, `#loadingText` and
   all existing `.startup*` classes stay. New: `<picture>` around `#startupAthlete`, `.startupLoader` (the slim
   gold line). The credit is no longer `aria-hidden` (screen readers read it), with links to the Flickr photo
   and the licence (`tabindex="-1"`, so the splash never takes focus).
3. `index.html` `<head>`, before the stylesheets:
   ```html
   <link rel="preload" as="image" href="assets/LOADING_REUS_PHONE.webp?v=REV" media="(max-aspect-ratio: 6/5)" fetchpriority="high">
   <link rel="preload" as="image" href="assets/LOADING_REUS_DESKTOP.webp?v=REV" media="not all and (max-aspect-ratio: 6/5)" fetchpriority="high">
   <link rel="preload" as="image" href="visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V1.webp">
   ```
   The media queries match the `<picture>` source exactly, so each device downloads one picture only.
4. `css/app.css`: replace the block from `@font-face{font-family:Startup;` down to
   `@media(prefers-reduced-motion:reduce){#loadingScreen *,#loadingScreen::after{animation:none!important;}}`
   with the contents of `loading-r78.min.css` (same place in the file, so the order is unchanged). It also works
   loaded as its own stylesheet right after `app.css` (it neutralises every old rule), but replacing is cleaner.
   Browser floor: container query units (Chrome/Edge 105, Safari 16, Firefox 110), same as the rest of Team V's CSS.
   Fonts: Barlow Condensed 700 (already the `Startup` font) and Barlow 400 for the credit, both from
   `visual-assets/v10_1/shared/fonts/`. The title is the existing wordmark `LOGO_CM17_WORDMARK_V1.webp`.
5. Put both pictures in the offline cache list next to the old Reus photo, and add them to whatever asset or
   gzip budget lists name the old photo.

Which picture shows where: phones (taller than 31:50) fill the screen with the phone picture; tablets in
portrait and square windows (31:50 to 6:5) show the whole phone picture centred on the dark marble colour, so
the loader never sits on his shirt; everything wider uses the desktop picture (16:9, 16:10, 4:3, ultra-wide,
sideways phones), cropped from the top so his head always stays.

## Tests that need a one-line update

I ran the repo audits against main with this design dropped in (locally, not committed):

- `tests/browser/loading-visual-audit.cjs`: all checks pass except the old mobile crop anchor. Change
  `/^54%\s+0(?:px|%)$/` to `/^50%\s+0(?:px|%)$/`. With that change all four cases pass.
- `tests/browser/loading-first-paint-audit.cjs`: passes as is, 12/12 viewports (labels visible, no overflow, later CSS cannot restyle the loader, both reduced-motion modes).
- `tests/contracts/reus-gate-startup-contracts.cjs`: no JS change, so the gate behaviour is the same. With only its budget number raised to 38,100 (in a scratch copy) every browser check passes: slow start with and without reduced motion, Rule Book and Club plate gate, no-loader fallback, failed-loader release. With the real number it fails on the budget line only (below).
- Startup gzip budget: the first kit (8c916268) was 2,326 B gzip and put main 518 B over 37,495. Slim v2 (Team G ask, 17 Oct) is 1,883 B gzip, 443 B smaller: the old block is replaced, so no rules cancel old ones; one font stack on `#loadingScreen`; the credit uses the system sans (no second font file, `StartupText` is gone); the CM17 roundel keeps its gold ring but drops the two thin inner/outer rings and the glow; tablet side bands are flat dark; portrait sizes come from `--s` = 1.3 picture px (within a few percent of v1). Same anchors, ids and classes. Team G measures the final bundle. I did not change any test or budget.

## Credit text

`Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped and edited for display`

Small but readable: 9 px minimum, 14 px on a 1920x1080 screen, light cream on dark marble, bottom right on
desktop, bottom left on phone.

## Checklist

- [x] Real photo unchanged in identity: 1:1 pixels of the licensed photo, colour grade and cut-out only, no redraw, no face or logo change.
- [x] BVB crest fully visible and clear of title, loader and credit (checked by geometry at 18 screen sizes, not only by eye).
- [x] Face fully visible and clear of all text at the same 18 sizes.
- [x] Credit present, includes "edited", readable by screen readers.
- [x] No dimming overlay, no CSS filter, no blur on the photo (grade is baked into the picture).
- [x] No layout shift: the picture box is fixed to the screen (`position:absolute; inset:0`, `object-fit`), its size never depends on the file. Title, loader and credit are text and CSS, so the screen is complete on first paint; until the photo decodes the frame shows the picture's own dark tones (warm tunnel left, black slab right), so a late photo never flashes bright. Preload plus about 92 KB keeps that gap short.
- [x] No flashing animation: the only motion is the slim gold line sweeping (transform only, opacity never changes). The four gold bars are static. Off with `prefers-reduced-motion` and with the app's reduced-motion setting (line shows full).
- [x] Sizes: desktop 92,734 B, phone 93,162 B, both under the 95,000 B release cap, and each device loads only one. Face and BVB crest checked at 1:1 after re-export (17 Oct).

## v3 (17 Oct, Team G r78 asks): title baked in, pictures under 95,000 B

- The whole title block (CM17 roundel, THE RIVALRY STARTS HERE, the CAREER MODE SHOWDOWN 17 wordmark, the TWO MANAGERS · ONE LEGACY box) is now part of both pictures, so Loading is one picture and one paint (the career-screens V9 guard forbids preloading the wordmark, which made the title pop in late on a slow load). The `.startupIdentity` markup and the wordmark preload are gone; CSS keeps `.startupIdentity{display:none}` in case old markup is still there.
- Overlays `source/identity_desktop.png` (block at x1170 y196, 660 wide) and `source/identity_phone.png` (x170 y70, 839 wide, inside the crop of the tallest phones) are the v1 HTML block rendered at picture size with a transparent background by `bake_identity.cjs`; `make_loading.py` composites them before encoding.
- Crops: landscape crops from the left only as much as needed to keep picture x0..1860 in view (`--ox`), so the baked title is never cut; windows narrower than 7:5 (was 6:5) use the portrait picture. The `<source>` and preload media queries changed to `(max-aspect-ratio: 7/5)`.
- Sizes: desktop 93,674 B (q52), phone 93,792 B (q40, stored 1080x1920). The tunnel backgrounds are softened slightly (depth of field) so the face, crest and title stay sharp under the cap.
- CSS: `loading-r78.min.css` 3,623 B, 1,430 B gzip (was 1,883).
- Shots: `shots/AFTER_V3_*.webp` (1440x900, 1366x768, 1500x1000, 852x393, 393x852, 360x640, 768x1024). On 360x640 the baked kicker is small (about 8 px), as decoration.
