# R44 Screen and Surface Alignment Matrix

Base authority: `47cbfbaba083e1eb35c06d687cceceb799e34920`
Runtime: `1.9.1-r44`
Date: 2026-09-22

## 1. Current route authority

`js/screens.js` currently owns 13 routed screens:

1. `mainMenu`
2. `createShowdown`
3. `leagueWheelScreen`
4. `clubWheelScreen`
5. `dashboard`
6. `transferChallenge`
7. `seasonEntry`
8. `seasonSummary`
9. `statistics`
10. `careerStatistics`
11. `trophyRoom`
12. `legacy`
13. `ruleBook`

Settings is not a routed screen; it is an overlay/dialog. Online identity, Shared Setup, Shared Career Start, reconnect/reconciliation and restore surfaces are also runtime-owned overlays/panels rather than independent routes.

## 2. Required football-visual authority

Current `js/screens.js` requires the football-visual runtime for every routed screen except `mainMenu` and `statistics`.

Current `data/footballVisuals.js` has plans for:

- Create Showdown — James
- League Wheel — Ronaldo
- Club Assignment — Pogba
- Dashboard — Zlatan
- Transfer Challenge — Rashford + Martial
- Season Entry — Griezmann
- Season Summary — Neymar
- Career Statistics — Messi
- Trophy Room — Lahm
- Legacy — Falcao
- Rule Book — Balotelli

Important alignment consequence: the old R8 visual package is not the only visual source anymore. Current licensed football-photo mounting, crop safety, credits, lazy route loading and `footballVisuals-v113.css` are production contracts that R9 must either preserve or intentionally replace with equivalent rights-safe production behavior.

## 3. Screen-by-screen R9 disposition

| Route / surface | Current live owners | Important current runtime additions | R9 disposition | Risk |
| --- | --- | --- | --- | --- |
| Startup / header | `index.html`, `app.css`, `menuExperience.js`, online identity | startup athlete, status, online identity badge, current season indicator | REALIGN | medium |
| `mainMenu` | static DOM, menu experience, online identity, optional modules | online product hides internal Legacy/Statistics surfaces in normal mode; New tile changes Start/Join copy by Daniel/Nik identity; soundtrack tile remains | REBUILD CONTRACT | high |
| `createShowdown` | static DOM + online identity + Shared Journey Entry | manager fields are hidden/fixed Daniel/Nik; season count remains; pair/entry state can inject notes/panels; Daniel starts and Nik joins | REBUILD CONTRACT | high |
| `leagueWheelScreen` | league wheel + Shared Showdown Presentation | host/provider owns authoritative spin; peer waiting/auto-refresh; `sharedShowdownPresentationStatus`; witnessed state; no local random authority in Shared mode | REBUILD CONTRACT | high |
| `clubWheelScreen` | club assignment + Shared Showdown Presentation | authoritative two-pack reveal, witness requirement, Back hidden during shared flow, season plan recovered/locked, dynamic `sharedShowdownSeasonChoice`, each manager confirms | REBUILD CONTRACT | very high |
| `dashboard` | showdown UI + optional modules + Shared Transfer + multi-season + reconnect | runtime stats button shell, completed hub, integrity/status nodes, shared Transfer primary action, multi-season return, reconnect state | REALIGN / EXPAND | very high |
| `transferChallenge` | local Transfer DOM enhancer + Shared Transfer adapter/provider + Shared Season Results Route | four provider phases, historical replay, role-private guess/signing data, shared refresh/recovery, Season Results owns completed continuation | ACTIVE SLICE | very high |
| `seasonEntry` | season engine + Shared Season Results + commit + scoring + history + progression + reconciliation + terminal close | dynamic review panel, role-private entry, publish/review/commit, canonical scoring, history convergence, multi-season continue, final reconciliation, terminal close | FULL REBUILD CONTRACT | critical |
| `seasonSummary` | season engine + current route/history state | local/historical result shell still routed; shared progression increasingly happens through Season Results/Dashboard authority | REALIGN ROLE | high |
| `statistics` | dynamic `statistics.js` | rivalry-only route; intentionally excluded from required football-photo plan | REALIGN | medium |
| `careerStatistics` | dynamic `statistics.js` + analytics CSS + football visual | career data, manager comparison, trophy-room navigation, identity-safe analytics | REALIGN | medium |
| `trophyRoom` | dynamic `trophyRoom.js` + analytics CSS + football visual | manager cabinets/records from current data authority | REALIGN | medium |
| `legacy` | legacy renderer + restore UI + restore/backup/import engines + football visual | restore panel, import analysis, corrupt/unavailable/recovery/destructive states | REBUILD CONTRACT | high |
| `ruleBook` | dynamic `ruleBook.js` + rulebook CSS + football visual | current scoring text must match canonical scoring implementation | REALIGN CONTENT + VISUAL | medium |
| Settings overlay | `settings.js` + online identity + settings CSS | connected-account/player/device panel; internal audit/data panels hidden in normal online product; Forget Device / reconnect states | NEW R9 SURFACE | high |
| Online identity overlay | `onlinePlayerIdentity.js` | sign-in, choose Daniel/Nik, offline, device error, retry; inline presentation currently outside R8 screen system | NEW R9 SURFACE | high |
| Shared setup / career-start overlays | Shared Journey Entry, Shared Showdown Presentation, Shared Career Start | pairing/session readiness, continue gates, provider-backed setup/career acknowledgement | NEW R9 SURFACE | very high |
| Global reconnect state | `productionSharedJourneyReconnect.js` | `sharedJourneyReconnectStatus`, `sharedJourneyReconnectAction`, recovery phase / authoritative state | NEW R9 SURFACE | very high |
| Shared reconciliation panels | canonical scoring/history/final/terminal modules | provider-authoritative comparison and terminal completion panels layered into Season Results | NEW R9 SURFACE FAMILY | critical |

## 4. Specific R8 drift found

### Home

The older R8 Home document correctly required a final-main reconciliation, but current product presentation now changes Home based on connected identity. In normal online product mode, internal Legacy/Statistics entry surfaces can be hidden by `onlinePlayerIdentity.js`, and the New tile becomes either Start or Join depending on Daniel/Nik identity. A static six-tile screenshot is no longer sufficient authority.

### Create Showdown

The older R8 proposal assumed visible two-manager identity fields as equal hierarchy. Current r44 explicitly hides those fields and fixes Daniel = Player One and Nik = Player Two. The visible task is now mainly season count plus online Shared Showdown entry. This screen needs a new composition, not a direct R8 port.

### League Wheel

The old visual direction can still inform geometry, but Shared mode now has provider-owned host/peer states, authoritative reveal, witness state and automatic peer refresh. Any visual must support WAITING FOR HOST, locked authoritative league, continue-to-packs, recovery and busy states without creating local wheel authority.

### Club Assignment

This is substantially more complex than the old static pack-reveal concept. Current r44 adds a provider-owned setup progression and a dynamic season-plan panel after both authoritative packs are witnessed. It can also block on season-plan mismatch/recovery and requires each manager to confirm independently. The old pack visuals can remain reference only; layout must be rebuilt around these live states.

### Dashboard

The Dashboard is now the shared-rivalry orientation point. Transfer, multi-season return, reconnect, completed-showdown state and runtime-generated actions compete for priority. R9 must establish a clear state/action hierarchy before decorative work.

### Transfer Challenge

Handled separately by draft PR #298. The current alignment is provider-first and must remain independent until accepted.

### Season Results

This is the largest drift area. The current route contains both entry and a dynamically created review/authority stack. It is no longer just two forms followed by a summary. R9 must treat it as a staged workflow and preserve private-role visibility until authority allows reveal.

### Legacy and Settings

Legacy now carries restore/recovery responsibilities. Settings now carries the product-facing connected account/player/device surface. These need to be designed as real operational product UI, not secondary decorative pages.

## 5. DOM / authority rules for every R9 screen

1. Use the current real DOM and runtime-created nodes.
2. Never replace an existing action with a visually identical duplicate.
3. Never move provider state into CSS or proposal-only JavaScript.
4. Preserve `showScreen` / `navigateTo` route ownership.
5. Preserve lazy module loading.
6. Preserve current football-photo licensing/credit behavior unless a slice explicitly replaces it with rights-safe assets.
7. Treat runtime-injected nodes as first-class layout children.
8. Text such as waiting, locked, recovery, conflict, replay and confirmation must be visible real DOM text.
9. Mobile/Chromebook geometry is part of acceptance, not a later cleanup.
10. Shared/public information must never visually imply presence or private data that the provider has not exposed.
11. R9 visual code must remain compatible with reduced motion.
12. Firebase Spark / zero-billing constraints remain unchanged.

## 6. Current conclusion

Yes: every routed screen should be revalidated against r44 before visual implementation.

That does not mean every screen needs a ground-up aesthetic replacement. The current severity is:

- full current-contract rebuild: Home, Create Showdown, League, Club, Season Results, Legacy
- high-impact realignment: Dashboard, Transfer, Season Summary
- moderate realignment: Rivalry Statistics, Career Statistics, Trophy Room, Rule Book
- new R9 cross-screen surfaces: Settings, Online Identity, Shared Setup/Career Start, Reconnect/Reconciliation
