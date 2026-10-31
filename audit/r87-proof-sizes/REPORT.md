# r87 proof lane W3-8: tablet and sideways layouts

Base: `gameplay/r87` @ `73713d75` (2026-10-31). Emulator only (firebase@12.17.0); nothing touched production.

## How it was shot

- **Showdown screens:** a full 1-season CE2PG run per size pair, with `tools/proof-sizes-hook.cjs` loaded through `NODE_OPTIONS=--require`. The hook changes no game or harness file. It shoots every new screen state once the screen has settled (no finite animation running, all pictures loaded). It runs layout checks at the top of the screen and again at the bottom of `main`.
  - 820x1180 (Daniel) + 844x390 (Nik): **PASS 182/182**, 46 shots.
  - 768x1024 + 740x360: 44 shots. A second 768x1024 + 844x390 run added the layer stack for F1.
  - 1920x1080 + 740x360: stops at Transfer guesses 4 of 4 times (F2). Every screen before that point is shot.
- **Screens a Showdown run does not open:** Rule Book, Music, Settings, Statistics, Legacy and Trophy Room, signed out, at all 5 sizes, shot by `tests/browser/r87-proof-sizes-tour.cjs` (34 shots). Every request off this machine is aborted.
- **Checks per shot:**
  - sideways page scroll;
  - any scroller other than `main`;
  - a control covered at its centre;
  - a control off-screen;
  - a cut button label;
  - a see-through dark layer (dimming);
  - a black screen (text in the DOM, none of it painted).
- `tools/proof-sizes-report.cjs` drops the known noise: controls under an open sheet, the account badge under full-screen pages, brush titles that are wider than their box on purpose, and the scrollable music track list.

## Findings (shots in `shots/`)

| # | Size | Screen | What | Evidence | Weight |
|---|---|---|---|---|---|
| F1 | 768x1024, 820x1180, 844x390, 740x360 | Season Results (`#seasonEntry`) | The whole screen is black. `#stage-root.v10SeasonStage` has computed **opacity 0** with no animation running (settled after 22 ms at 768x1024), while the results form under it is live and tappable. The 844x390 bottom shot taken about 150 ms later has content, so this is a black hold of unknown length on arrival. | F1-*.jpg; layer stack in the d run findings | **High**: black screen / flash (Reus Gate) |
| F2 | 1920x1080 | Transfer Challenge, guesses | LOCK MY GUESSES moves about 64 px up after guess 1 fills. The tap (at 245,922) lands on the empty `section.panel.own.phase-guess`, so nothing locks and CE2PG stops every time (4/4). At 1280x800 the same step passes. | F2-*.jpg; click trace | **High**: a real tap can miss the button |
| F3 | 1920x1080 | Select League + "Waiting for Nik" low strip | The strip sits over SPIN WHEEL and BACK (both covered), and its status line "Waiting for Nik to open the game" is cut off at the bottom edge (its body scrolls 134 px in 103 px). | F3 | Medium: something covers something |
| F4 | 820x1180, 740x360 | "Waiting for Daniel/Nik" panel | On a tablet the panel sits mid-screen over the league wheel. At 820 and 740 wide it is 3 to 6 px wider than the screen, so it scrolls sideways (823>820, 746>740). | F4-*.jpg | Medium |
| F5 | 768x1024, 820x1180 | Home | A dark box (behind the TWO MANAGERS · ONE LEGACY line) sits across Daniel's cheek and ear, and Nik's face is cut off at the right edge. | F5-*.jpg | Medium: covers a face |
| F6 | 844x390, 740x360 | Rule Book | The section card scrolls inside itself (`article.ruleSection`, 255 px in 230 px), so `main` is not the only scroller. | F6-*.jpg | Medium |
| F7 | 768x1024 | Legacy | The LEGACY brush title sits over Daniel's hand and arm. VIEW SEASON HISTORY and CLOSE SEASON HISTORY show at the same time. | F7 | Low |
| F8 | 768x1024 | Club Assignment | Nik's card is faded while Daniel's pack opens. Check this against the no-dimming rule. | F8 | Low, owner's call |
| F9 | 820x1180 | Club Assignment | Nik's card says REVEALED with a crest but no club name; Daniel's card shows "West Ham United". The packs show no crest yet. | F9 | Low to medium: check |
| F11 | 844x390 | Transfer, signings | LOCK MY SIGNINGS sits over REFRESH CHALLENGE: REFRESH CHALLENGE is covered at its centre. Found in the rerun at 9acd3ab, which shoots each Transfer phase. | F11 | Medium: something covers a button |
| F10 | 740x360 | Transfer, before the window | The right column is mostly empty, and the "15 MIN · 3 SIGNINGS · 3 GUESSES" line is near-invisible. | F10 | Low |

Clean at every size checked:
- no page-level sideways scroll except F4;
- no dimming layers;
- Settings, Statistics, Trophy Room, Standings, Career Start, Roster Roulette and the Showdown Champion screen have no covered or off-screen controls.

The music sheet's track list scrolls inside the sheet by design.

## Not proven

- Real phones and tablets.
- 1920x1080 screens after Transfer guesses (blocked by F2).
- Flash timing (the flash Gate check owns that).

## Re-run

```
npm i --no-save firebase@12.17.0
PROOF_SIZES="daniel=820x1180,nik=844x390" PROOF_OUT=test-results/proof-sizes/a \
  NODE_OPTIONS="--require $PWD/tools/proof-sizes-hook.cjs" CE2PG_PLAN=single CE2PG_SEASONS=1 node tests/browser/ce2pg-journey.cjs
node tests/browser/r87-proof-sizes-tour.cjs
node tools/proof-sizes-report.cjs test-results/proof-sizes/a test-results/proof-sizes/tour
```

Add `PROOF_TRACE=1` for click and console traces (that is how F2 was found), or `PROOF_SHOTS=0` to turn the shots off.
