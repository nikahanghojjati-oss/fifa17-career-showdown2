# Brush title wordmarks (job 124)

All five were generated in Temporary Chats from the Trophy Room title style (try 1 each, spelling checked letter by letter). Claude keyed the black to alpha and trimmed them. WebP files are 1200-1400 px wide and up to 120 KB; PNG masters are about 2100 px wide. Raw files are in raw/.
The Club and VS titles (step 1: crops from the goal images) are not made yet. The builds that need them use a TODO-WORDMARK title until a fix round adds them.
TITLE_LEAGUE_V1 (job 1030) is not generated: it is cropped from Nik's own goal image `league/assets/REF_GOAL_LEAGUE.jpg` (615x122 crop at x455 y110, kept in `raw/TITLE_LEAGUE_RAW_crop_1x.png`), enlarged 4x, keyed on gold (R-B) with a connected-component filter that drops the lamps, kicker and subtitle lines, with letter colour bled outward so edges carry no stadium colour, and a soft black shadow rebuilt from the letter alpha (so no stadium pixels). PNG master 2332x456, WebP 1400x274 q85. Scripts: `raw/TITLE_LEAGUE_key.py` and `raw/TITLE_LEAGUE_compose.py`. Letters occupy x 474-1044 and y 121-222 of the 1536x864 goal; the image box is x 470-1053, y 118-232.

| Words | File | Source | WebP sha256 |
| --- | --- | --- | --- |
| TRANSFER WAR | TITLE_TRANSFER_V1 | generated (ticket 124-TITLE_TRANSFER) | 692130a00695e41554036cd20061adcb9e1cf51c9384eda1ec108dfa86b8263d |
| SHOWDOWN CHAMPION | TITLE_FINAL_WINNER_V1 | generated (ticket 124-TITLE_FINAL_WINNER) | c200cad34fccb43d27492037e8a56fb754f30dfee216ac605ae7e5771ba77b71 |
| RULE BOOK | TITLE_RULE_BOOK_V1 | generated (ticket 124-TITLE_RULE_BOOK) | 5624230fbfa10a80a144a730970de12a7510c5f9e71c53f2e59e315eed57daad |
| SETTINGS | TITLE_SETTINGS_V1 | generated (ticket 124-TITLE_SETTINGS) | c4ad45bc0e39c2c38f3257a47e41e1bff657f672a4345a45cf1fb7ed9481dd44 |
| STANDINGS | TITLE_STANDINGS_V1 | generated (ticket 124-TITLE_STANDINGS) | adbf6ee3214a535b2d96cd12bd40110178ecae0e01cf53cd5eb17dde646e3807 |
| LEAGUE | TITLE_LEAGUE_V1 | cropped from goal image (job 1030) | a35299752e9d3cfcc44b21ff882ac7fdd81b727af78002c5ce5d76459b29e322 |
