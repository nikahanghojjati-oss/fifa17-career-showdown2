# PORT.md · Select League wordmark for main (job 1030, for Team G)

Goal: `#leagueWheelScreen > h2` ("SELECT LEAGUE") shows Nik's brush wordmark instead of the Kaushan Script text. CSS only: `index.html` stays unchanged and the `<h2>` text stays for screen readers (it is clipped out of the box, not removed).

## 1. Asset (copy as-is from this branch)
`visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V1.webp` (1400x274, 98.7 KB, sha256 `a35299752e9d3cfcc44b21ff882ac7fdd81b727af78002c5ce5d76459b29e322`). The PNG master is not needed on main. If main keeps a runtime/precache file list for `visual-assets/`, add this file to it.

## 2. CSS: add to `css/v10Setup.css` directly after the `> h2 {...}` rule (the one ending `filter: drop-shadow(...)`, around line 124)
```css
/* Job 1030: Select League brush wordmark (Nik's goal lettering, TITLE_LEAGUE_V1). Text stays for screen readers. */
#leagueWheelScreen.v26Skin > h2 {
  box-sizing: border-box;
  width: clamp(240px, 38vw, 729px);
  max-width: calc(100% - 16px);
  aspect-ratio: 2332 / 456;
  height: auto;
  margin: clamp(4px, 2vh, 22px) auto 6px;
  padding: 0;
  overflow: hidden;
  white-space: nowrap;
  text-indent: 150%;
  color: transparent;
  background: url("../visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V1.webp") center / 100% 100% no-repeat;
  -webkit-background-clip: border-box;
  background-clip: border-box;
  filter: none;
}
@media (max-width: 760px) {
  #leagueWheelScreen.v26Skin > h2 { width: min(66vw, 280px); }
}
```
Notes
- Specificity is (1,1,1), equal to main's `:is(#createShowdown,#leagueWheelScreen,...).v26Skin > h2`, so it wins by coming later. Keep it after that rule.
- `background-clip: border-box` and `filter: none` undo main's gradient-text clip and drop shadow (the shadow is inside the image).
- The 38vw width is the mockup ratio (the image box is 583 of 1536 goal px, 38%). At 1920 wide it is 729 px; at 1440 it is 547 px; at 393 wide it is about 260 px (66vw), 51 px tall.
- `max-width` guards 240 px floors on very narrow screens.
- The route-focus outline rule (`> h2[data-route-focus-target="true"]:focus`) still works; the h2 keeps `tabindex`.
- If the `.v26Skin` class is missing on `#leagueWheelScreen` (legacy skin), nothing changes: the old text title shows.

## 3. Markup
None. `index.html` `<h2>SELECT LEAGUE</h2>` is untouched.

## 4. Showcase reference (not for main)
In `visual-assets/v10_1/league/` the same image is set in `league.css` (`#leagueWheelScreen h2`) and sized/placed by `league.js` from the plate scale (box x 470-1053, y 118.5-232.5 of the 1536x864 goal). Main's flow layout cannot place by plate coordinates, so the width above uses the same ratio instead. Do not copy `league.js` changes.

## Addendum (06 Oct, lead check of Team G PR #419)

The rule above makes the title about 50px taller than the old text title. On short desktop windows (1366x650, 1280x620) that pushes CONTINUE TO CLUB ASSIGNMENT below the window. Add this block right after the phone override:

```css
@media (min-width: 761px) and (max-height: 760px) {
  #leagueWheelScreen.v26Skin > h2 { width: clamp(240px, 24vw, 420px); margin: 2px auto 4px; }
}
```

Checked with Team G's layout auditor at 1366x650, 1280x620, 1536x730 and 1440x900. CONTINUE and BACK are fully inside the window at all four sizes, at least as high as before the port. 1440x900 and taller windows and phones are unchanged. Sheet: `short_desktop_base_port_fix.jpg` (base | PORT | with this block).
