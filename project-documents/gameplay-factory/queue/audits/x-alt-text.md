# JOB-1475 — Team V picture descriptions and screen-reader labels (stage 1)

**Audit type:** source-only; no product changes. **Base:** `qa/mega-audits`.

**Files inspected (all four ticket-approved files):**
- `js/homeScreensV10.js` (lines 48–145): Home art, wordmark, tiles, Audius soundtrack controls.
- `js/clubScreenV10.js` (lines 108–243): Club backdrop/hero images, decorative wrappers, SVG crests, button glyphs.
- `js/transferScreenV10.js` (lines 166–270): Transfer art, production-control adoption, ID and ARIA-reference remapping.
- `js/careerScreensV10.js` (lines 109–112): Statistics/Trophy Room screen templates, title images, controls.

## Findings for Team G lead

**1. Club Assignment — dynamically inserted club crest SVGs lack an explicit decorative-image contract.**
- **File / lines:** `js/clubScreenV10.js:221–230`, especially line 228.
- **Evidence:** `clSyncCrests` inserts `getClubCrestSvg(club)` verbatim into `.panelCrest .crestRim`. This wrapper sets neither `aria-hidden` nor an accessible image name here. Club-name text is already present in the product (`#clubNameOne` / `#clubNameTwo`, lines 100–103), so a crest is duplicate visual information.
- **Risk:** If the upstream Team V markup has not hidden the crest's ancestor, screen readers may encounter a redundant, unnamed graphic. **Runtime confirmation required:** this four-file audit cannot establish the generated parent/crest SVG's computed accessibility tree.
- **Smallest markup change if reproduced:** ensure the decorative crest container has `aria-hidden="true"` (and its SVG `focusable="false"` as appropriate), e.g. set `rim.setAttribute("aria-hidden","true")` before assigning `innerHTML`. Do not change text, order or layout.

**2. Transfer Challenge — ID-renaming updates only one type of accessible-name reference.**
- **File / lines:** `js/transferScreenV10.js:199–204`, especially lines 202–203 and invocation at line 257.
- **Evidence:** `tfRenameIds` renames IDs of non-adopted Team V nodes and updates only `[aria-labelledby]`. Any remaining `label[for]`, `aria-describedby`, or `aria-controls` references to those renamed nodes would retain old IDs.
- **Risk:** Such a reference can lose its intended field label or description, or point at a different adopted production node. **Runtime confirmation required:** confirm affected references actually occur in the rendered plate, since production nodes intentionally retain original IDs.
- **Smallest markup change if reproduced:** remap ID-reference attributes only when their target is an entry in the `renamed` map, including `for` and applicable `aria-describedby`/`aria-controls`; retain original references to adopted production controls. Keep existing labels and UI unchanged.

## Checked without a source-level finding

- **Home:** decorative hero `<picture>` images use `alt=""` within hidden scene wrappers; wordmark is backed by visually-hidden title text; navigation tiles have visible text and hide their art/chevrons. Music-track buttons contain readable title/artist.
- **Club:** phone hero `<img>` elements use `alt=""` within `aria-hidden` wrappers; decorative header and versus copies are hidden while the original words stay accessible.
- **Transfer:** phone imagery uses `alt=""` inside `aria-hidden` and the decorative clock hands are hidden; the live product controls are adopted rather than replaced by unlabeled icon buttons.
- **Career Statistics / Trophy Room:** image-only ornamentation has `alt=""` or a hidden ancestor; Statistics title has visually-hidden text; the visible icon-bearing action buttons have text labels. The Trophy Room's phone-sheet checkbox has an `aria-label`.

**Limitations:** this is a static audit restricted to the four allowed binding files; Team V's frozen renderers and a live accessibility-tree inspection were deliberately out of scope. Neither risk above is claimed to be a confirmed user-visible defect. No game files, CSS, screen layout, text, tests, or behavior were modified.
