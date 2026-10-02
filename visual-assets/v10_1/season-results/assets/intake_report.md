# Intake report · ENV_SR_PLATE_V1

- Source: ticket TICKET-027_1_OF_1_ENV_SR_PLATE_RAW.md in a ChatGPT Temporary Chat (Nik, 2026-10-02), try 1. The raw result is kept in raw/.
- Claude intake: the edit was resized to the mockup size, then a likeness lock was applied. Edit pixels are used only inside the guide zones (grown 12 px, feathered 5 px); everywhere else, including both managers, keeps the mockup's own pixels. Faces and hands next to a zone are protected. Where a banner crossed a zone edge, the original banner was kept. Leftover UI lines and brand marks the edit kept were cloned out by hand (see notes).
- 1X = 1536 × 864; 2X = 3072 × 1728 (Lanczos), WebP q88.

| File | Bytes | SHA-256 |
| --- | --- | --- |
| ENV_SR_PLATE_V1_SRC.png | 2093186 | d70314e481e4191573b453e9aac40f6e84db58520bd673b52b4b9adfa880f788 |
| ENV_SR_PLATE_V1_1X.png | 2093186 | d70314e481e4191573b453e9aac40f6e84db58520bd673b52b4b9adfa880f788 |
| ENV_SR_PLATE_V1_1X.webp | 281010 | 00d5ae4b55138933d5394530d3dfda8bd644d84b137f552c4bd80ad9e027194d |
| ENV_SR_PLATE_V1_2X.png | 6078795 | 52818396e50a48d31a8c5787b8f29a2a6945dab1813dab139e390253b1931139 |
| ENV_SR_PLATE_V1_2X.webp | 593726 | 65b119a557c1f5f295ecfd957c4ec2642bca095f1625709b3a71473e35d58715 |
| raw/ENV_SR_PLATE_RAW_try1.png | 2408235 | 3c5b7a1d0afb73f262ef695d95d893002209a057857e42228100dd44e315a8ab |

Prompt:

```
Edit this image. Repaint every solid cyan area so it shows what would naturally be behind it: the night stadium, crowd bokeh, floodlights, banners and dark atmosphere, continuing the existing perspective and the warm golden lighting. Where a person's body was covered, continue their clothes naturally. Keep everything that is not cyan exactly as it is: same people, same faces, same hands, same pose, same framing. Remove all cyan. Add no text, no letters, no logos, no new people. Same 16:9 framing, largest size available.
```

## Text clean-up (Claude, 2026-10-02 22:30 UTC)

The big banners all read correctly. The small crowd-board ribbons carried garbled AI lettering, so Claude smeared those thin ribbon bands sideways (41 px horizontal blur, feathered, polygons kept clear of both managers). They now read as glowing ribbons with no letters. The 1X/2X files were re-exported; the table above has the new SHA-256.
