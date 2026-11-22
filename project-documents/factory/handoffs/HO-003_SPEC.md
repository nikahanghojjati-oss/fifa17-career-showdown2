# HO-003 spec · Header chips and footer on Team V screens (job V-246)

Applies to every Team V screen except Home and the setup screens (`html[data-v10-screen]:not([data-v10-setup])`): Trophy Room, Career Statistics, Standings, History, Rivalry, Rule Book, Season Entry, Transfer War, Final Winner, Settings.

**Ready CSS:** [`HO-003_v10Shell.css`](HO-003_v10Shell.css). It replaces the r56 block "Team V screens other than Home and setup" in `css/v10Shell.css` (the `#topHeader`, chip, footer and phone media rules). No markup change.

## Desktop (wider than 900px, checked at 1920x1080, 1920x910, 920x700)
- The two chips (manager chip or SIGN IN, then SEASON or NO ACTIVE SHOWDOWN) sit **inside the top navigation bar**, right side, 12px left of the Settings gear, vertically centred in the 52px bar (`z-index: 41`, one above the bar).
- They never touch a screen: titles, crowns, counts and stage art all start under the bar. Same place on every screen family.
- Chips: 28px tall, Barlow Condensed 600 12px, tracking .1em, uppercase, solid `#0d0f13` fill, 1px gold rule `rgba(242,196,91,.45)`, 2px corners. Manager chip text gold `#f2c45b`, season chip cream `#ece6d6`. Hover or keyboard focus on the manager chip: full gold border plus a soft gold ring.
- At 901px the chips still clear the five tabs (tabs end near 530px, chips start at 609px).
- Note: in r56 the chips were drawn under the stage on Rule Book and Standings, so they were invisible there; the new place fixes that too.

## Phone (900px and narrower, checked at 390x844)
- Every stage screen uses its top band for its title and crown inside the 393x660 no-scroll budget, and the gear already sits top right. There is no free corner, so **the chips are visually hidden** on these screens.
- They stay in the page for screen readers. Keyboard focus on the manager chip brings both chips back at the top left (so nobody tabs onto something invisible).
- Who is signed in stays reachable through Settings (gear), which shows the account and sign-in. Home keeps its chips as they are. If Nik wants the season visible on phone stage screens, Team V will design a place for it inside each screen's own layout.

## Footer (all sizes)
- Visually hidden on these screens, kept for screen readers. It only repeated the product name and version; the version is shown in Settings ("Application version"). This gives the stage the bottom 36px back and removes the low-contrast dark band that Rule Book's accessibility scan flagged.

## Contrast
- Chip text on the solid chip fill: cream `#ece6d6` on `#0d0f13` = **15.4 : 1**; gold `#f2c45b` on `#0d0f13` = **11.7 : 1** (axe needs 4.5 : 1). The fill is solid, so the stage behind cannot lower it.
- The footer has no visible text left to check.

## Pictures
- Close-up (desktop 920 wide, phone, phone with keyboard focus): [header_close_up.jpg](../evidence-claude-check/V-246/header_close_up.jpg)
- Rule Book 1920x910 before: [before_rules_1920x910.jpg](../evidence-claude-check/V-246/before_rules_1920x910.jpg) · after 1920x1080: [after_rules_1920x1080.jpg](../evidence-claude-check/V-246/after_rules_1920x1080.jpg)
- Standings after: [1920x1080](../evidence-claude-check/V-246/after_standings_1920x1080.jpg) · [390x844](../evidence-claude-check/V-246/after_standings_390x844.jpg)
- Rule Book phone after: [after_rules_390x844.jpg](../evidence-claude-check/V-246/after_rules_390x844.jpg) · 920x700: [after_rules_920x700.jpg](../evidence-claude-check/V-246/after_rules_920x700.jpg)

Not checked live: Trophy Room, Career Statistics, History, Rivalry, Transfer War, Final Winner, Season Entry (they need a career to open). The rule is the same selector for all of them; Team G please glance at Trophy Room on phone after wiring, since that is where the crown overlap was.
