# Trophy Room · BUILD RESULT

Job: JOB-057 · Trophy Room: build (desktop)  
Branch: `factory/v1-wtt5ye`

## Run

From the repository root:

```bash
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/visual-assets/v10_1/trophy-room/preview.html` for the frame switcher, or open `index.html?frame=TR1` through `TR7` directly.

## Frames

| Frame | Contract state | Review purpose |
| --- | --- | --- |
| TR1 | ready · ALL | Main ready career history with both managers holding trophies. |
| TR2 | empty · ALL | New career; all four trophy families stay visible, dark, with `Not won yet`. |
| TR3 | partial · ALL | Readable-history values plus explicit 2-of-3 coverage and `AVAILABLE RECORDS`. |
| TR4 | ready · LEAGUE TITLES | League Titles category selected without changing Daniel-left/Nik-right identity order. |
| TR5 | unavailable | Honest unavailable treatment; no invented numeric history. |
| TR6 | loading | Stable shell while provider history is in flight; no fake zero values. |
| TR7 | ready · ALL | Nik leads, while Daniel remains the first/left manager and rank communicates the result. |

## What changed from the mockup

The approved 1672×941 Trophy Room plate remains the scene authority and is mounted through the shared stage engine with its platemap. The brush title is the approved `TITLE_TR_V1.webp` image with real hidden heading text. The central ceremony keeps one bright hero trophy on a black/gold plinth with DOM nameplate, spotlight, reflection and grounded shadow.

Product truth intentionally changes the mockup's unsupported competition-specific shelf. The six mockup cups become the four original Showdown trophy families: Showdown Champion, League Title, Domestic Cup and Champions League. Categories are exactly `ALL · SHOWDOWN · LEAGUE TITLES · DOMESTIC CUPS · CHAMPIONS LEAGUE`; duplicate ABOUT, SPECIAL, unsupported competition trophies and unrecorded stats are absent. Counts, manager names, ranks, records, categories and state copy are live DOM data from `fixtures.json`, never baked into imagery.

The authoritative platemap contains no cutout polygons and explicitly records that no hand/arm crosses a panel edge, so no fake arm cutout was fabricated. Protected faces and hands remain plate pixels.

## Desktop QA

- Factory QA: **28/28 desktop frame × viewport runs PASS** at 1366×768, 1440×900, 1920×1080 and 1366×640. Desktop H1, H5, H6, H7, control bounds, console, requests and fixture-string checks are all green.
- Browser contract audit: all seven states, four trophy families, five categories, rights allowlist and keyboard focus behavior pass.
- Keyboard: every enabled category tab and BACK is reachable; visible focus outline is 3 px.
- First-paint encoded bytes: **855,932 bytes (~835.9 KiB), PASS under the 900 KiB desktop limit**. The workflow's response-header measurement was 837.5 KiB.
- Runtime raster assets are WebP; no PNG/JPEG masters are referenced by the page.
- Console/page errors: none. Failed requests: none.
- Mockup-diff gate: **PASS**.
  - build SSIM 0.512 vs plate SSIM 0.527
  - build mean ΔE 12.1 vs plate 13.5
  - Daniel face 0.976; Nik face 0.982
  - Daniel hand 0.979; Nik hand 0.972
- Evidence: `evidence/desktop_gate.json`, `evidence/desktop_metrics.json`, `evidence/factory-qa/QA_SUMMARY.md`, `evidence/diff/scores.json`, and the committed compare imagery.

The generic shared harness also captures phone sizes. Its phone-only category-tab control-bounds failures are outside this desktop job; the screen already reserves the shared phone bottom-bar space, while phone composition/control fitting belongs to the phone-specific follow-up.

## Own scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1. Mockup fidelity | 5 | The mockup-diff gate passes with build SSIM 0.512 against plate 0.527, ΔE 12.1, and every protected face/hand box above 0.97. |
| 2. Characters stand out of the menu | 4 | Daniel and Nik remain the approved plate likenesses framing the hero/shelf; protected regions are unobscured and the platemap confirms no cutout edge is required. |
| 3. Hands and contact | 5 | Daniel/Nik hand protected-box scores are 0.979/0.972, with no UI cutting through either hand and the original chin/crossed-arm contact retained. |
| 4. Lighting and grade | 4 | The original warm-gold stadium grade remains the plate authority; hero spotlight, rim/glow, glass top edges and plinth shadow use the shared gold system without flattening the scene. |
| 5. Typography and title treatment | 5 | The approved brush wordmark image is used with visually-hidden real text; eyebrow/tagline and UI typography use the shared Showdown type system. |
| 6. Panel craft | 4 | The shelf/plinth/tabs use gold-edged dark glass, cut corners, original trophy art and measured mockup proportions; unsupported mockup objects were removed rather than replaced by placeholders. |
| 7. Information clarity and honesty | 5 | All seven authoritative states render contract truth, including empty/partial/loading/unavailable honesty, fixed Daniel-left/Nik-right identity and visible career ranks. |
| 10. Polish and finish | 4 | All desktop browser runs are clean, keyboard/focus passes, 1×/2× WebP plate handling is active, and first paint remains below 900 KiB. |

Average for criteria 1–7 and 10: **4.5 / 5**.

## Known gaps

No desktop blocking gap remains. Phone-only category-tab control fitting is intentionally deferred to the phone build/review lane; it does not affect the desktop acceptance recorded here.


## Phone

The ≤760 px layout is a separate portrait composition, not a scaled desktop view. The portrait stadium and large Daniel-left / Nik-right phone cut-outs occupy the upper scene, the brush title and compact hero trophy overlay that cinematic band, and the trophy categories/shelf occupy the lower content zone. Career Ranks and Career Records move behind the phone More sheet. BACK is pinned above the shared 56 px bottom-bar reserve.

### Height budget

This is a read-only CSS arithmetic check, not browser measurement. The additive flow uses the shelf boundary at 48% of viewport height. The title block and 22%-high compact hero ceremony are absolute overlays inside that upper band, so they consume 0 additional flow pixels. The shelf itself runs from 48% down to 116 px above the bottom; inside it, 44 px is the tab row, 6 px is the tab-to-card offset, and the rest is the swipe panel. Below the shelf are 8 px gap, 44 px pinned action, 8 px gap, and the 56 px shared nav reserve.

| Viewport | Hero band to shelf, 48% | Title / hero overlays | Tabs | Shelf internal gap | Swipe panel | Shelf→action gap | Pinned BACK | Action→bar gap | Reserved bar | Total | Remaining |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 393 × 660 | 316.8 px | 0 px extra | 44 px | 6 px | 177.2 px | 8 px | 44 px | 8 px | 56 px | 660.0 px | 0.0 px |
| 360 × 640 | 307.2 px | 0 px extra | 44 px | 6 px | 166.8 px | 8 px | 44 px | 8 px | 56 px | 640.0 px | 0.0 px |
| 375 × 553 | 265.4 px | 0 px extra | 44 px | 6 px | 121.6 px | 8 px | 44 px | 8 px | 56 px | 553.0 px | 0.0 px |

At 375 × 553 the BACK button spans y=445–489 px with the shared bar beginning at y=497 px, so the primary action remains fully visible. The table assumes a zero safe-area inset for easy arithmetic; when `env(safe-area-inset-bottom)` is nonzero, the same inset is added to the shelf bottom offset, button bottom offset and nav-reserve height, so it is absorbed inside the fixed viewport instead of creating page scroll. The swipe panel shrinks by exactly that inset.

Larger phones grow the useful content area rather than floating the layout: at 390 × 844 the swipe panel is about 272.9 px tall, and at 430 × 932 it is about 318.6 px tall, while the action/bar stack stays anchored to the bottom.

### Phone content and controls

- Always visible: portrait stadium, Daniel left, Nik right, brush title, compact Showdown Champion ceremony/nameplate, category chip row, horizontal trophy shelf, BACK, and the shared bottom-bar reserve.
- Moved behind More: Career Ranks and Career Records. These are secondary history, so keeping them out of the default composition protects the hero and swipe shelf at 393 × 660.
- Hidden on phone: the desktop top-bar reserve and preview pill. The desktop plate layer is also hidden because the phone uses its own people-free portrait stadium plus independent manager cut-outs.
- Shelf behavior: category chips are horizontally scrollable 44 px targets; trophy cards use `calc(50% - 5px)` with the existing 10 px gap, so exactly two cards fit across the scroll content at 393 × 660 while additional cards remain horizontally swipeable with scroll-snap.
- Primary action: BACK is 44 px high and pinned 8 px above the 56 px plus safe-area bottom-bar reserve. MORE/CLOSE is a separate 78 × 44 px checkbox target with a visible focus ring. Trophy Room has no text-entry inputs, so it cannot summon the software keyboard.

### Phone assets

Runtime phone art references WebP only:

- `assets/ENV_TR_PHONE_V1.webp` — measured 133,986 bytes.
- `assets/OVL_TR_DANIEL_PHONE_V1.webp` — referenced large on the left at x 24%, top 0, visible height 68%; Claude generation target ≤60,000 bytes.
- `assets/OVL_TR_NIK_PHONE_V1.webp` — referenced large on the right at x 76%, top 0, visible height 69%; Claude generation target ≤60,000 bytes.
- Existing `assets/TITLE_TR_V1.webp` remains the brush-title runtime asset.

No PNG master is loaded by the page. The two cut-out WebPs are intentionally referenced before they exist on the branch, per JOB-058's DEFAULT. Claude must run the existing `tools/MAKE_ASSETS.md` cutout recipes, refine edges, generate both WebPs, fill their SHA-256/actual sizes in `assets/phone_intake.md`, and composite the proof image. Claude then measures H5, H6 contrast, H7, H8, H9, H10 and H11 in a real browser at intake.

The phone-art maximum before the title/UI resources is 253,986 bytes, leaving 196,014 bytes under the 450,000-byte phone first-paint gate for the remaining first-paint resources.

## Fix round

- Done · Item 1: desktop `.phoneMoreToggle` is `display:none`; the ≤760 px rule restores the 78 × 44 px visually hidden, focusable MORE / CLOSE checkbox.
- Done · Item 2: category activation rerenders and then restores focus to the recreated active `.trophyTab` for the selected category.
- Done · Item 3: `#trophyPhoneMoreToggle[aria-controls]` now targets `#trophyRoomContent`, which actually owns the career-rank and record details exposed by MORE / CLOSE.
- Blocked · none.
- Claude re-measure · H5 phone fit, H6 contrast, H7 reduced motion, H8 keyboard/focus, H9 console/requests and H11 full phone first-paint weight. Reconfirm H10 remains PASS after this behavior-only fix round.

## Motion

The shared entrance is started by `sdEnter(root)` immediately after Trophy Room renders. The Trophy Room signature moments start in the same boot pass. This screen locally cancels the shared CSS panel `--i` animation delay because `sdEnter` already applies the 60 ms panel stagger in JavaScript; the stagger is therefore applied once and the hard 1.2 s entrance budget is preserved.

### Entrance timeline

| Element | Target | Delay | Duration | Easing / behavior |
| --- | --- | ---: | ---: | --- |
| Scene settle | `.trophyRoomScene` | 0 ms | 400 ms | `cubic-bezier(.22,1,.36,1)` |
| Phone Daniel / Nik | `.trophyPhoneHero--daniel`, `.trophyPhoneHero--nik` | 150 ms | 450 ms | `cubic-bezier(.22,1,.36,1)`; desktop managers remain protected plate pixels |
| Title wipe | `.trophyTitleBlock` | 250 ms | 450 ms | `cubic-bezier(.22,1,.36,1)` |
| Title glint | `.trophyTitleBlock` | 640 ms | 420 ms | shared gold glint, one pass |
| Panel tier `i` | `[data-sd-enter="panel"]` | `400 + 60 × i` ms | 500 ms | `cubic-bezier(.22,1,.36,1)`; `i` capped at 5, so latest finish is 1200 ms |
| Spotlight anticipation | `.heroCeremony .heroSpotlight` | 0 ms | 250 ms | held dark |
| Spotlight snap on | `.heroCeremony .heroSpotlight` | 250 ms | 180 ms | `cubic-bezier(.16,1,.3,1)` |
| Hero trophy rise | `.heroTrophyPicture` | 250 ms | 420 ms | `cubic-bezier(.16,1,.3,1)`; translateY(20px → 0) |
| Hero trophy glint | `.heroTrophyPicture::after` | 410 ms | 360 ms | ease-out, one pass |
| Shelf card `i` | `.trophyCard` | `560 + 60 × i` ms | 320 ms | `cubic-bezier(.16,1,.3,1)`; four-card ALL view finishes by 1060 ms |
| Trophy counts | `.managerCounts strong[data-count-value]` | 760 ms | 300 ms | shared cubic ease-out count-up |
| Winning-card shimmer | `.trophyCard[data-winning-card="true"]` | 760 ms | 420 ms | shared gold glint; one shimmer per trophy type |
| Primary action payoff | `.trophyBack` | 760 ms | 320 ms | `cubic-bezier(.22,1,.36,1)` |

The shared panel contract is the limiting path at 1200 ms exactly; the Trophy Room signature layer finishes by 1180 ms. Controls are bound as soon as `render()` completes and the motion layer never disables pointer or keyboard interaction, so the screen is usable by 600 ms while the finish choreography continues.

### Interaction motion

| Interaction | Target | Duration | Easing / behavior |
| --- | --- | ---: | --- |
| Category out | `.trophyGrid.tr-tab-leave` | 100 ms | `cubic-bezier(.22,1,.36,1)`, opacity + translateX(-12px) |
| Category in | `.trophyGrid.tr-tab-enter` | 120 ms | `cubic-bezier(.22,1,.36,1)`, opacity + translateX(12px → 0) |
| Tabs / Back / phone More press feedback | controls | 100 ms | transform/background/color only |
| Phone More sheet / shelf handoff | `.trophyPhoneSheet`, `.trophyShelf` | 120 ms | opacity only; no layout shift |

### Reduced motion

The system `prefers-reduced-motion: reduce` path and the app-driven `html[data-motion-reduced="true"]` / `[data-sd-motion-reduced="true"]` path are both present. Shared entrance choreography becomes a 150 ms fade. Trophy-specific transforms, glints and the loading spinner are suppressed; local transitions collapse to 120 ms opacity fades.

### Criterion 8 self-score

5 / 5. The entrance is choreographed from scene through characters/title/panels to the primary action; the trophy ceremony adds anticipation, rise, one glint, sequential card flips, count-up and one-time winning-card shimmer. The hard entrance ceiling is 1.2 s, interaction feedback is at or below 120 ms, motion uses transform/opacity (with only existing small-element filters), and both reduced-motion paths are implemented.

