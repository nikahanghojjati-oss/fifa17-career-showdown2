# R88 Icon guessing game: feature spec

Working name: **Icon Unmasked**. Nik hasn't picked the final name, so treat this one as a placeholder.
Status: design agreed with Nik on 31 Oct 2026. Nothing is built yet.
Repo anchor: main `5b4337fd` (r86 release). Roster Roulette, which this game follows, is on `gameplay/r87` (`73713d75`) and not merged yet.

## 1. What it is

Once every season, Nik and Daniel race to name a legendary player from a FIFA Icon card that reveals itself bit by bit. Whoever names him first gets **1 Showdown point** for that season. There's no punishment, no wheel and no release. Releases happen only in Roster Roulette.

These points are owner decisions (Nik, 31 Oct 2026):

- **Pool:** male outfield Legends and Icons only. No women and no goalkeepers. One card per player (see §6).
- **Timing:** every season, right after Roster Roulette and before the Transfer Challenge window opens.
- **Both phones, live:** each manager plays on their own phone, and guesses travel live between the two.
- **Typed guesses** with name suggestions. Plain letters count for special characters, so "Cech" matches Čech.
- **Two guesses each** per game. Wrong guesses are never shown to the other manager. Each manager has two guess chips beside their name, and both phones show both managers' chip counts (2, 1 or 0).
- **Winning:** the first right guess wins the point. If nobody gets it by the end, it's a draw and nobody scores.
- **Scoring:** the most a manager can score in a season goes from 11 to 12.
- **No photos and no real faces.** The card uses a silhouette placeholder. It is a white-and-gold Icon card in its own art, laid out like the Special Player card (Team V brief: `R88_ICON_CARD_TEAM_V_BRIEF.md`).

## 2. The round, step by step

1. **Arrive.** Each phone opens the screen after its Roster Roulette step. The round starts only when both managers are on the screen. Until then, each phone shows "Waiting for Daniel" or "Waiting for Nik".
2. **Reveal 0: position.** The card appears face up. Only the position shows (for example "CAM"). The six stat slots, the flag and the name are hidden.
3. **Guess window.** A countdown runs (default 8 s, tunable between 5 and 10). Either manager may type a guess at any time while a window is open.
4. **Reveals 1 to 6: stats.** One stat flips per reveal, in random order (for example DRI 91, then PAC 88, and so on). Each reveal is followed by a guess window.
5. **Reveal 7: nation flag.** This is the last reveal and the last guess window.
6. **End.** The game ends at the first right guess, or when both managers have used both chips, or when the flag window closes.
   - On a right guess, both phones show who won: "NIK +1 SHOWDOWN POINT", then the full card with the player's name, overall and source card (for example "Prime Icon · FIFA 19").
   - On a draw, both phones show "NOBODY GOT HIM", then the full card.
7. **Continue.** Each manager taps Continue to reach their Transfer Challenge, as they do after Roster Roulette today.

A manager who has used both chips watches the rest of the reveals, but can't guess.

## 3. Guessing rules

- **Input:** a text field with suggestions from the full icon list, starting after 2 letters. Matching ignores accents, case, spaces, dots and hyphens.
  - Each icon also has a short list of accepted names from the database: the card name, the full name, the surname, the plain-letter spelling and a well-known nickname. "Cech", "Petr Cech" and "Čech" all count as the same player.
- **A guess must be a name in the icon list.** Text that matches no icon is turned away with "Not an icon in the list", and it doesn't cost a chip. This keeps a typo from burning a chance.
- **Each accepted guess uses one chip,** right or wrong.
- **Hidden guesses:** wrong guesses are hidden from the other manager. Their phone only sees the chip count drop, for example from 2 to 1.
- **Timing:** guessing doesn't pause the countdown.
- **Same moment:** if both managers guess right at almost the same time, the guess the server records first wins. The phones' clocks are never used for this.

## 4. Fairness and sync (engineering notes for Team G)

- **The draw needs no reads or writes.** Which icon, the stat reveal order and the order of icons across seasons all come from the Showdown's own id (`pair_<64 hex>`) plus the season number. Special Player (`js/marqueePlayer.js`) and Roster Roulette (`js/rosterRoulette.js`) already work this way. Both phones agree on the draw with zero reads or writes.
  - No icon repeats inside one Showdown: the order is a seeded shuffle of the list, and season n takes row n.
- **Live guesses need one small new Firestore record per season round,** plus a Rules fragment. That is the only new provider work. It stays inside the free tier and must be counted by the existing read meter (`CareerModeFirestoreBudget`).
  - The record holds the round start (server time), each manager's chips used, and the winning guess (role, reveal index, server time).
- **The server must be able to confirm the winning guess, not just trust a phone.** One way: store a hash of the answer when the round starts, and have the Rules check the winning write against it. Team G and Sol choose the mechanism.
- **Reveal clock:** every reveal time is computed from the round's server start time, using the server clock offset the Transfer Challenge already uses. Both phones flip each stat at the same moment.
- **Dual full screen rule** (`00_SHARED_SHOWDOWN_DUAL_FULL_SCREEN_RULE.md`): both managers must see the whole game and its result screen on their own phone.
  - A phone that reloads or drops out rejoins at the current reveal.
  - A phone that missed the whole game is shown the result screen before the Transfer Challenge.
- **Wrong guesses** are never written anywhere the other phone can read. Only the chip counts are.
- **Files to add** (new files only, loaded lazily like the Special Player and Roster Roulette steps):
  - `data/icons.js`: the icon database.
  - `js/iconGuess.js`: the seeded draw and the guess matching.
  - `js/iconGuessStep.js`: the season step and its sync.
  - The Team V page: `visual-assets/v10_1/icon-guess/`.
  - A Rules fragment.
- **Hooks in shared files** stay small: the season flow (after the Roster Roulette step) and the Rule Book line.

## 5. Scoring change (11 to 12)

- **Today's maximum per manager per season is 11:** Champions League 5, league title 3, domestic cup 1, 100 league points or goals 1, top scorer or top assist 1. The Europa League's 3 never stacks with the Champions League (`js/scoring.js`, `js/sharedCanonicalScoring.js`). The Rule Book shows "MAXIMUM PER MANAGER / SEASON 11" (`js/ruleBook.js:151`).
- **The icon point is +1,** so the maximum becomes 12.
- **It follows the r80 Europa League pattern:** an optional extra result key that exists only for the manager who won the point. Every season already played, and every hash over old results, stays byte-identical. Old Showdowns read exactly as before.
- **The point decides seasons.** The season winner is whoever has more Showdown points (no tiebreak since r83), so the icon point can turn a draw into a win.
- **The point comes from the round record, never from a typed value.** Season results and canonical scoring take it from the round record. The Rules for season results and the season commit must accept the key only when the round record names that manager as the winner.
- **Files the point reaches,** the same set the Europa League touched: `js/scoring.js`, `js/sharedCanonicalScoring.js`, season results and season commit (shared, Spark and production), history convergence, the analytics and statistics views, the Trophy Room, the Rule Book, the commentary engine, and the season-commit, season-results and terminal-close Rules fragments.
- **Wait for r87.** r87 changes `firestore.season-commit-production.fragment.rules` and `js/productionSharedSeasonCommit.js`, so the scoring part must start only after r87 merges.

## 6. Icon database rules

The full job is in `CLAUDE_R88-ICON-01_HANDOFF_TO_SOL_2026-10-31.md`.

- **Pool:** male outfield players who had a Legend card (Xbox FUT, before FIFA 18) or an Icon card (FIFA 18 onward). No goalkeepers, because their cards show DIV HAN KIC REF SPD POS instead of the six outfield stats. No women.
- **Allowed cards:**
  - the single Legend card;
  - in the years Icons came as Base, Mid and Prime, the **Prime** card only;
  - in the later years with one Base card plus specials, the **Base** card only;
  - never a special (Icon Moments, Prime Icon Moments, any promo or event version).
- **One row per player:** the allowed card with the highest overall across all games. On a tie, the newer game wins.
- **Six stats:** every row has PAC SHO PAS DRI DEF PHY. A card showing a heading stat is excluded. As far as we can tell none exists in this pool, but the job flags it if one does.

## 7. Still to decide (Nik)

- **N1.** Does the game start in a Showdown that is already running, from its next season? Or only in Showdowns confirmed on R88 or later, which is how Special Player and Roster Roulette started?
- **N2.** Should the card's big overall rating show from the start, or stay hidden until the end? Default: hidden, because it gives a lot away.
- **N3.** The final name.

Defaults Nik can change in a word:

- the guess window is 8 s;
- the player's name and full card show on the result screen;
- text that matches no icon costs no chip.
