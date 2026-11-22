# Showdown navigation bar · contract (JOB-125)

Source: `project-documents/factory/DATA_CONTRACT_V1.md` §10 (Team G verdict "build it") and the job's product truth (G2V-001R2: phone bar on hub screens only). Product truth wins over the mockups: no ABOUT tab, no search, no profile icon, no sub-tab row.

## Tabs (exactly five, then settings)

| Key | Label | Destination (app screen id) | Notes |
| --- | --- | --- | --- |
| `home` | HOME | `mainMenu` | |
| `career` | CAREER | the current Showdown's live step (`dashboard`, or the setup wheel while setup is unfinished); with no Showdown, Home's Start / Join | the app's own `navigateTo` → `resolveCanonicalShowdownRoute` already does this |
| `standings` | STANDINGS | the Standings screen | no new data |
| `stats` | STATS | `careerStatistics` (Rivalry Statistics inside) | |
| `rules` | RULES | `ruleBook` | |
| `settings` | gear icon, right end | Settings (credits, Reus licence, app version) | ABOUT is folded in here |

- Tabs never hide. A tab whose data is not ready still opens its screen, which shows its own loading or unavailable state.
- Routes come from the page's config object (`routes`), never hard-coded product ids inside the component. In the app they map to `navigateTo(id)`; in the showcase they are file links.

## Active tab

`nav.active` is one of the six keys. Screen → active key: Home → `home`; Start / Join, Legacy, Trophy Room, live Showdown screens → `career`; Standings → `standings`; Career Statistics and Rivalry → `stats`; Rule Book → `rules`; Settings → `settings`. The active tab has `aria-current="page"`, gold text and a 2 px gold underline (phone: gold icon and label).

## Lock

Fixture shape: `nav: { active: "home", locked: false, reason: null }`. `reason` is one of `transfer-window` (Transfer War: live timer and private drafts), `season-entry` (unpublished inputs), `setup` (League and Club wheels). Real values arrive with Team G's G-6 and are bound in job 104.

While `locked` is true every tab and the gear keep their look (slightly dimmed, small lock mark), stay focusable and expose `aria-disabled="true"`. A tap shows the toast **"Finish this step first"** for 2.4 s and does not navigate. The active tab tap does nothing.

## Sizes and where it shows

| Width | Bar | Height | Shows on |
| --- | --- | --- | --- |
| > 900 px | top bar | 52 px, top of the page | every screen except Loading (locked where the lock rule says) |
| ≤ 900 px | bottom bar, 5 icons with short labels | 56 px + `env(safe-area-inset-bottom)` | hub screens only |
| ≤ 900 px | gear button, top-right corner | 44 × 44 px target | hub screens only |

Hub screens (`data-nav="hub"` on `<html>` or the stage root): Home, Start / Join, Legacy, Trophy Room, Career Statistics / Rivalry, Standings, Rule Book, Settings.
Hidden on phone (`data-nav="hidden"`): Loading, League wheel, Club wheel, Transfer War, Season Results entry, Final Winner reveal. Loading also hides the desktop bar (`data-nav="none"`).

A hub screen reserves the space itself: desktop content starts at 52 px; phone content ends 56 px + safe area above the bottom (`--sd-nav-bottom-space`). Every touch target is at least 44 × 44 px. No images: badge and icons are CSS and inline SVG; no real logos.
