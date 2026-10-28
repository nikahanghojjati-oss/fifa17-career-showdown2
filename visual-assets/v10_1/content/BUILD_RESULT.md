# HO-036 content look: build result (Team V)

Skin only. Team G wires the data and the slots; nothing here changes game logic.
Real lines come from Team G's `data/*.js` on `gameplay/r86` (b9e4e8f7). Copies of those files are in `fixtures/` so the preview runs by itself.

Rules kept: black-and-gold marble, no dimming or see-through layers, nothing laid on top of anything.
Every piece goes in a reserved slot in the normal layout, and the panels below it move down.
Managers always stay.

## Files

| File | What it is |
|---|---|
| `content.css` | All styles (`.cmx-*`). Needs `shared/showdown-tokens.css` for fonts and gold. |
| `commentary.js` | `ShowdownContent.commentary.mount(slot, text, {typeMs})` is the TV bar. The full line reserves its height first, so the typing never moves the layout. `fill(line, vals)` fills `{winner}`-style placeholders. |
| `frontpage.js` | `frontPage.paper(p)` makes the newspaper. `frontPage.screen(slot, p, onContinue)` is the season front page with Continue. `frontPage.row(slot, pages, onOpen)` is the Legacy "Front pages" row. `variant: "gold"` is the Golden Showdown edition and `"draw"` is the drawn page. |
| `clubcard.js` | `clubCard.mount(slot, card)` takes one `data/clubCards.js` row. Empty facts are left out. |
| `scoutcard.js` | Scouting card on the back of the Special Player card: the canvas drawer plus the flip timing (reference copy of the Big Jump code). |
| `preview.html` | Frame compositor: `?frame=CM1&size=d` (1440x900) or `size=p` (393x660). Add `&still=0` to play the motion. It must be served over HTTP. |
| `frames/` | The rendered frames below. |

Crests use `window.getClubCrestSvg` from `js/visualIdentity.js` (the r85 crests).
Motion: the bar wipes in, then types at 28 ms per letter. The paper spins and drops in 1.25 s. The club card slides up in 0.6 s. With reduced motion everything shows at once.

## Where each piece goes

- **CM1, Season Results.** Commentary bar in a slot under the score panel; the buttons move down.
  - Phone: the gap above the buttons tightens by about 16 px, so there is still no scroll at 393x660.
- **CM2, Final Winner.** Same bar under the score panel.
  - Phone: the gap above the buttons tightens by about 14 px. It fits at 660, but only just.
- **FP1, FP2, FP3, season front page.** Its own screen on the Season Results plate, with Continue.
  - FP1 is a comfortable win (h1-035), FP2 a narrow win (h1-019) and FP3 the draw page (h1-052).
  - Phone drops the title and the fake text columns so the page fits under the faces.
- **FW1 and FW2, Final Winner front page.** The paper takes the Summary panel slot under the trophy, then Continue goes on to the summary.
  - FW1 is the 3-season final (h2-013). FW2 is the gold Golden Showdown edition (h2-037).
- **LG1, Legacy.** The "Front pages" row sits in the empty right side of the archive panel on desktop.
  - On phone it is a mini row in place of the carousel dots.
- **CC1, Club Assignment.** The club cards slide up under the crests, in the slot of the assignment panel, with Confirm below.
  - Phone shows one manager at a time, with a "Next: Nik's club" button.
- **SC1, Special Player.** After the face lands, the card flips to the scouting report (style, report, and "why he is special"), holds for 3.4 s, then flips back.
  - Nik's card starts after that. Live in the Big Jump preview v19.

## Frames

### CM1 Season Results commentary
![CM1 desktop](frames/CM1_1440x900.jpg) ![CM1 phone](frames/CM1_393x660.jpg)
### CM2 Final Winner commentary
![CM2 desktop](frames/CM2_1440x900.jpg) ![CM2 phone](frames/CM2_393x660.jpg)
### FP1 Season front page (comfortable win)
![FP1 desktop](frames/FP1_1440x900.jpg) ![FP1 phone](frames/FP1_393x660.jpg)
### FP2 Season front page (narrow win)
![FP2 desktop](frames/FP2_1440x900.jpg) ![FP2 phone](frames/FP2_393x660.jpg)
### FP3 Season front page (draw)
![FP3 desktop](frames/FP3_1440x900.jpg) ![FP3 phone](frames/FP3_393x660.jpg)
### FW1 Final Winner front page
![FW1 desktop](frames/FW1_1440x900.jpg) ![FW1 phone](frames/FW1_393x660.jpg)
### FW2 Golden Showdown front page
![FW2 desktop](frames/FW2_1440x900.jpg) ![FW2 phone](frames/FW2_393x660.jpg)
### LG1 Legacy front pages row
![LG1 desktop](frames/LG1_1440x900.jpg) ![LG1 phone](frames/LG1_393x660.jpg)
### CC1 Club card
![CC1 desktop](frames/CC1_1440x900.jpg) ![CC1 phone](frames/CC1_393x660.jpg)
### SC1 Scouting card (back of the Special Player card)
![SC1 desktop](frames/SC1_1440x900.jpg) ![SC1 phone](frames/SC1_393x660.jpg)

## Notes for Team G

- The newspaper name "The Touchline Gazette" is original. There are no real paper names or logos.
- The frames are composites: the approved NEXT_/PHONE_ mockups with the live components put into their slots. Seams where a panel was moved are softened. In the live game the layout does this for real.
- Phone Final Winner (CM2) is the tightest screen. If the live page is taller than the mockup, use the one-line commentary on phone.
