# Shared navigation bar (JOB-125, 205, 206)

Top bar on desktop (> 900 px), bottom bar plus a corner gear on phone (≤ 900 px, hub screens only). Rules: [NAV_CONTRACT.md](NAV_CONTRACT.md). Test page: [proof.html](proof.html) (`?locked=setup` opens the locked frame).

## Add it to a screen

```html
<html lang="en" data-nav="hub">            <!-- hub | hidden (phone bar off) | none (Loading: no bar at all) -->
<link rel="stylesheet" href="../shared/navbar/navbar.css">
...
<script src="../shared/navbar/navbar.js"></script>
<script>
SDNav.mount({
  nav: { active: "stats", locked: false, reason: null },          // fixture shape; G-6 fields bind in job 104
  routes: { home: "../home/index.html", career: "../start-join/index.html", standings: "../standings/index.html",
            stats: "../career-statistics/index.html", rules: "../rule-book/index.html", settings: "../settings/index.html" }
  // onNavigate: function (key, route) { navigateTo(route); }     // in the app, instead of links
});
</script>
```

- If the page already has an approved `#topHeader` with `.topBarTab` buttons (Home), the component adopts it (adds keys, `aria-current`, the lock) and leaves its pixels alone. Pass `adopt: false` to always build the standard bar (CM17 badge, five tabs, gear capsule).
- The bottom bar goes into `.nav-reserve` if the page has one, else into `body`; it is `position: fixed` either way.
- Later changes: `SDNav.set({ locked: true, reason: "season-entry" })` or `SDNav.set({ active: "rules" })`.

## Space a screen must reserve

- Desktop: content starts below `var(--sd-nav-top-h)` (52 px).
- Phone hub: content ends above `var(--sd-nav-bottom-space)` (56 px + `env(safe-area-inset-bottom)`). Keep the top-right 50 × 50 px free for the gear. Add `viewport-fit=cover` to the viewport meta if the screen paints under the home indicator.

## Active tab and lock

- `active` is one of `home`, `career`, `standings`, `stats`, `rules`, `settings` (screen map in the contract). It gets `aria-current="page"`, gold text and the gold underline.
- `locked: true` dims the other tabs, adds a small lock mark and `aria-disabled="true"`; a tap shows the toast "Finish this step first" and does not navigate. Tabs never hide. `reason` is `transfer-window`, `season-entry` or `setup` (kept on the bar as `data-lock-reason`).
- Keyboard: every tab and the gear are buttons with a gold focus ring; targets are at least 44 × 44 px.
