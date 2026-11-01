// The soundtrack player · the owner's Audius playlist (js/homeScreensV10.js MEDIA.tracks), streamed the way
// the reference build visual/r9-audius-home-player did it: GET {apiBase}/tracks/{id}/stream into one <audio>.
// r87 (Nik 2026-11-01): Home no longer has its own music strip. This file owns the one <audio> and the playback state;
// the only controls are the phone MUSIC tab sheet and the desktop top-bar dock (js/musicDockV10.js), which redraw
// through subscribe().
// Nothing is requested until Play is pressed, and play() runs inside that tap, so the browser rule
// "sound needs a user tap" is met on desktop, Android and iPhone alike.
(function () {
  "use strict";
  if (window.HomeSoundtrack) return; // loaded once: a second copy would drop the playing <audio>
  let M = null, A = null, tracks = [], selectedKey = null;
  let audio = null, wantPlaying = false, failed = false;
  const listeners = [];

  const byKey = (k) => tracks.find((t) => t.key === k);
  const selected = () => byKey(selectedKey) || tracks[0];
  function streamUrl(t) {
    return `${A.apiBase}/tracks/${encodeURIComponent(t.audiusTrackId)}/stream?app_name=${encodeURIComponent(A.appName)}`;
  }

  function render() {
    listeners.forEach((fn) => { try { fn(); } catch (_) {} });
  }

  function ensureAudio() {
    if (audio) return audio;
    audio = document.createElement("audio");
    audio.className = "menuAudiusAudio";
    audio.preload = "none";
    audio.playsInline = true;
    audio.setAttribute("aria-hidden", "true");
    ["play", "playing", "pause", "waiting", "volumechange"].forEach((e) => audio.addEventListener(e, render));
    audio.addEventListener("ended", next);
    audio.addEventListener("error", () => { if (audio.getAttribute("src")) { failed = true; wantPlaying = false; render(); } });
    // One long-lived <audio> on <body>, so the song keeps playing on every screen.
    audio.dataset.v10PersistentMedia = "home";
    document.body.appendChild(audio);
    return audio;
  }

  function load(t) {
    const a = ensureAudio();
    failed = false;
    a.src = streamUrl(t);
    a.dataset.trackKey = t.key;
  }

  function play() {
    const a = ensureAudio();
    // r87 (app): after a failed stream, Play asks Audius again (a dead <audio> never retries by itself).
    if (a.dataset.trackKey !== selectedKey || failed || a.error) load(selected());
    wantPlaying = true; failed = false;
    const p = a.play();
    if (p && p.catch) p.catch((e) => { if (e && e.name === "AbortError") return; wantPlaying = false; failed = e && e.name !== "NotAllowedError"; render(); });
    render();
  }

  function pause() { wantPlaying = false; if (audio) audio.pause(); render(); }

  // When a song ends the playlist rolls on, the way a game menu playlist does.
  function next() {
    const i = tracks.indexOf(selected());
    selectedKey = tracks[(i + 1) % tracks.length].key;
    play();
  }

  function choose(key) {
    if (!byKey(key)) return;
    if (key === selectedKey) { render(); return; }
    selectedKey = key;
    if (wantPlaying) play();
    else { if (audio) { audio.pause(); audio.removeAttribute("src"); audio.dataset.trackKey = ""; audio.load(); } failed = false; render(); }
  }

  // Runs once the app has started (js/homeScreensV10.js), whatever screen it opens on. A second call keeps the chosen song
  // (Song 2 only the first time).
  function init(media) {
    M = media; A = media.audius; tracks = media.tracks.slice();
    if (!byKey(selectedKey)) selectedKey = media.defaultTrack;
    render();
  }

  window.HomeSoundtrack = {
    init,
    toggle: () => { if (M) (wantPlaying ? pause() : play()); },
    pause: () => { if (M && wantPlaying) pause(); },
    mute: () => { if (audio) { audio.muted = !audio.muted; render(); } },
    choose: (key) => { if (M) choose(key); },
    tracks: () => tracks.slice(),
    current: () => (M ? selected() : null),
    subscribe: (fn) => { if (typeof fn === "function") listeners.push(fn); },
    state: () => ({ selected: selectedKey, wantPlaying, failed, playing: !!audio && !audio.paused, muted: !!audio && audio.muted, src: audio ? audio.currentSrc || audio.src : null })
  };
})();
