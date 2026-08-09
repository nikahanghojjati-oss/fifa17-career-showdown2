# NEXT TASK

## Current gate: v0.95.0-r10 — League confirmation stabilization

Owner/browser accepted:

- Workstream 1B / `0.95.0-r4` — FIFA-era presentation, procedural club identities and two-pack reveal;
- Workstream 2 / `0.95.0-r5` — phased Transfer Challenge and canonical FIFA 17 transfer metadata/selectors;
- Workstream 3 / `0.95.0-r6` — Settings and persistent motion accessibility;
- Workstream 4 / `0.95.0-r8` — Career Statistics / Trophy Room / Rivalry Statistics after Home-bootstrap stabilization;
- Workstream 5 / `0.95.0-r9` — Season pre-commit Review / Edit / Confirm & Save flow.

**Application version:** v0.95.0  
**Asset revision:** `0.95.0-r10`  
**Current activity:** stabilization bugfix before Workstream 6  
**Source status:** r10 implementation/documentation synchronized; deployment candidate awaiting exact-head proof  
**Owner acceptance:** pending

Do not begin Workstream 6 until the r10 browser regression below passes.

---

# r10 bug fixed

## Reported behavior

After the League Wheel finished selecting a league, the application automatically transitioned into Club Assignment even though the screen displayed a **CONTINUE TO CLUB ASSIGNMENT** button.

## Root cause

`js/leagueWheel.js` intentionally scheduled `prepareClubAssignment()` after the spin completed:

- normal motion: 700 ms after selection;
- reduced motion: 120 ms after selection.

The UI therefore displayed an explicit Continue action while the runtime independently auto-advanced behind it.

## Corrected contract

The flow is now:

**Spin League Wheel → League Selected → stay on League Wheel → CONTINUE TO CLUB ASSIGNMENT → League Confirmed → Club Assignment**

There is no automatic post-spin navigation timer.

### League Selected

After a successful spin:

- the selected league is persisted immediately;
- the league remains locked and cannot be rerolled;
- showdown status becomes `League Selected`;
- the League Wheel stays visible indefinitely;
- the action becomes **CONTINUE TO CLUB ASSIGNMENT**.

Refreshing or resuming at this point returns to the same League Wheel with the same selected league and still requires Continue.

### Explicit Continue

Pressing **CONTINUE TO CLUB ASSIGNMENT**:

1. changes status to `League Confirmed`;
2. saves that confirmation as a critical write;
3. rolls back to `League Selected` if the save fails;
4. opens Club Assignment only after the confirmation save succeeds.

A failed confirmation save therefore cannot silently advance the user.

### Back/resume safety

If the league is already `League Confirmed` but clubs have not yet been assigned, returning to the League Wheel and pressing Continue reopens the same Club Assignment without rerolling or changing the selected league.

`js/screens.js` now treats `League Selected` and `League Confirmed` as separate route states:

- `League Selected` + no clubs → canonical route is League Wheel;
- `League Confirmed` + no clubs → canonical route is Club Assignment;
- `Clubs Assigned` → existing Club Reveal confirmation flow;
- confirmed permanent clubs → Showdown Home / normal progression.

This prevents refresh, Continue Career, fallback routing or another module from bypassing the explicit Continue checkpoint.

---

# Regression prevention

Dedicated workflow:

`.github/workflows/validate-league-confirmation.yml`

It protects:

- removal of the old automatic advance timers;
- spin completion forbidden from calling `prepareClubAssignment()`;
- explicit Continue as the only no-club transition into Club Assignment;
- save-before-navigation ordering;
- rollback and no-navigation when the confirmation save fails;
- `League Selected` refresh/resume returning to League Wheel;
- `League Confirmed` refresh/resume entering Club Assignment;
- preservation of the existing `Clubs Assigned` reveal/confirmation state.

The Static App route matrix also distinguishes the two states so the broader navigation suite cannot regress back to `selectedLeague != null` being enough to enter Club Assignment.

The deployed shell is cache-bumped to `0.95.0-r10` so the browser does not reuse r9 `screens.js` routing code.

---

# r10 owner/browser acceptance checklist

Hard-refresh once so Chrome receives `0.95.0-r10`.

Use a disposable new Showdown and test:

1. Reach the League Wheel and press **SPIN WHEEL**.
2. Let the spin finish. The selected league should appear and the button should become **CONTINUE TO CLUB ASSIGNMENT**.
3. **Do not press anything for at least 5–10 seconds.** The application must remain on the League Wheel with no automatic transition.
4. Refresh the page before pressing Continue, then use Continue Career if needed. The same selected league must remain and the application must return to the League Wheel, still requiring Continue.
5. Press **CONTINUE TO CLUB ASSIGNMENT** once. Club Assignment should now open exactly once.
6. Verify the league cannot be rerolled or changed.
7. Before opening the club packs, use Back to return to the League Wheel. The same league should remain; pressing Continue should reopen Club Assignment without a new league selection.
8. With **Reduce Motion** enabled, repeat the spin. It may finish quickly, but it must still wait indefinitely for the explicit Continue press.
9. Check the flow on Chromebook and mobile.
10. Smoke-check Club Reveal, Showdown Home and the already accepted Season Review flow for no regression.

If any r10 defect appears, remain in stabilization, fix the actual cause, add deterministic protection, bump the deployed revision if runtime bytes change, and validate/deploy one exact final head.

---

# After r10 acceptance — Workstream 6

Workstream 6 is the final v0.95 polish/regression pass and includes the owner-requested quality-gated FIFA-era navigation transition + original micro click-feedback experiment recorded in `ROADMAP_AMENDMENTS.md`.

It must remain lightweight, central-router-safe, reduced-motion-safe and fluid on Chromebook/mobile. If the transition or sound reduces perceived quality, introduces lag/choppiness, or creates route/audio races, it is simplified or omitted rather than shipped compromised.

After Workstream 6 acceptance, move directly to **v1.0 Complete Release Candidate / Final Release**.
