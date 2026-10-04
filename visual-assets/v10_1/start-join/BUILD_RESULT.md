# START-JOIN-V1 · Start / Join desktop build

Factory job: `JOB-087 · Start / Join: build (desktop)`.

## Run

From the repository root:

```sh
python3 -m http.server 8765
```

Open:

```text
http://127.0.0.1:8765/visual-assets/v10_1/start-join/index.html?frame=SJ1
```

Replace `SJ1` with any frame from SJ1 through SJ8.

After Claude has generated the hand/rim WebPs from `tools/MAKE_ASSETS.md`, build the single-file review page from the screen folder:

```sh
cd visual-assets/v10_1/start-join
python3 tools/build_preview.py
```

## Frames

| Frame | Product state | Primary action / intent |
| --- | --- | --- |
| SJ1 | No connection yet; Daniel and Nik choices visible | Daniel: START A SHOWDOWN |
| SJ2 | Daniel created a code; waiting for Nik | COPY CODE beside Daniel-only code; NEW CODE / CHECK STATUS secondary |
| SJ3 | Nik entering Daniel's code | JOIN DANIEL'S SHOWDOWN |
| SJ4 | Bad pairing code | JOIN DANIEL'S SHOWDOWN with inline error state |
| SJ5 | Daniel + Nik paired; career ready | START CAREER; destructive session controls inside More |
| SJ6 | Connection read loading | No guessed action or authority |
| SJ7 | Partial authority; Daniel's known code retained | RETRY CONNECTION |
| SJ8 | Connection unavailable | RETRY CONNECTION without deleting saved career |

Every fixture is selected through `?frame=`; missing/unknown frame ids fall back to the first fixture.

## What changed from the mockup

- Kept the mockup's central glass composition: equal Daniel/Nik role cards, full-width current connection panel, host-code row, status treatment and bottom privacy line.
- Changed the fixed PRIVATE REMOTE JOINING title to the product-truth screen name CONNECT PLAYERS. The existing binary title asset contains the wrong words, so the build intentionally uses the approved display-font `TODO-WORDMARK` fallback until Claude supplies ticket 124 `TITLE_CONNECT_PLAYERS`.
- Changed mockup HOST/JOIN private-session jargon to the established product journey: Daniel starts/creates the code on the left; Nik joins Daniel's Showdown on the right.
- Replaced the mockup close X with the real Back control wired to `navigateBackSmart()`.
- Kept codes and join drafts as live DOM text/input only. Nik never receives Daniel's host code through `pairing.code`.
- Moved REVOKE OPEN SESSION, CLOSE SESSION and FORGET CODE into one confirmed More menu.
- Replaced protocol copy with the plain privacy sentence: `Only someone with this code can join.`
- Added honest designed loading, empty, partial, unavailable, bad-code, waiting and paired states from fixtures.json.
- Added the Daniel pointing-hand depth sandwich recipe so his approved plate pixels can cross the live panel edge without repainting or mirroring him.

## Scorecard · worker code review

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1. Mockup fidelity | 4/5 | Stage remains cover-centred with measured title/panel geometry and the mockup's two-card/current-session hierarchy; rendered diff remains Claude-owned. |
| 2. Characters stand out | 4/5 | Plate → live UI → registered Daniel hand cutout → directional rim light is encoded with the overlay fixed to scene origin. |
| 3. Hands and contact | 4/5 | Approved Daniel pointing-hand contour is preserved in 1X coordinates with a soft panel-edge contact shadow and no mirror/independent scale. |
| 4. Lighting and grade | 5/5 | Dark smoked glass, warm gold borders, black depth and directional gold rim treatment follow the shared visual language. |
| 5. Typography/title | 4/5 | Barlow/Barlow Condensed hierarchy and floating title block are correct; the CONNECT PLAYERS brush asset is the known ticket-124 intake gap. |
| 6. Panel craft | 5/5 | Equal role cards, aligned current panel, one primary per state, shared secondary buttons and confirmed More preserve premium hierarchy. |
| 7. Information clarity | 5/5 | Daniel-left host / Nik-right join is immediate, host code is permission-correct, and failed reads never masquerade as empty data. |
| 10. Polish and finish | 4/5 | DPR-aware plate/overlay references, shared kit, focus rings and explicit hidden states are in code; generated binaries/browser checks remain intake work. |

Average for criteria 1–7 and 10: **4.375 / 5**.

H1–H4 pass by code reading and are documented in `project-documents/factory/status/JOB-087.md`. Claude measures the remaining browser/render gates.

## Estimated first-paint weight

The intake report measures:

- `ENV_SJ_PLATE_V1_1X.webp`: 259,488 bytes.
- `ENV_SJ_PLATE_V1_2X.webp`: 537,232 bytes.

Desktop DPR 2 therefore begins with a 537,232-byte plate and has 362,768 bytes of the 900 KB desktop ceiling left for the transparent hand/rim WebPs plus text/CSS/JS. The overlay sizes do not exist yet, so H11 must be measured by Claude after running `tools/MAKE_ASSETS.md`; this document does not claim a measured H11 pass.

## Known gaps

1. Ticket 124: the correct CONNECT PLAYERS brush wordmark binary is not on the branch. The build deliberately does not load the old PRIVATE REMOTE JOINING wordmark.
2. `OVL_SJ_DANIEL_HAND_V1_{1X,2X}.webp` and matching rim WebPs are references only until Claude runs `tools/MAKE_ASSETS.md`.
3. Browser-only gates H5–H11, mockup diff, console/404 checks and visual hand-edge review are intentionally deferred to Claude intake per JOB-087.
4. The neutral confirmation sentence `Confirm this connection action?` is a documented DEFAULT because the contract requires confirmation but supplies no exact sentence for Revoke/Close/Forget.

## Claude intake

Run `tools/MAKE_ASSETS.md` in order. Claude must:

1. Generate Daniel's registered hand and rim PNG masters from the approved platemap contour, then export the four transparent lossless WebP runtime layers without moving, mirroring or independently scaling Daniel.
2. Supply ticket 124's CONNECT PLAYERS brush wordmark and replace the `TODO-WORDMARK` display-font fallback without changing the hidden semantic title.
3. Run `python3 tools/build_preview.py` after the runtime binaries exist so `preview.html` contains the real screen assets.
4. Render the screen on a real server and run the factory/browser checks assigned to intake: H5–H11, H10 mockup diff, console/network/404 checks, focus/keyboard, contrast and page weight.
5. Review Daniel's fingertip/hand edge at 100% and 200% for seam, halo, fringe and contact quality; keep Daniel LEFT and Nik RIGHT.

## Phone (JOB-088, part 1 of 3)

Phone is `max-width: 900px`. The stage is `100svh - 56px - safe area`; the 56 px bottom bar is a `.nav-reserve` placeholder. Measures below are inside that stage.

- Top: portrait stadium `ENV_SJ_PHONE_V1.webp` (cover, 50% 36%) with Daniel (left -4%, top 1%, height 60%) and Nik (left 49%, height 58%) from `phonemap.json`. Both heads fully visible, Daniel left. Dark gradient from 36% down.
- Middle: preview tag, eyebrow, CONNECT PLAYERS (display-font fallback, TODO-WORDMARK kept), tagline.
- Below: three real tabs DANIEL · START, NIK · JOIN, CONNECTION and the BACK button at the right end of the same row (it keeps its `navigateBackSmart` hook). One panel at a time; desktop shows every panel and hides the tabs.
- The tab follows the frame until the player picks one: Nik viewing or a code error opens NIK · JOIN; waiting, paired, loading, partial or unavailable opens CONNECTION; otherwise DANIEL · START.
- Action rows (START A SHOWDOWN, JOIN DANIEL'S SHOWDOWN, COPY CODE, NEW CODE, CHECK STATUS, START CAREER, MORE, RETRY CONNECTION) stick to the bottom of the panel, so the primary action stays visible at 375 × 553 while the text above scrolls inside the panel.
- Privacy line "Only someone with this code can join." stays under the panel.

Height budget at a 393 × 604 stage: art zone about 215, header about 85, tabs 40, panel 204, lock line 18, gaps and padding about 40. At 640 and below the eyebrow and tagline are hidden to give the panel room.

First paint (phone): ENV 126 KB + heroes 110 KB + CSS/JS about 30 KB = about 266 KB (cap 450 KB).

Checked at 393 × 660, 360 × 640 and 375 × 553 (frames SJ1, SJ2, SJ4, SJ5, SJ7, SJ8): no page scroll, no console errors, desktop 1366 × 768 unchanged.

### Phone, part 2 (JOB-185)

- Tabs are 44 px tall and BACK is 46 px. At 600 px high or less the Nik panel drops its kicker and glyph and the panel gets a 178 px floor, so at 375 × 553 the code field and the JOIN button are both fully visible (checked on SJ3).
- Code field and button are 44 px, input text 18 px (16 px minimum met).
- Design note: instead of two stacked HOST / JOIN buttons, the DANIEL · START and NIK · JOIN tabs each own one big action, and CONNECTION shows the code card with the copy button. Same DOM, no shrunk desktop.
- Keyboard: iOS Safari overlays the keyboard without resizing the page. With a 300 px keyboard only 253 px stay visible, which cannot hold this panel; the action row sticks to the panel bottom and the field scrolls inside the panel, so the player can reach both. This was reasoned, not tested on a device.
