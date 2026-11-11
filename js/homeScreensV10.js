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
  // r90 W9 (LOOK hunt L12, Nik 2026-11-08 "no AI look", then "the icons need to look more advanced, not so simple", then
  // "handcrafted ... professionally selected and polished"): every tile carries one struck-medal icon set drawn by hand here on
  // one 48-unit grid, gold in low relief on the black marble: one warm key light from the top left, a chamfered rim, a cast
  // edge and engraved detail at one weight (1 unit, 1 px at 48 px), no glow and no gloss. CONTINUE shows a black number-17
  // shirt with gold collar, cuffs and number (the app's own Barlow Condensed numerals). No picture is fetched for a tile.
  // Each icon is a list of layers [kind, tone, shapes]: "face" is raised metal, "cut" is engraved into the layer under it,
  // "shade" darkens the facets that turn away from the light. Stroked shapes use currentColor so one shape list serves as
  // fill, mask and shadow.
  // r90 W8 (right-sized pictures): the Home pictures still in use come as half-size copies (*_<width>W.webp, same art).
  const WORDMARK_SIZES="(max-width: 900px) 330px, 31vw";
  const ICON_ART=Object.freeze({
    // The career is one player's: a black number-17 shirt from the back, gold collar, cuffs and number, the old photo's look drawn as a struck piece.
    continue:[["face","ink",'<path d="M19 6.8C21.6 8.4 26.4 8.4 29 6.8L36.8 9.6C38.4 10.2 39.6 11.3 40.4 12.8L43.6 19.4 37.4 22.6 34.6 18.4 34 40.4C34 41.2 33.4 41.8 32.6 41.9 26.9 42.5 21.1 42.5 15.4 41.9 14.6 41.8 14 41.2 14 40.4L13.4 18.4 10.6 22.6 4.4 19.4 7.6 12.8C8.4 11.3 9.6 10.2 11.2 9.6Z"/>'],["cut","ink",'<path d="M17.8 7.6C16.8 12 15.5 15.6 13.6 18.1" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/><path d="M30.2 7.6C31.2 12 32.5 15.6 34.4 18.1" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.6 39.4C20.9 40.1 27.1 40.1 33.4 39.4" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M18.4 7.1C21.3 8.9 26.7 8.9 29.6 7.1L30.9 7.6C27.8 10.1 20.2 10.1 17.1 7.6Z"/><path d="M4.4 19.4 10.6 22.6 11.3 21.16 5.1 17.96Z"/><path d="M43.6 19.4 37.4 22.6 36.7 21.16 42.9 17.96Z"/><path d="M18.56 16.6H21.7Q21.8 16.6 21.88 16.68Q21.96 16.75 21.96 16.86V31.39Q21.96 31.5 21.88 31.57Q21.8 31.65 21.7 31.65H18.64Q18.54 31.65 18.46 31.57Q18.39 31.5 18.39 31.39V20.06Q18.39 19.95 18.28 19.95L16.69 20.04Q16.43 20.04 16.43 19.8L16.39 17.52Q16.39 17.31 16.6 17.24L18.24 16.66Q18.41 16.6 18.56 16.6Z"/><path d="M24.35 31.35 27.81 19.78Q27.85 19.65 27.72 19.65H25.89Q25.79 19.65 25.79 19.76V20.49Q25.79 20.6 25.71 20.67Q25.64 20.75 25.53 20.75H23.16Q23.06 20.75 22.98 20.67Q22.91 20.6 22.91 20.49L22.93 16.86Q22.93 16.75 23 16.68Q23.08 16.6 23.18 16.6H31.35Q31.46 16.6 31.54 16.68Q31.61 16.75 31.61 16.86V19.5Q31.61 19.59 31.57 19.8L28.07 31.43Q28 31.65 27.79 31.65H24.56Q24.43 31.65 24.37 31.56Q24.3 31.48 24.35 31.35Z"/>']],
    // A Showdown starts with a plan: a clipboard tactics board with its clip and three players, read as football at a glance.
    newShowdown:[["face","gold",'<path d="M12.8 8H35.2A2.8 2.8 0 0 1 38 10.8V39.2A2.8 2.8 0 0 1 35.2 42H12.8A2.8 2.8 0 0 1 10 39.2V10.8A2.8 2.8 0 0 1 12.8 8Z"/>'],["cut","gold",'<path d="M13.6 14H34.4V38.4H13.6ZM13.6 26.2H34.4M19.2 14V18H28.8V14M19.2 38.4V34.4H28.8V38.4" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="26.2" r="3.4" fill="none" stroke="currentColor" stroke-width="1"/>'],["face","gold",'<path d="M18.6 10.8V7.8A1.8 1.8 0 0 1 20.4 6H21.6A2.4 2.4 0 0 1 26.4 6H27.6A1.8 1.8 0 0 1 29.4 7.8V10.8ZM24 4.9A1.1 1.1 0 1 0 24 7.1 1.1 1.1 0 1 0 24 4.9Z" fill-rule="evenodd"/><circle cx="18.8" cy="21.6" r="1.9"/><circle cx="29.2" cy="21.6" r="1.9"/><circle cx="17.4" cy="30.8" r="1.9"/>']],
    // Legacy is honour kept over seasons: a laurel wreath, tied at the foot, round a faceted star.
    legacyButton:[["face","gold",'<path d="M22.42 38.22L20.86 37.96L19.34 37.54L17.87 36.96L16.47 36.24L15.16 35.37L13.94 34.37L12.84 33.25L11.85 32.02L11.01 30.7L10.3 29.3L9.75 27.83L9.36 26.31L9.12 24.76L9.05 23.2L9.14 21.64L9.4 20.1L9.81 18.59L10.38 17.14L11.1 15.75L11.96 14.45L12.95 13.25L14.06 12.16L15.27 11.19L15.8 11.91L14.67 12.84L13.65 13.88L12.74 15.02L11.96 16.25L11.31 17.55L10.79 18.91L10.43 20.32L10.21 21.75L10.15 23.2L10.23 24.65L10.47 26.08L10.86 27.47L11.39 28.82L12.05 30.1L12.85 31.3L13.76 32.42L14.79 33.43L15.92 34.33L17.13 35.1L18.41 35.75L19.76 36.25L21.15 36.61L22.57 36.82Z"/><path d="M25.58 38.22L27.14 37.96L28.66 37.54L30.13 36.96L31.53 36.24L32.84 35.37L34.06 34.37L35.16 33.25L36.15 32.02L36.99 30.7L37.7 29.3L38.25 27.83L38.64 26.31L38.88 24.76L38.95 23.2L38.86 21.64L38.6 20.1L38.19 18.59L37.62 17.14L36.9 15.75L36.04 14.45L35.05 13.25L33.94 12.16L32.73 11.19L32.2 11.91L33.33 12.84L34.35 13.88L35.26 15.02L36.04 16.25L36.69 17.55L37.21 18.91L37.57 20.32L37.79 21.75L37.85 23.2L37.77 24.65L37.53 26.08L37.14 27.47L36.61 28.82L35.95 30.1L35.15 31.3L34.24 32.42L33.21 33.43L32.08 34.33L30.87 35.1L29.59 35.75L28.24 36.25L26.85 36.61L25.43 36.82Z"/><path d="M20.62 38.18C19.15 40.77 16.37 41.69 14.13 40.8C15.12 38.6 17.76 37.34 20.62 38.18ZM20.97 36.43C18.76 36.15 17.36 34.5 17.36 32.69C19.17 32.75 20.78 34.21 20.97 36.43ZM15.69 36.12C13.46 38.05 10.58 37.96 8.79 36.36C10.46 34.64 13.33 34.35 15.69 36.12ZM16.63 34.59C14.65 33.58 13.9 31.54 14.52 29.84C16.2 30.52 17.21 32.44 16.63 34.59ZM11.76 32.49C9.08 33.52 6.48 32.48 5.39 30.42C7.48 29.4 10.19 30.09 11.76 32.49ZM13.18 31.38C11.72 29.81 11.71 27.72 12.83 26.39C14.13 27.55 14.41 29.62 13.18 31.38ZM9.31 27.74C6.55 27.8 4.55 26.02 4.26 23.8C6.49 23.54 8.7 25.04 9.31 27.74ZM11.04 27.17C10.23 25.27 10.91 23.39 12.36 22.56C13.16 24.03 12.73 25.99 11.04 27.17ZM8.63 22.42C6.16 21.57 4.95 19.33 5.4 17.25C7.47 17.76 8.95 19.82 8.63 22.42ZM10.47 22.49C10.36 20.51 11.59 19.04 13.17 18.77C13.41 20.36 12.38 21.98 10.47 22.49ZM9.82 17.19C7.91 15.65 7.57 13.3 8.63 11.61C10.3 12.72 10.94 15.01 9.82 17.19ZM11.54 17.89C12.06 16.1 13.61 15.2 15.11 15.49C14.82 16.99 13.4 18.09 11.54 17.89ZM12.55 12.87C11.32 10.97 11.73 8.84 13.19 7.71C14.32 9.16 14.2 11.33 12.55 12.87ZM15.46 11.62C15.81 9.62 17.38 8.37 19.03 8.41C18.89 10.04 17.49 11.48 15.46 11.62Z"/><path d="M27.38 38.18C28.85 40.77 31.63 41.69 33.87 40.8C32.88 38.6 30.24 37.34 27.38 38.18Z"/><path d="M27.03 36.43C29.24 36.15 30.64 34.5 30.64 32.69C28.83 32.75 27.22 34.21 27.03 36.43Z"/><path d="M32.31 36.12C34.54 38.05 37.42 37.96 39.21 36.36C37.54 34.64 34.67 34.35 32.31 36.12Z"/><path d="M31.37 34.59C33.35 33.58 34.1 31.54 33.48 29.84C31.8 30.52 30.79 32.44 31.37 34.59Z"/><path d="M36.24 32.49C38.92 33.52 41.52 32.48 42.61 30.42C40.52 29.4 37.81 30.09 36.24 32.49Z"/><path d="M34.82 31.38C36.28 29.81 36.29 27.72 35.17 26.39C33.87 27.55 33.59 29.62 34.82 31.38Z"/><path d="M38.69 27.74C41.45 27.8 43.45 26.02 43.74 23.8C41.51 23.54 39.3 25.04 38.69 27.74Z"/><path d="M36.96 27.17C37.77 25.27 37.09 23.39 35.64 22.56C34.84 24.03 35.27 25.99 36.96 27.17Z"/><path d="M39.37 22.42C41.84 21.57 43.05 19.33 42.6 17.25C40.53 17.76 39.05 19.82 39.37 22.42Z"/><path d="M37.53 22.49C37.64 20.51 36.41 19.04 34.83 18.77C34.59 20.36 35.62 21.98 37.53 22.49Z"/><path d="M38.18 17.19C40.09 15.65 40.43 13.3 39.37 11.61C37.7 12.72 37.06 15.01 38.18 17.19Z"/><path d="M36.46 17.89C35.94 16.1 34.39 15.2 32.89 15.49C33.18 16.99 34.6 18.09 36.46 17.89Z"/><path d="M35.45 12.87C36.68 10.97 36.27 8.84 34.81 7.71C33.68 9.16 33.8 11.33 35.45 12.87Z"/><path d="M32.54 11.62C32.19 9.62 30.62 8.37 28.97 8.41C29.11 10.04 30.51 11.48 32.54 11.62Z"/>'],["face","gold",'<path d="M24 14.2L25.97 19.69L31.8 19.87L27.19 23.44L28.82 29.03L24 25.75L19.18 29.03L20.81 23.44L16.2 19.87L22.03 19.69Z"/><path d="M21.6 35.6H26.4A1 1 0 0 1 27.4 36.6V38.4A1 1 0 0 1 26.4 39.4H21.6A1 1 0 0 1 20.6 38.4V36.6A1 1 0 0 1 21.6 35.6ZM21.8 39.6 19.4 43.6 21.2 43.4 22.2 45 23.4 39.6ZM26.2 39.6 28.6 43.6 26.8 43.4 25.8 45 24.6 39.6Z"/>'],["shade","",'<path d="M24 22.4L25.97 19.69L31.8 19.87ZM24 22.4L31.8 19.87L27.19 23.44ZM24 22.4L27.19 23.44L28.82 29.03ZM24 22.4L28.82 29.03L24 25.75ZM24 22.4L24 25.75L19.18 29.03ZM24 22.4L19.18 29.03L20.81 23.44Z"/>']],
    // Statistics are the numbers rising season by season: fluted bars on a plinth under one climbing arrow.
    careerStatisticsButton:[["face","gold",'<path d="M8.2 37.4H39.8A1.2 1.2 0 0 1 41 38.6V40.4A1.2 1.2 0 0 1 39.8 41.6H8.2A1.2 1.2 0 0 1 7 40.4V38.6A1.2 1.2 0 0 1 8.2 37.4Z"/><path d="M9.8 30H15.4V36.4H9.8ZM18.2 25.2H23.8V36.4H18.2ZM26.6 27.6H32.2V36.4H26.6ZM35 18.6H40.6V36.4H35Z"/>'],["cut","gold",'<path d="M12.6 31.6V34.8M21 26.8V34.8M29.4 29.2V34.8M37.8 20.2V34.8" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M9.6 22.6 18.6 15.6 25.8 19.2 34.6 11.9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M39.6 7 37.9 14.4 32.2 8.6Z"/>']],
    // The Trophy Room holds cups: a two-handled cup with an engraved band, on a plaque plinth.
    homeTrophyRoomButton:[["face","gold",'<path d="M15 9.4H33V12C33 18.8 29.4 23.2 24 23.2 18.6 23.2 15 18.8 15 12ZM22.4 22.8H25.6V26.6H22.4ZM20.4 26.4H27.6A1.2 1.2 0 0 1 28.8 27.6V28.8H19.2V27.6A1.2 1.2 0 0 1 20.4 26.4ZM18.8 28.8H29.2L30.6 34H17.4Z"/><path d="M15.2 11H12.6C9.9 11 8.2 13 8.7 15.6 9.4 19 12.2 21 16.4 21.4L16.9 19.4C13.9 19 11.6 17.6 11.1 15.2 10.9 13.9 11.6 13.2 12.7 13.2H15.2Z"/><path d="M32.8 11H35.4C38.1 11 39.8 13 39.3 15.6 38.6 19 35.8 21 31.6 21.4L31.1 19.4C34.1 19 36.4 17.6 36.9 15.2 37.1 13.9 36.4 13.2 35.3 13.2H32.8Z"/><path d="M15.6 35H32.4A1.2 1.2 0 0 1 33.6 36.2V40.8A1.2 1.2 0 0 1 32.4 42H15.6A1.2 1.2 0 0 1 14.4 40.8V36.2A1.2 1.2 0 0 1 15.6 35Z"/>'],["cut","gold",'<path d="M16.6 13.4C21.5 14.3 26.5 14.3 31.4 13.4M17.2 37.6H30.8V39.4H17.2Z" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M14.4 6.6H33.6A.9.9 0 0 1 34.5 7.5V8.9A.9.9 0 0 1 33.6 9.8H14.4A.9.9 0 0 1 13.5 8.9V7.5A.9.9 0 0 1 14.4 6.6Z"/>']],
    // The Story is written by hand: a quill standing in an inkwell, the writer's tools rather than a page of lines.
    homeStoryButton:[["face","gold",'<path d="M21 28.4C22.4 20.2 28.2 11.2 41.6 4.2 40.8 12.4 36.8 19.4 29.4 24.4L26.6 23.4 28 26.2C25.8 27.6 23.6 28.4 21 28.4Z"/>'],["cut","gold",'<path d="M21.8 27.6C26.4 21 32.2 13.2 40.4 5.6" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/><path d="M31.6 15.4 35.2 15.2M29 18.6 32.4 19.4M34.4 12 37.4 11.4" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M17.2 25.8H26.8A.8.8 0 0 1 27.6 26.6V27.6H26.8V29.8H17.2V27.6H16.4V26.6A.8.8 0 0 1 17.2 25.8Z"/><path d="M12.6 31.6C12.6 30.5 13.5 29.8 14.6 29.8H29.4C30.5 29.8 31.4 30.5 31.4 31.6V39.8C31.4 41 30.5 42 29.4 42H14.6C13.5 42 12.6 41 12.6 39.8Z"/>'],["cut","gold",'<path d="M14.6 33.4H29.4M14.6 38.4H29.4" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>']],
    // The Rule Book is an open book: two pages, a spine and a ribbon marking the place.
    ruleBookButton:[["face","gold",'<path d="M5.4 12H8.2V37.2C14.6 36.4 20.2 37.4 24 39.8 27.8 37.4 33.4 36.4 39.8 37.2V12H42.6V40.8C35.4 39.8 29 40.9 24 43.4 19 40.9 12.6 39.8 5.4 40.8Z"/>'],["face","gold",'<path d="M24 12.6C20 9.8 14.2 8.8 7.6 9.6V37.4C14.2 36.6 20 37.6 24 40.4 28 37.6 33.8 36.6 40.4 37.4V9.6C33.8 8.8 28 9.8 24 12.6Z"/>'],["cut","gold",'<path d="M24 13.2V39.4" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.2 16.4C14.2 16.1 17.6 16.6 20.6 18M11.2 20.8C14.2 20.5 17.6 21 20.6 22.4M11.2 25.2C14.2 24.9 17.6 25.4 20.6 26.8M11.2 29.6C13.2 29.4 15.4 29.6 17.4 30.4" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/><path d="M36.8 16.4C33.8 16.1 30.4 16.6 27.4 18M36.8 20.8C33.8 20.5 30.4 21 27.4 22.4M36.8 25.2C33.8 24.9 30.4 25.4 27.4 26.8M36.8 29.6C34.8 29.4 32.6 29.6 30.6 30.4" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>'],["face","gold",'<path d="M26.4 38.8H28.8V45L27.6 43.8 26.4 45Z"/>']],
    // Settings is the machine room: an eight-tooth gear with a bored hub, the one sign everybody reads as settings.
    settingsButton:[["face","gold",'<path d="M19.47 10.33L20.38 6.16L27.62 6.16L28.53 10.33L30.46 11.13L34.06 8.83L39.17 13.94L36.87 17.54L37.67 19.47L41.84 20.38L41.84 27.62L37.67 28.53L36.87 30.46L39.17 34.06L34.06 39.17L30.46 36.87L28.53 37.67L27.62 41.84L20.38 41.84L19.47 37.67L17.54 36.87L13.94 39.17L8.83 34.06L11.13 30.46L10.33 28.53L6.16 27.62L6.16 20.38L10.33 19.47L11.13 17.54L8.83 13.94L13.94 8.83L17.54 11.13ZM24 18.6A5.4 5.4 0 1 0 24 29.4 5.4 5.4 0 1 0 24 18.6Z" fill-rule="evenodd" stroke="currentColor" stroke-width=".8" stroke-linejoin="round"/>'],["cut","gold",'<circle cx="24" cy="24" r="9.6" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="28.75" cy="12.54" r="1"/><circle cx="35.46" cy="19.25" r="1"/><circle cx="35.46" cy="28.75" r="1"/><circle cx="28.75" cy="35.46" r="1"/><circle cx="19.25" cy="35.46" r="1"/><circle cx="12.54" cy="28.75" r="1"/><circle cx="12.54" cy="19.25" r="1"/><circle cx="19.25" cy="12.54" r="1"/>']]
  });
  // One warm key light, top left, for every tile: the face is lit by a radial fall-off from that corner, so a flat plate
  // reads as struck metal rather than a sticker; the rim light, rim shade and cast edge all step the same way.
  const ICON_TONES=Object.freeze({
    gold:{stops:[[0,"#FFF2C6"],[.26,"#F3CD70"],[.56,"#CF9C36"],[.82,"#9A6A1C"],[1,"#6A470F"]],hi:"#FFF6DA",lo:"#3A2605",wall:"#563908",cast:"#000",castA:.6,floor:"#6A4710",floorHi:"#FFE2A0",floorLo:"#261903"},
    ink:{stops:[[0,"#55432A"],[.4,"#2C2214"],[1,"#0C0905"]],hi:"#E3B656",lo:"#000",wall:"#070503",cast:"#3A2906",castA:.5,floor:"#050403",floorHi:"#A87C2C",floorLo:"#000"}
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
    const grad='<radialGradient id="'+s+'g" gradientUnits="userSpaceOnUse" cx="13" cy="9" r="46" fx="13" fy="9">'+t.stops.map(([o,c])=>'<stop offset="'+o+'" stop-color="'+c+'"/>').join("")+'</radialGradient>';
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
    Object.freeze(["HOW IT GREW","The score sheet became a two-phone online game: private pairing, shared seasons on both phones, the league and club wheels, Roster Russian Roulette, the Prime Pack and the marble look. Each step was tested on Daniel's and Nik's real phones before it shipped."]),
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
    // HO-067 Gate B2: the phone plate is Team V's handcrafted ENV_HOME_PHONE_HC_V2 (css/homeV10.css draws it; the earlier
    // ENV_HOME_PHONE_V2 stays in visual-assets/v10_1/plates-v2/ as rollback).
    // The picture fetches the same file the CSS draws, so the plate loads once: the 590 px plate at the smallest download
    // size (html[data-assets="0"], set by js/gfxTier.js), the full plate otherwise.
    const lean=hmDoc().documentElement?.dataset?.assets==="0";
    frag.append(
      hmDecor("plateView",pic("phoneHeroBackground","plates-hc/ENV_HOME_PHONE_HC_V2"+(lean?"_590W":"")+".webp")+'<div class="plateLayer"></div>'),
      hmDecor("phoneHeroGrade"),hmDecor("scrim scrimLow")
    );
    return frag;
  }
  function hmLockup(){
    // HO-067 Gate B2: the handcrafted Home room carries no slogans, so the lockup is the wordmark alone (the kicker
    // "THE SHOWDOWN STARTS HERE", the tagline "TWO MANAGERS · ONE LEGACY" and the "More Than A Game" script line are gone).
    return hmEl("div","homeLockup",'<div class="lockupWordmarkWrap sd-title sd-title--wordmark"><span class="sd-visually-hidden">CAREER MODE SHOWDOWN 17</span><img class="lockupWordmark" src="'+BASE+'home/assets/LOGO_CM17_WORDMARK_V1.webp" srcset="'+BASE+'home/assets/LOGO_CM17_WORDMARK_V1_640W.webp 640w, '+BASE+'home/assets/LOGO_CM17_WORDMARK_V1.webp 1040w" sizes="'+WORDMARK_SIZES+'" alt="" aria-hidden="true" width="1040" height="378" decoding="async"></div>');
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
      '<p class="storyLead">Two friends. One rivalry. A project that kept growing. Meet the people, ideas and teams behind Career Mode Showdown, from the first experiments to real-phone tests and the cinematic Roster Russian Roulette.</p>'+
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
      // r90 W9 (LOOK hunt L46): no code copy of the plate slogan in the footer (HO-061 takes it off the plates too).
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
