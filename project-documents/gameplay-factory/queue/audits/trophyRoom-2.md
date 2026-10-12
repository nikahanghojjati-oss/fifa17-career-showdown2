# JOB-1682 · trophyRoom.js second-half gameplay audit

## Finding 1 — PROBABLE: Trophy Room BACK button has no handler in this screen

- **File / lines:** `js/trophyRoom.js:24–29` (button creation), `js/trophyRoom.js:268–273` (screen entry).
- **Player sees:** On the dynamically created Trophy Room screen, tapping **BACK** may do nothing, leaving the player on the Trophy Room until another navigation control is used.
- **Why:** The module creates and appends the button but never binds a click handler during creation or when opening the screen. The relevant lines are:
  ```js
  back.type = "button";
  back.className = "backButton";
  back.textContent = "BACK";
  ```
  No `back.addEventListener(...)` or equivalent appears elsewhere in this file. This remains **PROBABLE**, rather than SURE, because another module could install delegated handling for `.backButton`; cross-module behavior was outside this ticket's permitted read scope.
- **Smallest change:** Confirm whether a global delegated BACK handler services this element. If not, bind this button to the existing Trophy Room return-navigation routine when it is created, with exactly one navigation action per tap.

No gameplay files or tests changed.