# Home product truth

Authority: `project-documents/factory/PRODUCT_TRUTH.md` only. Product behaviour on `main` wins later at integration if it conflicts.

## Ids and routes

Home is a hub screen. The seven destinations are Continue, Start/Join, History (Legacy), Statistics, Trophy Room, Rule Book, and Settings. Continue is dominant. Rivalry Statistics is reached from Statistics and from the active Showdown.

## Buttons and strings

Show exactly those seven destinations as live controls. Keep the Audius soundtrack card; it plays the four-song Audius playlist through `home/soundtrack.js`, with track ids in `home/fixtures.json` under `strings.media`. Carry no YouTube songs and no trailer.

## Data contract

Names, scores, codes, timers, and other live values stay DOM data, never baked into imagery. The soundtrack card uses only the four Audius track ids named by Product Truth.

## Screen states and preview frames

Home is a hub surface. Continue remains the dominant action; other destinations remain reachable on phone. No private rival inputs or progress may appear.

## Mockup element decisions

KEEP: seven destinations, dominant Continue, Audius music card. DROP: YouTube music, FIFA 17 trailer, real club/league/trophy/player imagery.

## Phone

At ≤900 px use the 5-icon 56 px bottom bar plus safe area on this hub screen. All seven destinations must remain reachable; 393×660 and 360×640 have no page scroll, and the primary action is visible at 375×553.

## Open questions

None. Use the shared navigation contract from Product Truth: desktop top bar has HOME / CAREER / STANDINGS / STATS / RULES plus Settings.
