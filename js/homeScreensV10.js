(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeHomeScreensV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-25 (G-13 part 2b): Team V's Home (factory/v1-wtt5ye 5e05a1f) drawn around the app's own #mainMenu, plus
  // Nik's Audius playlist (home/soundtrack.js). Skin, don't rewire: every product button keeps its node, id, text
  // and listeners. This file only adds art, wrappers and classes; css/homeV10.css maps Team V's layout onto the
  // real DOM. Loading stays the app's startup splash (it shows before any lazy code can load).
  const BASE="visual-assets/v10_1/";
  const FRAME=Object.freeze({skin:"team-v-home-5e05a1f"});
  const STORY_FRAME=Object.freeze({skin:"story-r88"});
  // Nik's locked Audius top 10, in his order (owner request 2026-10-10, JOB-1591; ids resolved on api.audius.co 2026-10-11;
  // owner swap 2026-10-12: In Da Club (San Holo Remix) replaces Tabestoon Kootahe, Fresh replaces Dideh o Del).
  // Never swap, drop or add a song without Nik's words; an unplayable id shows the stream error and plays nothing else.
  // r87 (Nik 2026-11-01): Home has no music strip; the player is the phone MUSIC tab and the desktop top-bar dock.
  const MEDIA=Object.freeze({
    // Owner request 2026-10-27 (FIFA/PES handoff): Song 2 opens the game, Love Me Again second, the other new picks next with
    // the two Sweet Disposition versions apart, then the earlier ten in their order. Ids resolved on api.audius.co 2026-10-27.
    tracks:Object.freeze([
      Object.freeze({key:"song2",title:"SONG 2",artist:"Blur",audiusTrackId:"6R99GRQ"}),
      Object.freeze({key:"loveMeAgain",title:"LOVE ME AGAIN",artist:"John Newman",audiusTrackId:"GNQJ5dl"}),
      Object.freeze({key:"kids",title:"KIDS (TUNA MELT REMIX)",artist:"MGMT",audiusTrackId:"5xdlPEJ"}),
      Object.freeze({key:"sweetDispositionTeo",title:"SWEET DISPOSITION",artist:"The Temper Trap",audiusTrackId:"K9J0w8l"}),
      Object.freeze({key:"alive",title:"ALIVE",artist:"Empire of the Sun",audiusTrackId:"Nvydpr7"}),
      Object.freeze({key:"theNights",title:"THE NIGHTS (MASHUP)",artist:"Avicii",audiusTrackId:"WGNNo"}),
      Object.freeze({key:"aiSeEuTePego",title:"AI SE EU TE PEGO",artist:"Michel Teló",audiusTrackId:"PQ28va7"}),
      Object.freeze({key:"shelter",title:"SHELTER (TRANTIC REMIX)",artist:"Porter Robinson & Madeon",audiusTrackId:"3mjjB"}),
      Object.freeze({key:"sweetDispositionBlazy",title:"SWEET DISPOSITION (REMIX)",artist:"The Temper Trap",audiusTrackId:"y7Z9P"}),
      Object.freeze({key:"business",title:"BUSINESS",artist:"Behzad Leito ft. Sepehr Khalse, Saman Wilson, Sohrab MJ & Alireza JJ",audiusTrackId:"Ymgov"}),
      Object.freeze({key:"inDaClub",title:"IN DA CLUB (SAN HOLO REMIX)",artist:"50 Cent & San Holo",audiusTrackId:"qZ17b"}),
      Object.freeze({key:"sarnevesht",title:"SARNEVESHT",artist:"Gdaal & Imanemun ft. Erfan & Madgal",audiusTrackId:"gb33l"}),
      Object.freeze({key:"nextToYou",title:"NEXT TO YOU",artist:"RAC ft. Emerson Leif",audiusTrackId:"n1zqQ"}),
      Object.freeze({key:"hateItOrLoveIt",title:"HATE IT OR LOVE IT (JERSEY CLUB)",artist:"MIKE GIP",audiusTrackId:"ygyOr"}),
      Object.freeze({key:"banafsh",title:"BANAFSH",artist:"Gdaal ft. Madgal",audiusTrackId:"3RaaM"}),
      Object.freeze({key:"fresh",title:"FRESH",artist:"Sijal ft. Sepehr Khalse, Behzad Leito & Mehrad Hidden",audiusTrackId:"AV9dv"}),
      Object.freeze({key:"yakuza",title:"YAKUZA",artist:"Sepehr Khalse",audiusTrackId:"ryBXG"}),
      Object.freeze({key:"nasty",title:"NASTY",artist:"grouptherapy.",audiusTrackId:"G5rXAWE"}),
      Object.freeze({key:"cheraBadi",title:"CHERA BADI",artist:"Zedbazi ft. Hichkas",audiusTrackId:"0dGWK"})
    ]),
    defaultTrack:"song2",
    audius:Object.freeze({apiBase:"https://api.audius.co/v1",appName:"CareerModeShowdown17"})
  });
  // r90 W9 (LOOK hunt L12, Nik 2026-11-08 "no AI look", then "the icons need to look more advanced, not so simple"): every
  // tile carries one struck-medal icon set drawn here, gold in low relief on the black marble: one warm key light from the top
  // left, a chamfered rim, a cast edge and engraved detail, no glow and no gloss. CONTINUE shows a black number-17 shirt with
  // gold trim and the 17 cut from the app's own Barlow Condensed numerals. No picture is fetched for a tile.
  // Each icon is a list of layers [kind, tone, shapes]: "face" is raised metal, "cut" is engraved into the layer under it,
  // "shade" darkens the facets that turn away from the light. Stroked shapes use currentColor so one shape list serves as
  // fill, mask and shadow.
  // r90 W8 (right-sized pictures): the Home pictures still in use come as half-size copies (*_<width>W.webp, same art).
  const WORDMARK_SIZES="(max-width: 900px) 330px, 31vw";
  const ICON_ART=Object.freeze({
    // a number-17 shirt seen from the back, gold trim and numbers (CONTINUE CAREER)
    continue:[["face","ink",'<path d="M18.2 6.6C20.5 7.8 27.5 7.8 29.8 6.6L37.6 9.6C39.2 10.2 40.3 11.2 41 12.6L44.6 20.2 38.6 23.4 35.4 17.8V40.2C35.4 41.2 34.7 41.8 33.8 41.9 27.3 42.6 20.7 42.6 14.2 41.9 13.3 41.8 12.6 41.2 12.6 40.2V17.8L9.4 23.4 3.4 20.2 7 12.6C7.7 11.2 8.8 10.2 10.4 9.6Z"/>'],["cut","ink",'<path d="M17.4 7C16.4 11.5 14.8 15.4 12.6 17.8M30.6 7C31.6 11.5 33.2 15.4 35.4 17.8M13 39.1C20.3 39.9 27.7 39.9 35 39.1" fill="none" stroke="currentColor" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M18.5 7.75C20.8 8.95 27.2 8.95 29.5 7.75M4.4 19.27 9.52 21.99M43.6 19.27 38.48 21.99" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.56 16.6H21.7Q21.8 16.6 21.88 16.68Q21.96 16.75 21.96 16.86V31.39Q21.96 31.5 21.88 31.57Q21.8 31.65 21.7 31.65H18.64Q18.54 31.65 18.46 31.57Q18.39 31.5 18.39 31.39V20.06Q18.39 19.95 18.28 19.95L16.69 20.04Q16.43 20.04 16.43 19.8L16.39 17.52Q16.39 17.31 16.6 17.24L18.24 16.66Q18.41 16.6 18.56 16.6Z"/><path d="M24.35 31.35 27.81 19.78Q27.85 19.65 27.72 19.65H25.89Q25.79 19.65 25.79 19.76V20.49Q25.79 20.6 25.71 20.67Q25.64 20.75 25.53 20.75H23.16Q23.06 20.75 22.98 20.67Q22.91 20.6 22.91 20.49L22.93 16.86Q22.93 16.75 23 16.68Q23.08 16.6 23.18 16.6H31.35Q31.46 16.6 31.54 16.68Q31.61 16.75 31.61 16.86V19.5Q31.61 19.59 31.57 19.8L28.07 31.43Q28 31.65 27.79 31.65H24.56Q24.43 31.65 24.37 31.56Q24.3 31.48 24.35 31.35Z"/>']],
    // a tactics board with its clip and three players (the new-Showdown tile)
    newShowdown:[["face","gold",'<path d="M11.6 7.6H36.4A2.6 2.6 0 0 1 39 10.2V39.4A2.6 2.6 0 0 1 36.4 42H11.6A2.6 2.6 0 0 1 9 39.4V10.2A2.6 2.6 0 0 1 11.6 7.6Z"/>'],["cut","gold",'<path d="M13.4 13.4H34.6V38.6H13.4ZM13.4 26H34.6M19.2 13.4V17.6H28.8V13.4M19.2 38.6V34.4H28.8V38.6" fill="none" stroke="currentColor" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="26" r="3.6" fill="none" stroke="currentColor" stroke-width=".8"/><path d="M18.6 22.8C19.3 26.6 20.8 29 22.2 30.2" fill="none" stroke="currentColor" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1.3 1.1"/>'],["face","gold",'<path d="M18.4 10.2V7.4A1.6 1.6 0 0 1 20 5.8H21.7A2.3 2.3 0 0 1 26.3 5.8H28A1.6 1.6 0 0 1 29.6 7.4V10.2Z"/><circle cx="18.6" cy="20.4" r="1.8"/><circle cx="29.4" cy="20.4" r="1.8"/><circle cx="24" cy="31.8" r="1.8"/>']],
    // a laurel wreath round a faceted star, tied at the foot (LEGACY)
    legacyButton:[["face","gold",'<path d="M26.36 36.99L28.65 36.38 30.8 35.38 32.74 34.02 34.42 32.34 35.78 30.4 36.78 28.25 37.39 25.96 37.6 23.6 37.39 21.24 36.78 18.95 35.78 16.8 34.42 14.86 32.74 13.18 30.8 11.82M21.64 36.99L19.35 36.38 17.2 35.38 15.26 34.02 13.58 32.34 12.22 30.4 11.22 28.25 10.61 25.96 10.4 23.6 10.61 21.24 11.22 18.95 12.22 16.8 13.58 14.86 15.26 13.18 17.2 11.82" fill="none" stroke="currentColor" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/><path d="M29.09 36.21C28.67 33.81 30.12 31.53 32.32 31.15C32.9 33.3 31.45 35.58 29.09 36.21ZM29.09 36.21C31.23 35.03 33.86 35.66 34.93 37.61C33.08 38.87 30.46 38.23 29.09 36.21ZM33.45 33.38C32.15 31.31 32.64 28.66 34.54 27.48C35.89 29.26 35.4 31.91 33.45 33.38ZM33.45 33.38C34.98 31.49 37.65 31.09 39.38 32.5C38.14 34.35 35.47 34.75 33.45 33.38ZM36.42 29.13C34.45 27.7 33.91 25.05 35.23 23.25C37.14 24.39 37.68 27.04 36.42 29.13ZM36.42 29.13C37.14 26.8 39.47 25.43 41.6 26.09C41.14 28.27 38.81 29.64 36.42 29.13ZM37.59 24.07C35.22 23.49 33.73 21.23 34.28 19.07C36.48 19.41 37.97 21.66 37.59 24.07ZM37.59 24.07C37.38 21.64 39.02 19.5 41.25 19.32C41.64 21.51 40 23.65 37.59 24.07ZM36.78 18.95C34.36 19.29 32.14 17.76 31.83 15.55C34 15.04 36.23 16.57 36.78 18.95ZM36.78 18.95C35.67 16.77 36.39 14.17 38.39 13.17C39.57 15.05 38.85 17.66 36.78 18.95ZM34.11 14.5C31.99 15.72 29.36 15.14 28.25 13.2C30.07 11.92 32.71 12.5 34.11 14.5ZM34.11 14.5C32.26 12.9 31.96 10.21 33.43 8.54C35.24 9.84 35.54 12.53 34.11 14.5ZM30.8 11.82C28.36 12.32 25.95 10.93 25.43 8.72C27.6 8.07 30.01 9.46 30.8 11.82ZM18.91 36.21C16.55 35.58 15.1 33.3 15.68 31.15C17.88 31.53 19.33 33.81 18.91 36.21ZM18.91 36.21C17.54 38.23 14.92 38.87 13.07 37.61C14.14 35.66 16.77 35.03 18.91 36.21ZM14.55 33.38C12.6 31.91 12.11 29.26 13.46 27.48C15.36 28.66 15.85 31.31 14.55 33.38ZM14.55 33.38C12.53 34.75 9.86 34.35 8.62 32.5C10.35 31.09 13.02 31.49 14.55 33.38ZM11.58 29.13C10.32 27.04 10.86 24.39 12.77 23.25C14.09 25.05 13.55 27.7 11.58 29.13ZM11.58 29.13C9.19 29.64 6.86 28.27 6.4 26.09C8.53 25.43 10.86 26.8 11.58 29.13ZM10.41 24.07C10.03 21.66 11.52 19.41 13.72 19.07C14.27 21.23 12.78 23.49 10.41 24.07ZM10.41 24.07C8 23.65 6.36 21.51 6.75 19.32C8.98 19.5 10.62 21.64 10.41 24.07ZM11.22 18.95C11.77 16.57 14 15.04 16.17 15.55C15.86 17.76 13.64 19.29 11.22 18.95ZM11.22 18.95C9.15 17.66 8.43 15.05 9.61 13.17C11.61 14.17 12.33 16.77 11.22 18.95ZM13.89 14.5C15.29 12.5 17.93 11.92 19.75 13.2C18.64 15.14 16.01 15.72 13.89 14.5ZM13.89 14.5C12.46 12.53 12.76 9.84 14.57 8.54C16.04 10.21 15.74 12.9 13.89 14.5ZM17.2 11.82C17.99 9.46 20.4 8.07 22.57 8.72C22.05 10.93 19.64 12.32 17.2 11.82Z"/>'],["cut","gold",'<path d="M29.67 35.3L31.61 32.26M30.14 36.46L33.64 37.3M33.64 32.32L34.3 28.78M34.52 33.22L38.08 32.69M36.21 28.07L35.49 24.55M37.36 28.58L40.46 26.76M37 23.17L35.01 20.17M38.25 23.22L40.44 20.36M35.89 18.34L32.92 16.3M37.07 17.91L38.03 14.44M33.05 14.27L29.54 13.49M33.98 13.43L33.58 9.85M29.83 11.26L26.61 9.4M18.33 35.3L16.39 32.26M17.86 36.46L14.36 37.3M14.36 32.32L13.7 28.78M13.48 33.22L9.92 32.69M11.79 28.07L12.51 24.55M10.64 28.58L7.54 26.76M11 23.17L12.99 20.17M9.75 23.22L7.56 20.36M12.11 18.34L15.08 16.3M10.93 17.91L9.97 14.44M14.95 14.27L18.46 13.49M14.02 13.43L14.42 9.85M18.17 11.26L21.39 9.4" fill="none" stroke="currentColor" stroke-width=".42" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M24 12.8L26.12 18.49L32.18 18.74L27.42 22.51L29.05 28.36L24 25L18.95 28.36L20.58 22.51L15.82 18.74L21.88 18.49Z"/><path d="M20.4 38.6 24 37.1 27.6 38.6 26.5 41 24 39.9 21.5 41Z"/>'],["shade","",'<path d="M24 21.4L26.12 18.49L32.18 18.74ZM24 21.4L32.18 18.74L27.42 22.51ZM24 21.4L27.42 22.51L29.05 28.36ZM24 21.4L29.05 28.36L24 25ZM24 21.4L24 25L18.95 28.36Z"/>']],
    // fluted bars on a plinth under a rising arrow (STATISTICS)
    careerStatisticsButton:[["face","gold",'<path d="M7.4 37.6H40.6A1.2 1.2 0 0 1 41.8 38.8V40.8A1.2 1.2 0 0 1 40.6 42H7.4A1.2 1.2 0 0 1 6.2 40.8V38.8A1.2 1.2 0 0 1 7.4 37.6Z"/><path d="M10 29.6H15.6V36.6H10ZM18.4 24.6H24V36.6H18.4ZM26.8 27.2H32.4V36.6H26.8ZM35.2 18.8H40.8V36.6H35.2Z"/>'],["cut","gold",'<path d="M12.8 31.2V35M21.2 26.2V35M29.6 28.8V35M38 20.4V35M8 39.8H40" fill="none" stroke="currentColor" stroke-width=".55" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M9.8 22.8 18.6 15.8 25.8 19.4 34.6 11.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M38.8 8.2 37.8 15.6 31.4 9.2Z"/>']],
    // a cup with a starred bowl on a plinth (TROPHY ROOM)
    homeTrophyRoomButton:[["face","gold",'<path d="M15.4 10.6H12.4C10.2 10.6 8.8 12.3 9.2 14.5 9.8 17.7 12.4 19.7 16.2 20.1M32.6 10.6H35.6C37.8 10.6 39.2 12.3 38.8 14.5 38.2 17.7 35.6 19.7 31.8 20.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.6 8.4H33.4V11.6C33.4 18.4 29.6 22.6 24 22.6 18.4 22.6 14.6 18.4 14.6 11.6ZM22.2 22.2H25.8V27.4H22.2ZM20.4 27H27.6V29.4H20.4ZM18.6 29.6H29.4L30.8 34.8H17.2ZM14.8 35.4H33.2A1 1 0 0 1 34.2 36.4V41A1 1 0 0 1 33.2 42H14.8A1 1 0 0 1 13.8 41V36.4A1 1 0 0 1 14.8 35.4Z"/>'],["cut","gold",'<path d="M16.4 12.4C21.4 13.3 26.6 13.3 31.6 12.4M16.4 37.2H31.6V40.2H16.4Z" fill="none" stroke="currentColor" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M13.8 6.6H34.2A.8.8 0 0 1 35 7.4V9.2A.8.8 0 0 1 34.2 10H13.8A.8.8 0 0 1 13 9.2V7.4A.8.8 0 0 1 13.8 6.6Z"/><path d="M24 12.4L24.79 14.51L27.04 14.61L25.28 16.02L25.88 18.19L24 16.95L22.12 18.19L22.72 16.02L20.96 14.61L23.21 14.51Z"/>'],["shade","",'<path d="M24 15.6L24.79 14.51L27.04 14.61ZM24 15.6L27.04 14.61L25.28 16.02ZM24 15.6L25.28 16.02L25.88 18.19ZM24 15.6L25.88 18.19L24 16.95ZM24 15.6L24 16.95L22.12 18.19Z"/>']],
    // a quill in an inkwell (STORY)
    homeStoryButton:[["face","gold",'<path d="M20.6 29.4C22.2 20.6 28 11.4 40.4 4.6 39.4 12.6 35.4 19.6 28.2 24.6L25.4 23.4 26.8 26.2C25 27.6 22.9 28.6 20.6 29.4Z"/>'],["cut","gold",'<path d="M21.2 28.8C26 21.8 31.6 13.6 39.6 5.6" fill="none" stroke="currentColor" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round"/><path d="M30.4 15.6 35.2 15.2M28 18.8 32.6 19.4M33 12.2 37.2 11.2" fill="none" stroke="currentColor" stroke-width=".45" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M16.6 26.4H25.4A.8.8 0 0 1 26.2 27.2V30.2H15.8V27.2A.8.8 0 0 1 16.6 26.4Z"/><path d="M13.2 30.2H28.8C30 30.2 30.8 31 30.8 32.2V40C30.8 41.1 30 42 28.8 42H13.2C12.1 42 11.2 41.1 11.2 40V32.2C11.2 31 12.1 30.2 13.2 30.2Z"/>'],["cut","gold",'<path d="M13.6 33.8H28.4M13.6 38.4H28.4" fill="none" stroke="currentColor" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round"/>']],
    // an open book with a ribbon (RULE BOOK)
    ruleBookButton:[["face","gold",'<path d="M5.4 12H8V37.4C14.6 36.6 20.4 37.6 24 40 27.6 37.6 33.4 36.6 40 37.4V12H42.6V40.8C35.4 39.8 29 40.9 24 43.5 19 40.9 12.6 39.8 5.4 40.8Z"/>'],["face","gold",'<path d="M24 12.6C20 9.8 14.2 8.8 7.6 9.6V37.4C14.2 36.6 20 37.6 24 40.4 28 37.6 33.8 36.6 40.4 37.4V9.6C33.8 8.8 28 9.8 24 12.6Z"/>'],["cut","gold",'<path d="M24 12.8V40" fill="none" stroke="currentColor" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 16.2C14 15.9 17.6 16.4 20.6 17.8M11 20.6C14 20.3 17.6 20.8 20.6 22.2M11 25C14 24.7 17.6 25.2 20.6 26.6M11 29.4C13 29.2 15.2 29.4 17.2 30.2M37 16.2C34 15.9 30.4 16.4 27.4 17.8M37 20.6C34 20.3 30.4 20.8 27.4 22.2M37 25C34 24.7 30.4 25.2 27.4 26.6M37 29.4C35 29.2 32.8 29.4 30.8 30.2" fill="none" stroke="currentColor" stroke-width=".65" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M26.2 38.8H28.8V44.6L27.5 43.3 26.2 44.6Z"/>']],
    // a gear (SETTINGS)
    settingsButton:[["face","gold",'<path d="M21.21 9.67L21.72 5.94L26.28 5.94L26.79 9.67L31.08 11.23L33.86 8.7L37.35 11.63L35.35 14.81L37.63 18.77L41.39 18.62L42.18 23.11L38.6 24.25L37.8 28.75L40.78 31.05L38.5 35L35.02 33.58L31.52 36.51L32.32 40.19L28.03 41.75L26.28 38.42L21.72 38.42L19.97 41.75L15.68 40.19L16.48 36.51L12.98 33.58L9.5 35L7.22 31.05L10.2 28.75L9.4 24.25L5.82 23.11L6.61 18.62L10.37 18.77L12.65 14.81L10.65 11.63L14.14 8.7L16.92 11.23ZM24 18.4A5.6 5.6 0 1 0 24 29.6 5.6 5.6 0 1 0 24 18.4Z" fill-rule="evenodd"/>'],["cut","gold",'<circle cx="24" cy="24" r="9.8" fill="none" stroke="currentColor" stroke-width=".8"/><circle cx="24.00" cy="11.70" r=".95"/><circle cx="34.65" cy="17.85" r=".95"/><circle cx="34.65" cy="30.15" r=".95"/><circle cx="24.00" cy="36.30" r=".95"/><circle cx="13.35" cy="30.15" r=".95"/><circle cx="13.35" cy="17.85" r=".95"/>']]
  });
  const ICON_TONES=Object.freeze({
    gold:{stops:[[0,"#FDEBB0"],[.36,"#EDC466"],[.7,"#C08A2B"],[1,"#8A5D17"]],hi:"#FFF4D2",lo:"#3A2605",wall:"#5A3C0A",cast:"#000",castA:.62,floor:"#6E4A11",floorHi:"#FFE3A0",floorLo:"#2A1C04"},
    ink:{stops:[[0,"#4A3A1D"],[.5,"#271E0F"],[1,"#100B05"]],hi:"#E9BC58",lo:"#000",wall:"#080603",cast:"#3A2906",castA:.5,floor:"#070503",floorHi:"#B8892F",floorLo:"#000"}
  });
  const TILE_ICONS=Object.freeze({continueCareer:"continue",newShowdown:"newShowdown",legacyButton:"legacyButton",careerStatisticsButton:"careerStatisticsButton",
    homeTrophyRoomButton:"homeTrophyRoomButton",homeStoryButton:"homeStoryButton",ruleBookButton:"ruleBookButton",settingsButton:"settingsButton"});
  // One layer of relief. The rim light is the shape minus itself moved down-right (the edge that faces the light); the rim
  // shade is the shape minus itself moved up-left. An engraved cut is lit the other way round: its far wall catches the light.
  const iconLayer=(id,i,kind,tone,shapes)=>{
    if(kind==="shade")return {defs:"",body:'<g fill="#3A2605" opacity=".38">'+shapes+'</g>'};
    const t=ICON_TONES[tone],s=id+"s"+i,box=' maskUnits="userSpaceOnUse" x="-3" y="-3" width="54" height="54"';
    const use=(x,y,c,extra)=>'<use href="#'+s+'" x="'+x+'" y="'+y+'" fill="'+c+'" color="'+c+'"'+(extra||"")+'/>';
    const mask=(n,inner)=>'<mask id="'+s+n+'"'+box+'>'+inner+'</mask>';
    const paint=(fill,n,op)=>'<rect x="-3" y="-3" width="54" height="54" fill="'+fill+'" mask="url(#'+s+n+')"'+(op?' opacity="'+op+'"':"")+'/>';
    const d=kind==="cut"?.34:.5;
    const defs='<g id="'+s+'">'+shapes+'</g>'+mask("a",use(0,0,"#fff"))+mask("h",use(0,0,"#fff")+use(d,d*1.35,"#000"))+mask("l",use(0,0,"#fff")+use(-d,-d*1.35,"#000"));
    if(kind==="cut")return {defs,body:paint(t.floor,"a")+paint(t.floorLo,"h",.85)+paint(t.floorHi,"l",.7)};
    const grad='<linearGradient id="'+s+'g" gradientUnits="userSpaceOnUse" x1="10" y1="4" x2="38" y2="44">'+t.stops.map(([o,c])=>'<stop offset="'+o+'" stop-color="'+c+'"/>').join("")+'</linearGradient>';
    const lift=i?.55:.75;
    return {defs:defs+grad,body:use(lift,lift*1.35,t.cast,' opacity="'+t.castA+'"')+use(lift*.5,lift*.68,t.wall)+paint("url(#"+s+"g)","a")+paint(t.hi,"h",.8)+paint(t.lo,"l",.72)};
  };
  const tileIcon=key=>{
    const id="w9i-"+key+"-",layers=ICON_ART[key].map(([kind,tone,shapes],i)=>iconLayer(id,i,kind,tone,shapes));
    return '<svg class="tileArt tileIcon" data-icon="'+key+'" viewBox="0 0 48 48" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false"><defs>'+
      layers.map(l=>l.defs).join("")+'</defs>'+layers.map(l=>l.body).join("")+'</svg>';
  };
  // The seventh tile, Trophy Room, as in Team V's Home frame (home/index.html at 5e05a1f). The product has no Home
  // button for it, so this Home adds one that opens the product's own Trophy Room route. Its id is not Team V's
  // #trophyRoomButton, because Career Statistics already owns that id.
  const TROPHY_TILE=Object.freeze({id:"homeTrophyRoomButton",after:"careerStatisticsButton",code:"HONOURS",label:"TROPHY ROOM",
    meta:"Career trophies, standings and records"});
  // r88 STORY (Nik's pick 2026-11-02: after Trophy Room): an eighth Home tile that opens a short local page about how the
  // Showdown was built, with one link to the full history site published with the game (chronicle/). The page is drawn here,
  // works offline, reads and sends no game data, and never touches a career, a season or Firebase.
  const STORY_TILE=Object.freeze({id:"homeStoryButton",after:"homeTrophyRoomButton",code:"ORIGINS",label:"STORY",
    meta:"How the Showdown was built."});
  // The one place the full story's address lives. Same origin and same tab, so the signed-in session and the single game tab
  // are kept; the site's own "Back to the game" link comes straight back here.
  const STORY_URL="chronicle/";
  const STORY_SCREEN="story";
  const STORY_OFFLINE_LINE="Connect to the internet to read the full story.";
  const STORY_SECTIONS=Object.freeze([
    Object.freeze(["THE BEGINNING","It started as a free way to keep score in a FIFA 17 Career Mode rivalry between two mates, Daniel and Nik: one league, two clubs kept for the whole Showdown, trophies for points and a timed Transfer War."]),
    Object.freeze(["HOW IT GREW","The score sheet became a two-phone online game: private pairing, shared seasons on both phones, the league and club wheels, Roster Roulette, the Prime Pack and the marble look, each step tested on Daniel's and Nik's real phones before it shipped."]),
    Object.freeze(["THE COLLABORATORS","Nik set the direction and played every test with Daniel. Claude worked in two teams, Team G for gameplay and Team V for the look, with GPT models coordinating, reviewing and writing the full history."])
  ]);
  const CHEVRON='<svg class="tileChevron" aria-hidden="true" focusable="false" viewBox="0 0 12 20"><path d="M2 2l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const HOME_CSS=Object.freeze(["home/home.css","../../css/homeV10.css"]);
  const PANEL_CLASSES=tile=>tile.id==="continueCareer"?["sd-panel","sd-panel--hero"]:["sd-panel"];
  let registered=null;

  const hmDoc=()=>root.document;
  function hmEl(tag,className,html){const el=hmDoc().createElement(tag);if(className)el.className=className;if(html)el.innerHTML=html;return el;}
  function hmDecor(className,html){const el=hmEl("div",className,html);el.setAttribute("aria-hidden","true");return el;}

  // Team V's stage layers (index.html at 5e05a1f), all decorative.
  function hmScene(){
    const pic=(cls,file,extra)=>`<picture class="${cls}"${extra||""}><source media="(max-width: 760px) and (orientation: portrait), (max-width: 900px) and (max-height: 480px) and (orientation: landscape)" srcset="${BASE}${file}" type="image/webp"><img alt="" decoding="async"></picture>`;
    const frag=hmDoc().createDocumentFragment();
    // r78 HO-031: the phone plate is Team V's marble ENV_HOME_PHONE_V2 with both managers painted in, so the phone
    // cut-out layer (OVL_HOME_*_PHONE_V2) is gone.
    frag.append(
      hmDecor("plateView",pic("phoneHeroBackground","plates-v2/ENV_HOME_PHONE_V2.webp")+'<div class="plateLayer"></div>'),
      hmDecor("phoneHeroGrade"),hmDecor("scrim scrimTop"),hmDecor("scrim scrimLow"),hmDecor("dockBed"),
      hmDecor("scriptLine","<span>More Than A Game</span>")
    );
    return frag;
  }
  function hmLockup(){
    return hmEl("div","homeLockup",'<p class="lockupKicker sd-label" aria-hidden="true">THE SHOWDOWN STARTS HERE</p><div class="lockupWordmarkWrap sd-title sd-title--wordmark"><span class="sd-visually-hidden">CAREER MODE SHOWDOWN 17</span><img class="lockupWordmark" src="'+BASE+'home/assets/LOGO_CM17_WORDMARK_V1.webp" srcset="'+BASE+'home/assets/LOGO_CM17_WORDMARK_V1_640W.webp 640w, '+BASE+'home/assets/LOGO_CM17_WORDMARK_V1.webp 1040w" sizes="'+WORDMARK_SIZES+'" alt="" aria-hidden="true" width="1040" height="378" decoding="async"></div><p class="lockupLegacy sd-tagline" aria-hidden="true">TWO MANAGERS · ONE LEGACY</p>');
  }
  function hmTile(id){
    const button=hmDoc().getElementById(id);
    if(!button)return;
    if(!button.querySelector(".tileArt"))button.insertAdjacentHTML("beforeend",tileIcon(TILE_ICONS[id]));
    if(!button.querySelector(".tileChevron"))button.insertAdjacentHTML("beforeend",CHEVRON);
  }

  function hmTrophyTile(grid){
    const t=TROPHY_TILE;
    if(hmDoc().getElementById(t.id))return;
    const anchor=hmDoc().getElementById(t.after);
    const button=hmEl("button","menuTile menuTileTrophyRoom",'<span class="menuTileCode">'+t.code+'</span><span class="menuTileLabel">'+t.label+'</span><span class="menuTileMeta">'+t.meta+'</span>');
    button.id=t.id;button.type="button";button.dataset.routeKey="trophyRoom";
    button.addEventListener("click",()=>{if(typeof root.openOptionalModule==="function")root.openOptionalModule("trophyRoom");});
    if(anchor&&anchor.parentNode===grid)anchor.insertAdjacentElement("afterend",button);else grid.appendChild(button);
    hmTile(t.id);
  }

  function hmStoryTile(grid){
    const t=STORY_TILE;
    if(hmDoc().getElementById(t.id))return;
    const anchor=hmDoc().getElementById(t.after);
    // menuTileRules: Team V's class-based secondary-tile type (home.css) applies to STORY as to Rule Book.
    const button=hmEl("button","menuTile menuTileRules menuTileStory",'<span class="menuTileCode">'+t.code+'</span><span class="menuTileLabel">'+t.label+'</span><span class="menuTileMeta">'+t.meta+'</span>'+tileIcon(TILE_ICONS[t.id])+CHEVRON);
    button.id=t.id;button.type="button";button.dataset.routeKey=STORY_SCREEN;
    button.setAttribute("aria-label","Story: how the Showdown was built");
    button.addEventListener("click",()=>openStory());
    if(anchor&&anchor.parentNode===grid)anchor.insertAdjacentElement("afterend",button);else grid.appendChild(button);
  }

  // ---- STORY page (local, offline-safe) ----
  function hmStoryOnline(){return root.navigator?.onLine!==false;}
  function hmStorySync(){
    const doc=hmDoc(),page=doc?.getElementById(STORY_SCREEN);
    if(!page)return;
    const online=hmStoryOnline(),link=page.querySelector(".storyRead"),note=page.querySelector(".storyOffline");
    if(link){
      if(online){link.setAttribute("href",STORY_URL);link.removeAttribute("aria-disabled");link.removeAttribute("tabindex");}
      else{link.removeAttribute("href");link.setAttribute("aria-disabled","true");}
    }
    if(note)note.hidden=online;
  }
  function hmStoryPage(){
    const doc=hmDoc();
    let page=doc?.getElementById(STORY_SCREEN);
    if(page)return page;
    const main=doc?.querySelector("main");
    if(!main)return null;
    page=doc.createElement("section");
    page.id=STORY_SCREEN;page.className="screen hidden storyScreen";page.setAttribute("aria-hidden","true");
    page.setAttribute("aria-labelledby","storyTitle");
    const sections=STORY_SECTIONS.map(([title,text],i)=>'<article class="storySection sd-panel"><span class="storySectionNo" aria-hidden="true">0'+(i+1)+'</span><h3>'+title+'</h3><p>'+text+'</p></article>').join("");
    page.innerHTML='<div class="storyInner">'+
      '<p class="storyKicker sd-label">CAREER MODE SHOWDOWN</p>'+
      '<h2 id="storyTitle" class="storyTitle">STORY</h2>'+
      '<p class="storyLead">Two friends. One rivalry. A project that kept growing. Follow the people, ideas and teams that shaped Career Mode Showdown, from its first experiments to real-phone milestones and cinematic Roulette.</p>'+
      '<div class="storySections">'+sections+'</div>'+
      '<p class="storyOffline" role="status" hidden>'+STORY_OFFLINE_LINE+'</p>'+
      '<div class="storyActions">'+
        '<a class="storyRead storyButton storyButtonPrimary" href="'+STORY_URL+'">READ THE FULL STORY</a>'+
        '<button class="storyBack storyButton" type="button">BACK TO HOME</button>'+
      '</div>'+
      '<p class="storyPrivacy">The full story is a separate page on this site. Nothing from your Showdown is sent to it.</p>'+
    '</div>';
    page.querySelector(".storyBack").addEventListener("click",()=>{
      if(typeof root.navigateTo==="function")root.navigateTo("mainMenu");else root.showScreen?.("mainMenu");
    });
    page.querySelector(".storyRead").addEventListener("click",event=>{if(!hmStoryOnline()){event.preventDefault();hmStorySync();}});
    main.appendChild(page);
    root.addEventListener?.("online",hmStorySync);
    root.addEventListener?.("offline",hmStorySync);
    return page;
  }
  // STORY joins Team V's loader on its first open (Home's own install is untouched), keeping Home's sheets on while it shows.
  let storyRegistered=false;
  function openStory(){
    if(!hmStoryPage())return false;
    const V=root.CareerModeV10Screens;
    if(!storyRegistered&&V?.register){try{V.register(STORY_SCREEN,{css:HOME_CSS.slice(),js:[],frame:()=>STORY_FRAME,mount:hmStoryMount});}catch(_error){}storyRegistered=true;}
    hmStorySync();
    return root.showScreen?.(STORY_SCREEN)===true;
  }
  function hmStoryMount(){hmStorySync();return true;}

  // The soundtrack (home/soundtrack.js) and its player (js/musicDockV10.js: phone MUSIC tab, desktop top-bar dock) start once
  // the app has started, whatever screen it opens on (HE-06: a reload straight onto the league wheel used to have no player
  // until Home was drawn). Home itself has no music strip (Nik, 2026-11-01).
  let hmMusicStarted=null;
  function hmStartMusic(){
    if(hmMusicStarted)return hmMusicStarted;
    const load=root.loadRuntimeScript;
    if(typeof load!=="function")return Promise.resolve(false);
    hmMusicStarted=Promise.resolve(load("v10-home-soundtrack",BASE+"home/soundtrack.js",()=>Boolean(root.HomeSoundtrack)))
      .then(()=>{if(!root.HomeSoundtrack)return false;if(!root.HomeSoundtrack.current())root.HomeSoundtrack.init(MEDIA);
        return Promise.resolve(load("v10-music-dock","js/musicDockV10.js",()=>Boolean(root.CareerModeMusicDockV10))).then(()=>root.CareerModeMusicDockV10?.start());})
      .catch(()=>{hmMusicStarted=null;return false;});
    return hmMusicStarted;
  }

  const HM_PHONE_QUOTA="(max-width: 760px) and (orientation: portrait)",HM_PHONE_QUOTA_LINE="Online limit used up today · back at 3 am Boston";
  function hmQuotaNotice(){
    const doc=hmDoc(),budget=root.CareerModeFirestoreBudget,message=budget?.quotaMessage?.(),home=doc?.getElementById("mainMenu");
    // r87 (Nik's pick): on a portrait phone the floating note covered both faces, so the limit is one short line inside
    // the Continue Career tile instead; every other size keeps the note.
    const tile=doc?.getElementById("continueCareer"),phone=root.matchMedia?.(HM_PHONE_QUOTA)?.matches===true;
    let line=tile?.querySelector?.(".menuTileQuota");
    if(message&&phone&&tile&&root.getActiveScreenName?.()==="mainMenu"&&!home?.closest?.("[inert]")){
      const notice=doc.getElementById("appRuntimeNotice");
      if(notice&&(notice.dataset.homeQuota||notice.querySelector(".runtimeNoticeText")?.textContent===budget.quotaMessageText))notice.remove();
      if(!line){line=doc.createElement("span");line.className="menuTileQuota";tile.append(line);}
      line.textContent=HM_PHONE_QUOTA_LINE;return;
    }
    line?.remove();
    if(message&&root.getActiveScreenName?.()==="mainMenu"&&!home?.closest?.("[inert]")){
      root.showAppNotice?.(message,"error",0);
      const notice=doc?.getElementById("appRuntimeNotice");
      if(notice&&home?.parentNode){notice.dataset.homeQuota="1";if(notice.parentNode!==home)home.appendChild(notice);}
    }else{
      const notice=doc?.getElementById("appRuntimeNotice");
      if(budget&&notice?.querySelector(".runtimeNoticeText")?.textContent===budget.quotaMessageText)notice.remove();
      else if(notice?.dataset.homeQuota){delete notice.dataset.homeQuota;doc.body.appendChild(notice);}
    }
  }

  function hmDecorate(frame,host){
    const shell=host.querySelector(".fifaMenuShell"),heading=host.querySelector(".fifaMenuHeading"),grid=host.querySelector(".fifaMenuGrid");
    if(!shell||!heading||!grid)return false;
    if(host.dataset.homeV10!=="1"){
      host.dataset.homeV10="1";
      host.prepend(hmScene());
      shell.insertBefore(hmLockup(),heading);
      heading.querySelector(".fifaMenuEyebrow")?.classList.add("sd-label");
      heading.querySelector("h2")?.classList.add("sd-label");
      heading.querySelector(".fifaMenuHeadingMeta")?.classList.add("sd-body");
      heading.querySelector(".fifaMenuHeadingMeta > span")?.classList.add("sd-label");
      host.appendChild(hmDecor("nav-reserve"));
      host.appendChild(hmDecor("footDeco",'<span>FOOTBALL BRINGS US TOGETHER</span><svg viewBox="0 0 24 18" focusable="false"><path d="M2 16h20l1.5-12-6 5L12 1 6.5 9l-6-5z" fill="#F2C45B"/></svg>'));
    }
    ["continueCareer","newShowdown","legacyButton","careerStatisticsButton","ruleBookButton","settingsButton"].forEach(hmTile);
    hmTrophyTile(grid);
    hmStoryTile(grid);
    // HO-004: every tile is Team V's shared cut-corner panel (Continue is the hero panel), as in Team V's Home frame.
    grid.querySelectorAll(".menuTile").forEach(tile=>tile.classList.add(...PANEL_CLASSES(tile)));
    hmStartMusic();
    host.classList.add("stage","v10Home");
    hmQuotaNotice();
    return true;
  }
  function hmUnmount(host){if(!host)return;host.classList.remove("stage","v10Home");host.querySelectorAll(".fifaMenuGrid .menuTile").forEach(tile=>tile.classList.remove("sd-panel","sd-panel--hero"));}

  function install(){
    if(registered)return registered;
    const V=root.CareerModeV10Screens;
    if(!V)return Promise.reject(new Error("V10_SCREEN_LOADER_UNAVAILABLE"));
    V.register("mainMenu",{css:HOME_CSS.slice(),js:[],frame:()=>FRAME,mount:hmDecorate,unmount:hmUnmount});
    hmStartMusic();
    if(typeof root.addEventListener==="function")root.addEventListener("career-mode-firestore-quota",hmQuotaNotice);
    hmDoc()?.addEventListener("career-mode-screen-shown",hmQuotaNotice);
    root.matchMedia?.(HM_PHONE_QUOTA)?.addEventListener?.("change",hmQuotaNotice);
    const app=hmDoc()?.getElementById("app");
    if(app&&root.MutationObserver)new root.MutationObserver(hmQuotaNotice).observe(app,{subtree:true,attributes:true,attributeFilter:["inert"]});
    registered=V.show("mainMenu").catch(error=>{root.console?.warn?.("[Career Mode Showdown] Team V Home unavailable.",error);return false;});
    return registered;
  }
  return Object.freeze({MEDIA,TILE_ICONS,ICON_ART,tileIcon,TROPHY_TILE,STORY_TILE,STORY_URL,HOME_CSS,install,openStory,decorateHome:hmDecorate,unmountHome:hmUnmount});
});
