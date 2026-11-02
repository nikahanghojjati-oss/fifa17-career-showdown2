# Intake report · ENV_LG_PLATE_V1

- Source: ticket TICKET-026_1_OF_1_ENV_LG_PLATE_RAW.md in a ChatGPT Temporary Chat (Nik, 2026-10-02), try 1. The raw result is kept in raw/.
- Claude intake: the edit was resized to the mockup size, then a likeness lock was applied. Edit pixels are used only inside the guide zones (grown 12 px, feathered 5 px); everywhere else, including both managers, keeps the mockup's own pixels. Faces and hands next to a zone are protected. Where a banner crossed a zone edge, the original banner was kept. Leftover UI lines and brand marks the edit kept were cloned out by hand (see notes).
- 1X = 1672 × 941; 2X = 3344 × 1882 (Lanczos), WebP q88.

| File | Bytes | SHA-256 |
| --- | --- | --- |
| ENV_LG_PLATE_V1_SRC.png | 2123868 | 39d0f4c0c477c258c8947e33d2924c40a83d01eb1b5b166d449d78cfc8059065 |
| ENV_LG_PLATE_V1_1X.png | 2123868 | 39d0f4c0c477c258c8947e33d2924c40a83d01eb1b5b166d449d78cfc8059065 |
| ENV_LG_PLATE_V1_1X.webp | 228246 | 23a0ca4d5754484ed398b484563dd39f06ef889f177cd40cd6c155513aa5c200 |
| ENV_LG_PLATE_V1_2X.png | 5920220 | 88b5dd85cd8ecd1fd5410242c1906c541024ef2101eadc95e7fbd0fde3be34fe |
| ENV_LG_PLATE_V1_2X.webp | 495284 | 8717d782eb337b4f77f7596a76c36b0ab461a9bc319a8cc149d16d51a7a039a1 |
| raw/ENV_LG_PLATE_RAW_try1.png | 2204813 | 4066105667c9e0882bea02e8c43e56010d614169b4ff38d044d2abb63a6f09a5 |
| TITLE_LG_V1.png | 334455 | 5a736177a0471f19099ad228b16e36d1102d6f89394c7b23898177904ba73676 |
| TITLE_LG_V1.webp | 93800 | e480352898b4e30aa42817e005cf3f46ca66fc5716aec9926231d58e82d5f7f6 |

Prompt:

```
Edit this image. Repaint every solid cyan area so it shows what would naturally be behind it: the night stadium, crowd bokeh, floodlights, banners and dark atmosphere, continuing the existing perspective and the warm golden lighting. Where a person's body was covered, continue their clothes naturally. Keep everything that is not cyan exactly as it is: same people, same faces, same hands, same pose, same framing. Remove all cyan. Add no text, no letters, no logos, no new people. Same 16:9 framing, largest size available.
```

## Text clean-up (Claude, 2026-10-02 22:30 UTC)

The big banners all read correctly. The small crowd-board ribbons carried garbled AI lettering, so Claude smeared those thin ribbon bands sideways (41 px horizontal blur, feathered, polygons kept clear of both managers). They now read as glowing ribbons with no letters. The 1X/2X files were re-exported; the table above has the new SHA-256.

## Title wordmark (step 7, GPT-5.6 Sol)

`TITLE_LG_V1` was keyed directly from the ORIGINAL `MOCKUP_LEGACY_V2.png`; no image-generation request was used. Source crop: x=570..1099, y=130..274 in the 1672 × 941 mockup. A gold HSV seed was limited to the four large connected components that form the six brush letters, expanded only a few pixels to retain the darker brush texture, and given a soft dark silhouette so the mockup's outer-shadow treatment survives without stadium pixels. The alpha bounds were trimmed and resized exactly 2× with Lanczos. Both outputs are RGBA at 1028 × 280; PNG is the master and WebP is quality 92.
