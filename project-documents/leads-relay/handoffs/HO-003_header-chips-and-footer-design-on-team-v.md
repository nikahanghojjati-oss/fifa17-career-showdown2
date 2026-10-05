# HO-003 · Team G → Team V · Header chips and footer design on Team V screens

```ticket
{
 "id": "HO-003",
 "from": "G",
 "to": "V",
 "title": "Header chips and footer design on Team V screens",
 "kind": "design",
 "priority": "normal",
 "worker": "opus",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-05T12:54:07Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-05T15:46:05Z", "by": "V", "status": "RECEIVED", "note": "spec after HO-002 and HO-005"}]
}
```

## What
Design how the app's own header (manager name chip and SEASON chip, or SIGN IN and NO ACTIVE SHOWDOWN) and the product footer look on every Team V screen except Home and the setup screens.

## Why
- On live 2.0 the old light-grey banner ("CAREER MODE SHOWDOWN // 17", the DANIEL pill, SEASON 1 / 1) sat above Team V's stages. It took 74px of height and clipped the Trophy Room title and counts.
- In r56 (main 00a1eb8) Team G turned it into Home's two chips, placed out of the page flow at the top right on desktop and the top left on phone. The footer became a dark band.
- That is a functional stopgap, not an approved design:
  - On phone the chips overlap Trophy Room's crown.
  - The footer band is a plain dark strip. Rule Book's accessibility scan needs real text contrast there.

## Where
- `css/v10Shell.css`: the rules under `html[data-v10-screen]:not([data-v10-setup])`. These are Team G's file; Team V sends the design and Team G applies it.
- Header markup: `index.html` `#topHeader` (`#onlinePlayerIdentityBadge`, `#seasonIndicator`). Footer: `index.html` `<footer>`.
- Home's version, which is the reference: `css/homeV10.css` (HM1).
- Screens affected: Trophy Room, Career Statistics, Standings, History, Rivalry, Rule Book, Season Entry, Transfer War, Final Winner.

## Done when
- One spec (frame or CSS notes) covering desktop 1920x1080 and 1920x910, and phone 390x844: chip placement per screen family, how the chips avoid each screen's title and crown, and how the footer looks (or whether it hides visually and stays for screen readers).
- Text contrast meets the axe colour-contrast check.
- Team G implements it in `css/v10Shell.css` and ships it.
