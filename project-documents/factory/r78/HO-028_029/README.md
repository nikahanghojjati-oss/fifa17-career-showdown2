# r78 look and feel: readable body type (HO-028) and one marble look for errors and pop-ups (HO-029)

Team V kit for Team G. CSS only. It adds no words, removes no buttons and changes no behaviour. Titles are not touched.
Every sample word in `preview.html` and in the shots is copied from main's source.

## What's in this folder

| File | What it does |
|---|---|
| `r78-type.css` | Body type tokens (`--r78-*` on `:root`) and the rules that use them. Section 2 is the Rules screen (Rule Book). Section 3 is the body-text layer for every other screen. It also has opt-in classes `.r78-body`, `.r78-prose`, `.r78-secondary`, `.r78-label`, `.r78-heading`. |
| `r78-marble-surfaces.css` | The marble components: `.r78-panel`, `.r78-btn` (primary, secondary, danger), `.r78-close`, the full-screen error `.r78-error-screen`, the inline note `.r78-note` (`--error`, `--warn`, `--info`, `--success`), the confirm modal `.r78-modal`, the restyle of the toasts `#appRuntimeNotice` and `.sd-nav-toast`, and section 7, which maps the old pale surfaces from the HO-029 audit onto the new look. |
| `r78-marble-tile.webp` | A 256x256 tileable black-marble texture, 6.4 KB. It is cropped from the marble floor of the approved `plates-v2/ENV_RULE_BOOK_PHONE_V2.webp`, made seamless and darkened to near-black with faint gold veins. |
| `preview.html` | A static preview on the real plates-v2 backgrounds. It shows a Rules sample with the real Rule Book text, the full-screen CONNECTION REQUIRED error, every note type, the C9 and C8 confirm modals and the toasts. Open it from a checkout of `factory/v1-wtt5ye` (it reads `visual-assets/` four folders up). |
| `contrast.py` | Measures the contrast of the text colours against the marble tile: `python3 contrast.py r78-marble-tile.webp` |
| `shots/` | Before and after pictures (list below). |

## Tokens

All contrast numbers are measured on the marble tile by `contrast.py`. "Worst" is the 99th-percentile bright gold-vein pixel. The tile's single brightest pixel is lower again: body 8.5:1, secondary 5.5:1.

| Token | Value | Use | Contrast on panel (mean) | Worst (bright vein) | Target |
|---|---|---|---|---|---|
| `--r78-font-body` | "R78 Barlow" (main's own Barlow woff2 files, `font-display: block`), then "Barlow", then system-ui | all body text | | | |
| `--r78-font-label` | "Barlow Condensed" 600/700, uppercase, `--r78-tracking-label` .08em | labels, eyebrows, buttons, section headings | | | |
| `--r78-size-body` | 16px (desktop and phone) | paragraphs, rules, dialog and error copy | | | |
| `--r78-size-secondary` | 15px | notes, toasts, helper lines | | | |
| `--r78-size-label` / `--r78-size-heading` / `--r78-size-button` | 13px / 18px / 15px | condensed labels, gold section headings, buttons | | | |
| `--r78-size-input` | 16px minimum on phones (stops iOS zoom) | inputs, selects, textareas | | | |
| `--r78-line` / `--r78-line-secondary` | 1.55 / 1.5 | | | | |
| `--r78-measure` | 64ch | paragraph max width | | | |
| `--r78-para-gap` / `--r78-item-gap` | .75em / .5em | paragraph spacing / gap between list items | | | |
| `--r78-ivory` | `#F2EBDD` | body text | **15.9:1** | **11.5:1** | 7:1 |
| `--r78-ivory-2` | `#C9BFA8` | secondary text | **10.3:1** | **7.5:1** | 4.5:1 |
| `--r78-gold` | `--sd-gold-400` `#F2C45B` | headings, labels | 11.5:1 | 8.3:1 | 4.5:1 |
| `--r78-gold-strong` | `--sd-gold-300` `#FFD34D` | values, numbers, warning tone | 13.2:1 | 9.5:1 | 4.5:1 |
| `--r78-error` | `#F07C6F` | error text and red button labels | 7.0:1 | 5.1:1 | 4.5:1 |
| `--r78-error-edge` | `#A3241D` (deep red) | error bars and edges only, never a fill | | | |
| `--r78-success` | `#7CC48F` | success text | 9.1:1 | 6.6:1 | 4.5:1 |
| `--r78-success-edge` | `#2F7D4E` (deep green) | success bars | | | |
| `--r78-panel` | `#110F0C` | the tile's solid fallback colour (its mean colour) | | | |
| Gold button label | `#07080A` on `--sd-gold-metal` | primary buttons | 14.0:1 on `#FFD34D`, 8.4:1 on `#D4A017` | 4.0:1 on the `#8A6A12` bottom stop, which sits under the text, not behind it | 4.5:1 |

The panel is opaque: the tile plus a 1px `--sd-gold-700` edge, a thin gold hairline 3px inside, and corner radius `--sd-radius` (3px). Floating panels (the modal and the toasts) add a 1px black outline and a tight drop shadow. Nothing dims or blurs the screen behind them.

## How Team G wires it

1. Copy `r78-type.css`, `r78-marble-surfaces.css` and `r78-marble-tile.webp` into `css/`, all side by side. The tile url is relative to the CSS. The font and plate urls are written for `css/` (`../visual-assets/...`).
2. Load `r78-type.css`, then `r78-marble-surfaces.css`, after every existing sheet. That means after `app.css`, `v10Shell.css`, `v10Setup.css`, `rulesSettingsV10.css`, `remoteJoining.css`, `season.css`, `saveLibrary.css`, `restore.css`, `analytics.css`, the navbar CSS and the lazily loaded `visual-assets/v10_1/rule-book/rule-book.css`. Most rules carry extra weight (`:root ...` or `:root:not(#r78):not(#r78) ...`) so load order is not critical. Loading them last is still the safe choice. Bump `?v=` as usual.
3. Optionally preload the two Barlow woff2 files so the first paint already has them.
4. Confirm modal: replace the 13 `confirm()` calls (C1–C12, C11 counts twice) with your async wrapper that builds the `.r78-modal` markup shown in the comment in `r78-marble-surfaces.css` section 5. Focus Cancel first. Esc and Cancel resolve `false`. Only the confirm button resolves `true`. Destructive actions get `.r78-btn--danger`, others get `.r78-btn--primary`. Title, body and button labels are yours.
5. Online identity gate (`#onlinePlayerIdentityOverlay`, `js/onlinePlayerIdentity.js`). Section 7e already overrides the inline look, so it works with no JS change (see `shots/after_app_connection_required_*`). To finish it properly:
   - In `ensureOnlineIdentityOverlay()`, delete the inline `background:"rgba(3,8,15,.92)"` and `backdropFilter:"blur(10px)"`. Add the class `r78-error-screen r78-error-screen--plate`.
   - In `renderOnlineIdentityOverlay()`, delete the card's inline `background:"#111820"`, `border:"1px solid rgba(255,255,255,.18)"` and `padding:"28px"`. Add `r78-panel r78-error-screen__panel`.
   - On the dismiss button, delete the inline `position/top/right/font/fontSize/background/border/color`. Add `r78-close r78-error-screen__close`.
   - Add classes to the copy: `r78-error-screen__eyebrow`, `r78-error-screen__title` and `r78-error-screen__body`.
   - Add classes to the buttons: `r78-btn r78-btn--primary` (TRY AGAIN, SIGN IN WITH GOOGLE) or `r78-btn--secondary` (DANIEL · PLAYER ONE / NIK · PLAYER TWO).
   - Put the buttons in `<div class="r78-error-screen__actions">`. For the two-up row, add `--two` and delete the inline grid.
   - Then delete the old `#onlinePlayerIdentityOverlay` block in `css/v10Shell.css` (about lines 110–135).
6. Shared Career Start and Shared Showdown Setup (`#productionSharedCareerStartOverlay`, `#productionSharedSetupOverlay`) were still pale. Section 7d now makes all four `.remoteJoiningOverlay` instances marble with no scrim. Add `.r78-btn--primary` to the single main action in each so it gets the gold button. Every other button there is a gold outline.
7. Full-screen error plate on phones: `.r78-error-screen--plate` uses main's `shared/plates/ENV_SYS_PHONE_V1.webp`. Swap in `plates-v2/ENV_SETTINGS_PHONE_V2.webp` when the phone V2 plates reach main.

What changes on the Rules screen: one body font (Barlow 16/1.55, ivory) and gold condensed section headings. Scoring becomes one row per award, with the label in body type and the value in gold. Rule cards get an opaque marble face. The cards have more air and about 64ch lines. On desktop, BACK TO MAIN MENU now sits after the last row. The board no longer fits in one view at 16px, and the old sticky button covered rule text while scrolling. The top navbar keeps HOME one tap away. Phones keep their docked Back and their accordion.

Settings note: on big landscape desktops the Settings board is one 1920x1080 composition shrunk with CSS `zoom` (0.75 at 1440x900, 1 at 1920x1080). On this screen only, `r78-type.css` 3d+ deliberately uses SMALLER on-screen sizes than the global tokens: panel intros, notes and row values 14px, motion and audio helper lines 13px, row labels 12px (main shows 12 / 9 / 8px at 1920x1080 and 9 / 6.75 / 6px at 1440x900). Each size is divided by the zoom factor so it shows at that size, and the extra height is paid for with tighter spacing inside the panels (panel padding 12px, smaller heading and row gaps, a 22px band for the STANDARD chip instead of 31px, and main's 390px cap on the Menu Click Feedback line lifted to 60ch). Panel positions, sizes, order and the 3-column motion choices are unchanged. Checked with an active Showdown (Delete Current Showdown showing) at 1280x720, 1280x800, 1350x900, 1366x768, 1440x900, 1536x864, 1600x900, 1680x1050, 1920x1080, 1920x1200 and 2560x1440: all three panels and the whole Showdown Data card are in view, `#settingsContent` does not scroll, the page does not scroll, and the motion helper lines wrap to 3 to 5 lines. On windows smaller than the composition, the full compensation would not fit. So the zoom divisor stops at 0.85 on 16:9 windows under 1080px tall, and at 0.75 on 16:10 and 3:2 windows under 900px tall, and the type shrinks a little with the window. At 1366x768 that gives about 11.5px intros, 11px helpers and 10px labels. Phones, sideways phones and tablets are outside these queries; phone Settings measures the same as the previous kit. The tagline sitting under the panel tops at 1366x768 is main's own geometry and is the same before the kit. Also note: Settings panel headings use `var(--sd-font-display, sans-serif)`, and that variable is not defined, so they render in a generic sans-serif. That is a heading font, so it is left alone here.

## Checklist (Team G, after wiring)

- [ ] No scrim: the screen behind a modal, a toast or a Start/Join overlay is not dimmed, greyed or blurred (`.r78-modal` and `.remoteJoiningOverlay` have a transparent background and no backdrop-filter).
- [ ] No see-through: every panel, note and toast is opaque marble (`r78-marble-tile.webp` on `#110F0C`).
- [ ] Titles unchanged: the Kaushan Script brush titles, wordmark pictures, `.sd-title`, the screen hero eyebrow and tagline lines, and the identity gate's brush title all look exactly as before.
- [ ] Inputs at least 16px on phones (`r78-type.css` 3i).
- [ ] No layout overlap at 360x640, 375x667, 393x852, 1366x768 and 1440x900. Kit check on main's real Rule Book with the kit injected: no overlap, no clipped rule and no sideways scroll at all five sizes, with each of the 6 phone sections opened in turn. The preview error, modal and toasts fit at all five sizes. Settings with an active Showdown fits in one view at 1366x768, 1440x900 and 1920x1080 (see the Settings note). Still to check after wiring: the Club notes (fixed box, 3f), the Save Library, Restore and Legacy tools, and the two newly marble overlays.
- [ ] No flash: static CSS only. The body face uses `font-display: block` on files main already ships. No animation or transition is added.

## Shots (`shots/`)

The four key Rules pictures are full-colour PNGs. The others are 256-colour PNGs to keep the folder small.

- `before_rules_desktop.png`, `before_rules_phone.png`: main's live Rule Book (main `8ffe292e`, served locally).
- `after_rules_desktop.png`, `after_rules_phone.png`: the same screen with `r78-type.css` injected (`page.addStyleTag`, file in `css/`). There are also `after_rules_desktop_scrolled_mid/end.png`, `after_rules_phone_scrolled_end.png`, `after_rules_360x640.png`, `after_rules_360x640_scoring_open.png` and `after_rules_1366x768.png`.
- `before/after_app_connection_required_{desktop,phone}.png`: main's real identity gate in the offline state, before and after, with the CSS only and no JS change.
- `after_app_confirm_modal_over_settings_{desktop,phone}.png`: the C9 modal over main's real, unchanged Settings screen.
- `before/after_app_toast_error_*.png`, `after_app_toast_success_phone.png`: main's real `showAppNotice` toast.
- `before_settings_desktop.png`: main's Settings at 1440x900. `after_settings_desktop.png` (1440x900), `after_settings_1920x1080.png` and `after_settings_1366x768.png`: Settings with the body layer and an active Showdown, so the full Showdown Data card with Delete Current Showdown shows.
- `after_preview_{rules,error,notes,modal,modal2,toasts}_{desktop,phone}.png`: `preview.html` at 1440x900 and 393x852.
