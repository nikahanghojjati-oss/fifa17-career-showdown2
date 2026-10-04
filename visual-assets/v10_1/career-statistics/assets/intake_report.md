# Intake report · ENV_CS_PLATE_V1

- Source: ticket TICKET-024_1_OF_1_ENV_CS_PLATE_RAW.md in a ChatGPT Temporary Chat (Nik, 2026-10-02), try 1. The raw result is kept in raw/.
- Claude intake: the edit was resized to the mockup size, then a likeness lock was applied. Edit pixels are used only inside the guide zones (grown 12 px, feathered 5 px); everywhere else, including both managers, keeps the mockup's own pixels. Faces and hands next to a zone are protected. Where a banner crossed a zone edge, the original banner was kept. Leftover UI lines and brand marks the edit kept were cloned out by hand (see notes).
- 1X = 1672 × 941; 2X = 3344 × 1882 (Lanczos), WebP q88.

| File | Bytes | SHA-256 |
| --- | --- | --- |
| ENV_CS_PLATE_V1_SRC.png | 2296241 | 035bc5f9079f7778e17d8608b69570096180df84e3b245c8ec9434bc1f07d59f |
| ENV_CS_PLATE_V1_1X.png | 2296241 | 035bc5f9079f7778e17d8608b69570096180df84e3b245c8ec9434bc1f07d59f |
| ENV_CS_PLATE_V1_1X.webp | 288588 | 77759cb0ff818bb674ae45f5431f6e5976b3724de98923f47521b0f59fcec352 |
| ENV_CS_PLATE_V1_2X.png | 6472943 | e707f03a0c1c989515d2bb313c1ac8eb87667e8541bf20c65978934c4e146f92 |
| ENV_CS_PLATE_V1_2X.webp | 606068 | 740e753cd4a6360a42658f5a1cd7c70ba848c05ed580a906f0333ecbd29149b9 |
| raw/ENV_CS_PLATE_RAW_try1.png | 2334746 | c7582c2afe07b6efc949c37618fa36357adf0e2974ab4014f11626035e17fbd1 |

Prompt:

```text
Edit this image. Repaint every solid cyan area so it shows what would naturally be behind it: the night stadium, crowd bokeh, floodlights, banners and dark atmosphere, continuing the existing perspective and the warm golden lighting. Where a person's body was covered, continue their clothes naturally. Keep everything that is not cyan exactly as it is: same people, same faces, same hands, same pose, same framing. Remove all cyan. Add no text, no letters, no logos, no new people. Same 16:9 framing, largest size available.
```

## Text clean-up (Claude, 2026-10-02 22:30 UTC)

The big banners all read correctly. The small crowd-board ribbons carried garbled AI lettering, so Claude smeared those thin ribbon bands sideways (41 px horizontal blur, feathered, polygons kept clear of both managers). They now read as glowing ribbons with no letters. The 1X/2X files were re-exported; the table above has the new SHA-256.

## Title wordmark (Job 24 step 7)

Method: cropped the `CAREER STATISTICS` screen-name lettering from the ORIGINAL `MOCKUP_CAREER_STATISTICS.png` and keyed it to transparency in Python. No image-generation request was needed. Gold glyph pixels were isolated in HSV, tiny stadium highlights were rejected by connected-component area, darker metallic edge pixels were recovered only adjacent to the glyphs, and the dark outer shadow was retained only in a narrow dilation ring. The keyed crop was trimmed and resized 2× with Lanczos. The scene behind the lettering is transparent.

Source crop before trim: x=515..1138, y=170..235 in the 1672 × 941 mockup. Final 2X wordmark size: 1216 × 126.

| File | Bytes | SHA-256 | Alpha |
| --- | ---: | --- | --- |
| TITLE_CS_V1.png | 249485 | 72a5c4b2348fef3028f3a96555e96d35a86f132de394c72924203947db3324c6 | transparent, 0..255 |
| TITLE_CS_V1.webp | 77696 | 7dbc3041a3b79684b5d28babfce2bb3aaf51138be820b4f7a4d4fcd7a68b4a04 | transparent, 0..255 |
