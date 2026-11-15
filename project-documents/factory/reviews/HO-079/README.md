# HO-079 flat logo + titles (DONE by Team V, 15 Nov 2026)

Nik picked sample A, plain flat ink (14 Nov). The titles follow the same look.

## 1. Home wordmark LOGO_CM17_WORDMARK_V4 (file swap for V3)
- **Files:** LOGO_CM17_WORDMARK_V4_{2080,1040,640}.webp in this folder.
  - Copy them to visual-assets/v10_1/home/assets/, and the 640 also to assets/loading/.
  - Each is smaller than the V3 file it replaces: 88/42/24 KB vs 129/53/30 KB.
- **Look:** one flat gold ink, #C9A45C, Cormorant SC Bold.
  - "SHOWDOWN 17" sits on one line, with lining figures, so the 17 shares the baseline and cap height.
  - "CAREER MODE" is small above it.
  - No bar, medal, bevel, texture, shine or glow.
- **Build:** v4.py.

## 2. Screen titles: live text (Team G's preferred option)
- **Font:** visual-assets/v10_1/shared/fonts/CormorantSC-Bold-latin.woff2. It is already in the repo and SIL OFL licensed.
- **CSS:**
  - `font-family: "Cormorant SC"; font-weight: 700; color: #C9A45C; letter-spacing: .06em; font-variant-numeric: lining-nums; text-transform: uppercase;`
  - No text-shadow, gradient, filter or glow. Keep one cap height and baseline per slot.
- **Picture samples** for reference: TITLE_{HISTORY,TRANSFER,FINAL_WINNER}_FLAT_SAMPLE.png and HO079_TITLE_SAMPLES.jpg. Build: flat.py.
- The V3 title pictures can be retired once live text is in.

Keep the Reus photo plus its credit, and the Dortmund crest. Nothing goes behind a title.
