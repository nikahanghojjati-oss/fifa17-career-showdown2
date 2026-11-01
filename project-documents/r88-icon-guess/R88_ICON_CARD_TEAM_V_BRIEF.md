# Team V brief: R88 Icon card and guessing screen

**Working name:** Icon Unmasked (Nik hasn't picked the final name). **Gameplay spec:** `R88_ICON_GUESS_FEATURE_SPEC.md`, in this folder. **Status:** ready for design. Nik approves the look. Team G wires it (skin only, no rule changes).

## What Nik asked for (31 Oct 2026)

- **Layout and quality:** take the card's layout and quality from the r86 Special Player card (`visual-assets/v10_1/special-player/`, HO-035). Its card faces live in `assets/card_*.jpg`; its build notes are in `project-documents/handoffs/SPECIAL_PLAYER_BUILD_RESULT_HO035.md`.
- **Don't reuse the Special Player art or colours.** This card is new art.
- **The Icon look:** the white and gold of real FIFA/FC Icon cards. Think pearl or ivory white, gold foil trim and warm champagne light.
  - Match the feel, not EA's artwork. No EA logos, no copied card frames and no traced EA assets.
- **No photos and no real faces.** Use a generic male footballer silhouette as the placeholder, with a small "ICON" word in our own type.
  - The silhouette must not look like any real player, and it is the same for every player.

## The card

It is one card face with these parts, each able to be hidden or revealed on its own:

- **Position:** for example CAM. It shows from the start of the round.
- **Six stat slots:** PAC SHO PAS DRI DEF PHY, in two columns of three, FIFA style. Each starts hidden as a face-down tile or "??".
  - Each flips to its number on its own reveal beat. The order is random each round, so any slot can go first.
- **Nation flag:** hidden until the last reveal. Draw flags in code, as the Special Player page does.
- **Overall rating:** hidden until the end by default. Nik may change this, so make it hideable.
- **Name plate:** hidden ("? ? ?") during play. The name only appears on the result screen.
- **No club crest,** because Icons have none.
- **Source line on the result:** small text showing which card the numbers come from, for example "PRIME ICON · FIFA 19".

## The screen around it

Both managers play on their own phones at the same time.

- **Two guess chips each:** Daniel's on one side, Nik's on the other, both visible on both phones. A chip dims when it's used, so each manager sees 2, 1 or 0 for both.
- **Countdown:** a ring or bar for each guess window, about 8 s and tunable from 5 to 10 s. It restarts after every reveal.
- **Guess bar:** a text field with a suggestion list under it, plus a GUESS button.
  - It must work with the iPhone keyboard open, with nothing hidden behind the keyboard.
  - Show a short "Not an icon in the list" note for text that matches no icon.
- **Waiting state:** "Waiting for Daniel" or "Waiting for Nik" until both are on the screen.
- **Result states:**
  - Win: "NIK +1 SHOWDOWN POINT" (or Daniel), then the full card face up with the name.
  - Draw: "NOBODY GOT HIM", then the full card.
  - Then a Continue button to the Transfer Challenge.
- **Beats:** the position, then six stat beats, then the flag beat, each followed by a guess window. Each reveal beat should take at most about 2 s, so the guessing time stays the focus.

## Wiring hooks Team G will need

These follow the Special Player pattern:

- **Inputs:** the page takes the round as input (the position, the stat order, the six values, the nation, the name and the source line). It never picks anything itself.
- **Play hooks:**
  - `reveal(index)` flips one beat;
  - `setChips(role, count)` sets a manager's chips;
  - `showResult(winnerRole or "draw")` shows the end.
- **Guess hook:** a guess the manager types is sent out as a message. The page never decides whether it's right.
- **Test clock:** a deterministic clock for tests, like `__mq` on the Special Player page.

## Rules to keep (same as HO-035)

- **No dimming layers,** and nothing covers the bar or buttons.
- **No EA logos, no real crests, no real faces.**
- **Lazy-loaded** only when the step opens. Keep it light: one card face and one background, well under the Special Player's 8.4 MB of assets.
- **Reduced motion:** with reduced motion on, flips become fades and the beats get shorter.
- **Sound** is off until the player turns it on.
- **Phone first,** on iOS Safari.
