# HOME FEATURE RECOVERY AND ONLINE REINTEGRATION DIRECTIVE

Date: 2026-10-01  
Project: FIFA 17 Career Mode Showdown  
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`  
Primary audience: Claude visual/product producer, Home screen workers, Statistics workers, History/Legacy workers, Trophy Room workers, online-data/runtime workers  
Authority: Owner-directed recovery requirement

## 1. Purpose

This file formalizes recovery of important Career Mode Showdown features that still exist in the repository but are currently missing from the visible online player experience.

The missing destinations are not considered obsolete product ideas. They were hidden during the online migration because their old implementations depended on local-era analytics/history authority while Shared Showdown moved to provider-authoritative online data.

The current visual redesign must not treat that temporary containment state as the final product architecture.

The required direction is:

1. Recover the missing product destinations.
2. Reconnect them to authoritative Shared Showdown online data.
3. Make them usable again in the finished online-only product.
4. Restore appropriate Home-screen entry points.
5. Preserve the premium FIFA 17-inspired visual direction while reflecting the complete product, not the temporarily reduced r43 Home surface.

## 2. What happened

The repository history establishes the following:

### Trophy Room

On 2026-08-08, Trophy Room existed as a first-class Home destination.

On 2026-08-09, the standalone Trophy Room Home entry was consolidated beneath Career Statistics. The Trophy Room feature itself was not deleted. The current code still contains the Trophy Room implementation and the Statistics screen still contains an `OPEN TROPHY ROOM` route.

### Statistics and Legacy

Career Statistics and Legacy remained visible Home destinations after the Trophy Room consolidation.

On 2026-09-20, r43 introduced online-surface containment.

Key commit:

`dde51201e62e3a1743f3e2d10520286dc14b0fe3`  
`r43: hide retired local analytics from online surface`

That change made the online runtime hide:

`#legacyButton`  
`#careerStatisticsButton`  
`#rivalryStatisticsButton`

The purpose was to prevent old local-only analytics/history surfaces from presenting stale or empty local data beside provider-authoritative Shared Showdown data.

A later commit:

`1f545710a058ec431e2ba9cfb42b408e971624a4`  
`r43: reflow online Home after analytics containment`

reflowed the Home layout around the reduced visible tile set.

This containment was a compatibility/data-authority safety measure during online migration. It was not an owner decision that Legacy, Statistics, Trophy Room, records, history, or honours should permanently disappear from Career Mode Showdown.

## 3. Current product truth

The relevant feature code is still present.

Current `index.html` still contains Home markup for:

`LEGACY`

and

`STATISTICS`

Current `js/statistics.js` still creates:

`careerStatisticsTrophyButton`

with:

`OPEN TROPHY ROOM`

Current `js/trophyRoom.js` still contains the Trophy Room screen, manager cabinets, trophy totals, standings, and all-time records.

Therefore this is a recovery and online-reintegration task, not a greenfield replacement of features that no longer exist.

## 4. Product decision

The finished online-only Career Mode Showdown must include the following usable player-facing destinations again:

### A. Legacy / Shared History

Restore a visible Home entry for history/legacy.

Its final implementation must use authoritative Shared Showdown online history rather than stale browser-local legacy storage as the product source of truth.

Expected content includes, where supported by current online authority:

Completed Showdowns  
Season history  
Manager versus manager results  
Final Showdown outcomes  
Cumulative points  
Win, draw, and loss records  
Clubs used  
Season-level results  
Relevant transfer/history records already supported by the current product

The old Legacy screen may be reused visually or structurally where useful, but the finished player-facing destination must be backed by current online authority.

### B. Career Statistics

Restore a visible Home entry for Career Statistics.

The finished Statistics experience should derive its data from authoritative shared online history and current Shared Showdown state.

Expected content includes:

Daniel versus Nik career totals  
Showdowns completed  
Seasons played  
Career points  
Season wins and draws  
Trophy totals  
Champions League wins  
League titles  
Domestic cups  
Performance bonuses  
Awards bonuses  
100-point seasons  
100-goal seasons  
Top-scorer seasons  
Top-assist seasons  
Perfect 11-point seasons  
Best season score  
Best league points  
Best league goals  
Transfer-related career records where supported  
Manager comparisons  
Career standings and records

Do not simply unhide the old local Statistics tile if its data source is still local-only.

The correct recovery is to preserve or reuse the presentation while wiring the calculations and rendering to authoritative online Shared Showdown data.

### C. Rivalry Statistics

Restore access to current-Showdown rivalry statistics.

This destination should use the active shared Showdown's online authoritative state.

Expected content includes:

Current Showdown score  
Season-by-season progression  
Current managers  
Permanent clubs  
Current trophy totals  
Current points  
Current season record  
Current rivalry totals  
Current transfer/signing information where supported

### D. Trophy Room / Honours

Restore Trophy Room as a usable player-facing feature.

The final information architecture can be chosen during Home design, but Trophy Room must not remain effectively inaccessible.

It may be:

1. A dedicated Home tile, or
2. A major Honours/Trophy destination reached from the Statistics tile,

provided that it is prominent, intentional, easy to discover, and not buried as a leftover developer route.

The Trophy Room should use authoritative online history and show, where supported:

Manager trophy cabinets  
Champions League totals  
League title totals  
Domestic cup totals  
Total trophies  
Manager standings  
Career points  
Season wins  
Perfect seasons  
100-point seasons  
100-goal seasons  
All-time records  
Career leaders  
Biggest Showdown win  
Highest season score  
Highest league points  
Highest league goals

The existing Trophy Room code can be used as a reference or migration source, but its final data authority must be online/shared.

## 5. Home-screen requirement

Home is currently being visually redesigned. That redesign must be updated immediately so it no longer treats the temporary r43 reduced surface as the final Home information architecture.

The final Home design must account for the recovered destinations.

At minimum, the Home product architecture must visibly represent:

Continue Career  
Start / Join Showdown  
Legacy / History  
Statistics  
Trophy Room / Honours, either dedicated or intentionally nested under Statistics  
Rule Book  
Settings

The exact tile geometry, hierarchy, sizing, visual weight, and responsive composition remain open to the visual producer, but these product capabilities must be represented.

The Home screen should still follow the approved FIFA 17-inspired tile language. Rectangular and geometric tile forms are appropriate for Home.

Do not apply the Transfer War Room's “avoid basic boxes” constraint globally to Home. Home is intentionally a menu/tile interface.

## 6. Online-data authority requirement

This is the most important implementation constraint.

Do not restore these features by merely removing the `display:none` rules.

The old controls were hidden because they could expose local-era data that no longer matched the online Shared Showdown authority.

The recovery must therefore include an authority migration.

Each recovered destination must answer:

1. What is its canonical online data source?
2. How is shared history reconstructed?
3. How are accepted/committed seasons identified?
4. How are Daniel and Nik identities resolved?
5. How are permanent clubs resolved?
6. How are trophies calculated from canonical scoring?
7. How are cumulative records rebuilt after reload or a new private session?
8. How are incomplete/unpublished seasons excluded?
9. How is stale local state prevented from contaminating online totals?
10. How does the screen behave when no history exists yet?

Shared provider authority must outrank old browser-local analytics data for the finished online product.

Local code may still be used for presentation helpers, calculations, caching, or migration support where safe, but not as an independent competing source of product truth.

## 7. Data model and calculation preservation

Do not simplify away existing scoring and record semantics during recovery.

Preserve the established Career Mode Showdown scoring model and trophy semantics.

The current shared scoring/history system already reconstructs authoritative season results and cumulative Showdown history. The recovered Statistics, Legacy, and Trophy Room features should consume that authority rather than invent a parallel analytics model.

Prefer one shared derived analytics layer that can serve:

Home summary  
Legacy / History  
Career Statistics  
Rivalry Statistics  
Trophy Room / Honours  
Manager records  
Season records

This reduces drift between screens and prevents the same trophy or record from being calculated differently in different destinations.

## 8. Visual project instruction

Claude should immediately propagate this recovery requirement to every worker touching:

Home  
Navigation  
Statistics  
History / Legacy  
Trophy Room  
Season Summary  
Shared History  
Manager Records  
Online data adapters  
Responsive Home layouts

Any current Home proposal that omits Legacy, Statistics, and Trophy/Honours because they are absent from the present production UI must be treated as incomplete.

The current production UI is not the full product specification in this area.

For these destinations, repository history and this owner directive supersede the temporary r43 containment layout as the intended final product direction.

## 9. Home visual hierarchy guidance

The visual producer should explore a hierarchy that feels like a real FIFA 17 Career hub rather than a utility dashboard.

Recommended conceptual hierarchy:

Primary:
Continue Career

Secondary primary:
Start / Join Showdown

Persistent career destinations:
Legacy / History
Statistics
Trophy Room / Honours

Support:
Rule Book
Settings

The visual producer may combine Statistics and Trophy Room into a larger Honours/Data family if that creates a stronger Home composition, but Trophy Room must remain a clearly discoverable destination.

Legacy should not be relegated to hidden Settings or an advanced/developer panel.

Statistics should not be treated as internal diagnostics.

Trophy Room should feel like a reward destination, not a technical analytics subpage.

## 10. Mobile requirement

Recovery must be designed for both Chromebook/desktop and iPhone/mobile.

Do not create a desktop-only Home restoration.

On mobile:

All recovered destinations must remain discoverable.  
Tile hierarchy may stack or recompose.  
No essential destination may disappear because of breakpoint simplification.  
Trophy Room/Honours must remain reachable without hidden developer controls.  
History and Statistics must be reachable through normal player navigation.

## 11. Compatibility and migration requirement

The old local Analytics, Legacy, and Trophy Room code should not be deleted during recovery until the online replacements or adapters are proven.

Recommended approach:

1. Identify the existing rendering and calculation code that can safely be retained.
2. Separate presentation from local-storage assumptions.
3. Add an online/shared analytics adapter or derived shared-history model.
4. Feed that model into the restored screens.
5. Verify parity of scoring/trophy/record calculations.
6. Restore Home navigation.
7. Remove or retire only the local-only authority paths that are no longer needed after online proof.

Avoid a large rewrite when existing proven rendering/calculation code can be safely reused.

## 12. Acceptance criteria

This recovery is not complete until all of the following are true:

1. Legacy / History is visible and usable from normal player navigation.
2. Career Statistics is visible and usable from normal player navigation.
3. Rivalry Statistics is available where appropriate.
4. Trophy Room / Honours is visible and usable.
5. Home visually includes or clearly routes to these recovered destinations.
6. The recovered destinations use authoritative Shared Showdown online data.
7. Refreshing the browser does not lose or corrupt authoritative history.
8. A new valid private session can reconstruct prior shared career data where the online architecture supports it.
9. Daniel and Nik see consistent totals for the same Shared Showdown history.
10. Trophy totals match canonical season scoring.
11. Completed seasons are included exactly once.
12. Incomplete or unpublished seasons do not contaminate records.
13. Old local-only data cannot override shared online truth.
14. Empty-state behavior is clear for a new career.
15. Desktop and mobile navigation both expose the recovered destinations.
16. Existing shared online gameplay remains unaffected.
17. No Firebase billing requirement is introduced.
18. Firebase Spark-only constraints remain respected.
19. No public discovery, community rankings, or unrelated multiplayer scope is introduced.
20. The visual implementation remains consistent with the approved FIFA 17-inspired Home direction.

## 13. Non-goals

This recovery does not authorize:

Public rankings  
Community discovery  
Public profiles  
Global leaderboards  
Matchmaking  
A return to offline-first product architecture  
Reintroducing obsolete local Save Library UI as a primary player workflow  
Changing scoring rules  
Changing Daniel/Nik role identity  
Changing permanent-club rules  
Changing season-count rules  
Changing the private Shared Showdown architecture

This task is specifically about restoring missing career/history/statistics/honours functionality to the online product and making it visible and usable again.

## 14. Required Claude action

Claude should treat this as a product-recovery directive and update the visual/product workflow accordingly.

Claude should:

1. Acknowledge that r43 containment was temporary online-authority protection, not the final Home product specification.
2. Update the Home brief so Legacy, Statistics, and Trophy/Honours are represented.
3. Notify all Home and related-screen workers that these destinations are required.
4. Coordinate with the runtime/data implementation work so the restored screens use shared online authority.
5. Prevent visual workers from designing around the mistaken assumption that the current four-tile online Home is the complete product.
6. Preserve existing useful screen implementations where possible.
7. Produce an implementation plan that separates visual restoration from data-authority rewiring.
8. Flag any recovered screen that still depends on local-only data before it is exposed to players.
9. Keep the restored screens isolated from `main` until the visual/project approval rules permit promotion.
10. Return any proposed adjustment to this recovery architecture to the owner before permanently removing or collapsing one of these destinations.

## 15. Owner intent

The intended finished product is not merely an online match/session launcher.

It is a two-manager Career Mode rivalry product with persistent career identity, history, statistics, trophies, records, and season progression.

Those systems are part of the reason the product feels like a Career Mode experience rather than a sequence of disconnected online forms.

Legacy, Statistics, and Trophy Room should therefore return as first-class parts of the finished online experience.

The recovery should preserve the strongest existing work, replace obsolete local authority with shared online authority, and make the full career ecosystem visible again from Home.
