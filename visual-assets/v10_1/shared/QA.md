# Shared factory QA

`factory-qa.cjs` and `compare_sheet.py` are the common visual QA tools for Showdown Factory screens.

## Playwright harness

Serve the repository root so screen-relative assets resolve:

```bash
python3 -m http.server 8765
```

Run one screen/frame set from the repository root:

```bash
NODE_PATH=$(npm root -g) \
FACTORY_QA_OUT=visual-assets/v10_1/shared/evidence/qa_test \
node visual-assets/v10_1/shared/tools/factory-qa.cjs \
  http://127.0.0.1:8765/visual-assets/v10_1/home/ \
  visual-assets/v10_1/home \
  HM2
```

The positional arguments are:

1. base URL that serves the screen folder and its `index.html`,
2. repository-relative or absolute screen folder containing `fixtures.json`,
3. comma-separated frame names, for example `HM1,HM2,HM3`.

`FACTORY_QA_OUT` is optional. Without it, evidence is written to `<screen-folder>/evidence`.

Each frame is captured at these required viewport/DPR pairs:

* 1366x768 DPR 1
* 1440x900 DPR 1
* 1920x1080 DPR 1
* 1366x640 DPR 1
* 393x660 DPR 3
* 360x640 DPR 2
* 375x553 DPR 2
* 390x844 DPR 2
* 430x932 DPR 2

For every run the harness records HTML/body/stage scroll dimensions, every visible button/link/input and whether it stays inside the viewport, the primary action and whether it is visible, visible input/select/textarea font sizes, console/page errors, failed/HTTP-error requests, and HM2-relevant fixture strings. It writes `qa_report.json`, `QA_SUMMARY.md`, and one PNG screenshot per frame/viewport.

The named shared gates are:

* `H1`: visible `[data-manager="daniel"]` must be left of visible `[data-manager="nik"]`. Screens with staged managers must expose those attributes; missing markers fail the gate rather than being guessed from imagery.
* `H5`: no HTML/body/stage scroll and the primary action is fully in view. At 375x553, the product rule is primary-action visibility; the report still records all scroll measurements.
* `H6`: every visible input/select/textarea is at least 16 px.
* `H7`: the frame is rerun with Playwright `reducedMotion: "reduce"`; after 300 ms there must be no running document animations.
* `CONTROL_BOUNDS`: every visible button/link/input remains fully inside the viewport.
* `CONSOLE`: no page or console errors.
* `REQUESTS`: no failed request or HTTP response with status 400 or higher.
* `FIXTURE_STRINGS`: strings that apply to the requested frame are present in DOM text or common accessibility/value attributes. Template placeholders and alternate frame variants are not treated as literal required copy.

Primary-action discovery first uses `#stage-root[data-primary]`, then the frame fixture's `primary` value injected before page load, then the generic primary selectors. ThhÈÙY\ÈH\›™\ÜÈØÜ™Y[‹XYÛ›ÜİXÈÚ[H[İÚ[™Èš^\™\ÈÈ™H]]Üš]]]™K‚‚ˆÈÈÛÛ\\™HÚY]‚Ü™X]HÛ™H™]šY]È‘Èœ›ÛHH\™Ù][ØÚİ\[™HZ[ØÜ™Y[œÚİ‚‚˜˜\Úœ]ÛŒÈš\İX[X\ÜÙ]ËİŒLÌKÜÚ\™YİÛÛËØÛÛ\\™WÜÚY]œHˆSĞÒÕTœ™È•RSœ™È]šY[˜ÙKØÛÛ\\™Kœ™ÈˆKX›Ş[šY[Y˜XÙNMÍKLÍHˆKX›ŞšZËY˜XÙNŒLŒÍKLKÍŒˆKX›Ş[šY[Z[™ŒKÍKNLˆKX›ŞšZËZ[™ŒLMŒKLÌÌL˜‚‘XXÚKX›Ş\È˜[YNKLK‹L˜[ˆ[ØÚİ\Ûİ\˜ÙH^[ËˆHÛÜœ™\ÜÛ™[™ÈZ[Ü›Ü\ÈZÙ[ˆœ›ÛHHØ[YH›Ü›X[^™Y™YÚ[Û‹ˆHİ]]ÛÛZ[œÎ‚‚Šˆ[ØÚİ\[™Z[ÚYHHÚYH]HØ[YH™[™\™YZYÚŠˆHYHL\˜Ù[[Hİ™\›^HÛˆHØ[YK\ØØ[HÙ[\™YØ[˜\ËŠˆH[ØÚİ\ØZ[Ü›ÜZ\ˆ›Üˆ]™\Hİ\YY˜XÙKÚ[™›Ş‚‚•HÛÛ\\™HÛÛ™]™\ˆÚ[™Ù\È\ÜXİ˜][Ëˆ]™\Ù\™\ÈXXÚÛİ\˜ÙIÜÈ\ÜXİ˜][È›ÜˆHÚYKXK\ÚYKÛİ™\›^H™YÚ\İ˜][Ûˆ[™\Ù\ÈH[ØÚİ\[›Ü›X[^™YÛÛÜ™[˜]\ÈÛ›HÈY[YHÛÜœ™\ÜÛ™[™ÈÜ›Ü™YÚ[ÛœË‚‚ˆÈÈ›ØˆMÈÛYH›ÛÙ‚‚˜š\İX[X\ÜÙ]ËİŒLÌKÜÚ\™YÙ]šY[˜ÙKÜXWİ\İØ\ÈHLˆ›ÛÙˆXÚØYÙKˆİ\œ™[ÛYH™Y]\ÈHHX\šÙ\ˆÛÛ˜XİÛÈH\È^XİYÈ˜Z[[[HÛYHØÜ™Y[ˆ›ØˆYÈ]K[X[˜YÙ\H™[šY[˜[™]K[X[˜YÙ\H›šZÈ˜ÈH\›™\ÜÈ]\İ›İ[™™\ˆHÚY\Èœ›ÛH\ˆH^\İ[™ÈÛYHPH™\Ü™[XZ[œÈHØ[›ÛšXØ[\š]HÛİ\˜ÙH›ÜˆÛYHÙ[ÛY]H[™™\ÜÈ›ÈSØ›ÙKÜİYÙHØÜ›Û][š[™H™\]Z\™YLˆšY]ÜÜÚ^™\Ë‚