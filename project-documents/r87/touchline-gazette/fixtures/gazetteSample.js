/* HO-041 Touchline Gazette sample copy for the preview frames only (Team V stand-ins, already filled in).
   The game's real copy is the gazette pack (stories, captions, quotes, briefs, ears, inside) written in the
   playground jobs (gazette/PLAYGROUND_JOBS.md); Team G fills its {placeholders} like data/frontPages.js. */
window.GazetteSample = {
  FP1: {
    issue: "Vol. I · No. 1", ears: ["Weather: floodlights on, rivalry warming", "Price: one point, no refunds"],
    story: { byline: "By the Gazette Chief Football Writer", paragraphs: [
      "Daniel has drawn first blood. Arsenal's Champions League triumph and a league title on top carried their manager to eight points, five clear of Nik after the opening season of three.",
      "Nik will not leave empty-handed. Chelsea took the domestic cup and both bonus points, a tidy haul that keeps the rivalry honest, but the big silverware all went to Arsenal's cabinet.",
      "Two seasons remain, and five points is no fortress. The console room goes quiet tonight; tomorrow, the second chapter begins."] },
    quote: { text: "Five points is a lead, not a trophy.", who: "Overheard at Chelsea" },
    numbers: [["Champions League", 5, 0], ["League title", 3, 0], ["Domestic cup", 0, 1], ["Performance", 0, 1], ["Awards", 0, 1], ["Season points", 8, 3, 1]],
    portrait: { src: "GZ_WIN_DANIEL", caption: "Daniel salutes the floodlights after Arsenal's European night." },
    photo: { src: "GZ_LEAD_SEASON", caption: "Daniel and Nik pitchside as the curtain falls on season one." },
    briefs: [{ trophy: "TRO_CONTINENTAL", head: "Europe's crown for Arsenal", text: "Daniel's side lift the Champions League, the biggest prize on the board and the backbone of a winning season." },
             { trophy: "TRO_DOMESTIC_CUP", head: "Cup joy at Chelsea", text: "Nik keeps the trophy lights on with the domestic cup and a clean sweep of both bonus points." }],
    inside: ["The trophy cabinet, shelf by shelf p.4", "Letters: is five points enough? p.9", "Console room diaries p.12"]
  },
  FP2: {
    issue: "Vol. I · No. 2", ears: ["Forecast: tension, with late drama", "Price: one point, no refunds"],
    story: { byline: "From our touchline desk", paragraphs: [
      "One point. That is all that separated the managers as Daniel edged a gripping second season five points to four, Arsenal's European run just outlasting Chelsea's double at home.",
      "Nik's league title and domestic cup made this the closest season yet, and the overall gap barely moved. The rivalry has stopped being a procession and become an argument.",
      "Season three now decides everything. Neither manager will sleep much before the final campaign."] },
    quote: { text: "One point. I will remember every one of them.", who: "Overheard at Chelsea" },
    numbers: [["Champions League", 5, 0], ["League title", 0, 3], ["Domestic cup", 0, 1], ["Performance", 0, 0], ["Awards", 0, 0], ["Season points", 5, 4, 1]],
    portrait: { src: "GZ_THINK_NIK", caption: "Nik, already plotting the final season." },
    photo: { src: "GZ_LEAD_PRESS", caption: "The two managers face the cameras after the closest season so far." },
    briefs: [{ trophy: "TRO_CONTINENTAL", head: "Arsenal rule Europe again", text: "Daniel's Champions League run proves decisive once more, worth more than any domestic prize on its own." },
             { trophy: "TRO_LEAGUE_TITLE", head: "Chelsea's double", text: "Nik answers with the league title and the cup, the best domestic season of the Showdown so far." }],
    inside: ["Rivalry table: the gap after two p.3", "The case for a final-day classic p.7", "Readers' predictions p.11"]
  },
  FP3: {
    issue: "Vol. I · No. 3", ears: ["Weather: honours even, skies clear", "Price: one point, split two ways"],
    story: { byline: "By the Gazette Chief Football Writer", paragraphs: [
      "Nobody blinked. Daniel and Nik finished the third season on five points apiece, Arsenal's domestic double and a bonus point matched exactly by Chelsea's Champions League crown.",
      "It is the first drawn season of the Showdown, and it changes nothing at the top and everything in the mood. Both managers proved they can still answer back.",
      "The final standings follow on the next page. For tonight, the honours are shared."] },
    quote: { text: "A draw? Then we go again.", who: "The managers, in agreement for once" },
    numbers: [["Champions League", 0, 5], ["League title", 3, 0], ["Domestic cup", 1, 0], ["Performance", 1, 0], ["Awards", 0, 0], ["Season points", 5, 5, 1]],
    photo: { src: "GZ_LEAD_DRAW", caption: "Daniel and Nik square up after a season that ended level." },
    briefs: [{ trophy: "TRO_LEAGUE_TITLE", head: "Arsenal's domestic double", text: "Daniel lifts the league title and the domestic cup, then adds a performance point for good measure." },
             { trophy: "TRO_CONTINENTAL", head: "Chelsea conquer Europe", text: "Nik's side win the Champions League, enough on its own to pull level on the night." }],
    inside: ["Level pegging: the maths of a draw p.5", "Who blinked first? Nobody p.8", "Console room diaries p.12"]
  },
  FW1: {
    issue: "Vol. I · Final edition", ears: ["Weather: confetti, heavy at times", "Collector's edition: one point"],
    story: { byline: "By the Gazette Chief Football Writer", paragraphs: [
      "Daniel is the Showdown champion. Three seasons, sixteen points and the trophy that matters most: Arsenal's manager finishes eight clear of Nik and takes the bragging rights home.",
      "It was built on European nights. Daniel won all three seasons and never let the lead slip, while Nik's Chelsea collected silverware every year to keep the chase alive to the end.",
      "The rematch is already being talked about. A champion is crowned; a challenger is plotting."] },
    quote: { text: "Three seasons, one trophy. Worth every late night.", who: "Overheard at Arsenal" },
    numbersTitle: "The Showdown in numbers",
    numbers: [["Season 1", 8, 3], ["Season 2", 5, 4], ["Season 3", 3, 1], ["Overall", 16, 8, 1]],
    portrait: { src: "GZ_WIN_DANIEL", caption: "Daniel, Showdown champion, on the final night." },
    photo: { src: "GZ_LEAD_FINAL", caption: "Confetti falls on Daniel and Nik as the Showdown reaches its end." },
    briefs: [{ trophy: "TRO_SHOWDOWN_CHAMPION", head: "The Showdown trophy", text: "Daniel's name goes on the trophy that outranks every cup in either cabinet." },
             { club: "Chelsea", head: "Nik's rematch pledge", text: "Chelsea's manager leaves with silverware in every season and a score to settle next time." }],
    inside: ["Champion's scrapbook: three seasons p.2", "The rematch: what changes p.6", "Letters: the final word p.10"]
  },
  FW2: {
    issue: "Vol. X · Golden edition", ears: ["Weather: gold, everywhere", "Commemorative edition, keep forever"],
    story: { byline: "Golden Showdown special", paragraphs: [
      "History. Daniel is the first manager to reach 110 points and wins the Golden Showdown, a perfect eleven in every one of ten seasons with Arsenal.",
      "Nik pushed all the way, finishing on 79 with a cabinet most managers would frame, but there was no way past a decade of maximum seasons. The gold edition was printed for moments like this.",
      "The number 110 now belongs to Daniel. Every future Showdown will be measured against it."] },
    quote: { text: "Ten seasons. Every point counted.", who: "Overheard at Arsenal" },
    numbersTitle: "The Golden Showdown",
    numbers: [["Champions Leagues", 10, 7], ["League titles", 10, 8], ["Best season", 11, 11], ["Overall", 110, 79, 1]],
    portrait: { src: "GZ_WIN_DANIEL", caption: "Daniel, first to 110." },
    photo: { src: "GZ_LEAD_GOLD", caption: "Daniel and Nik in the trophy hall on the Golden Showdown night." },
    briefs: [{ trophy: "TRO_SHOWDOWN_CHAMPION", head: "Golden Showdown won", text: "Daniel is the first manager to reach 110 points, the target that ends the Golden Showdown." },
             { trophy: "TRO_LEAGUE_TITLE", head: "Nik's decade of silver", text: "Eight league titles and seven European crowns make Chelsea's run one of the finest never to win." }],
    inside: ["Ten seasons in pictures p.2", "How 110 was reached p.5", "Nik: the case for a rematch p.9"]
  }
};
