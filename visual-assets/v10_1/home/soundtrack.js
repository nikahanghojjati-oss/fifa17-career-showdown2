// Home soundtrack player · the owner's Audius playlist (fixtures strings.media.tracks), streamed the way
// the reference build visual/r9-audius-home-player did it: GET {apiBase}/tracks/{id}/stream into one <audio>.
// The YouTube-only trailer from main is left out on purpose (owner, 04 Oct 2026).
// Nothing is requested until Play is pressed, and play() runs inside that tap, so the browser rule
// "sound needs a user tap" is met on desktop, Android and iPhone alike.
(function () {
  "use strict";
  let M = null, A = null, tracks = [], selectedKey = null, ui = null;
  let audio = null, wantPlaying = false, failed = false;

  const byKey = (k) => tracks.find((t) => t.key === k);
  const selected = () => byKey(selectedKey) || tracks[0];
  function setText(el, v) { if (el && el.textContent !== String(v)) el.textContent = String(v); }
  function streamUrl(t) {
    return `${A.apiBase}/tracks/${encodeURIComponent(t.audiusTrackId)}/stream?app_name=${encodeURIComponent(A.appName)}`;
  }

  function render() {
    const t = selected();
    const playing = !!audio && !audio.paused && !audio.ended;
    setText(ui.title, t.title);
    setText(ui.artist, t.artist);
    setText(ui.toggle, wantPlaying ? M.pause : M.toggle);
    ui.toggle.setAttribute("aria-pressed", String(wantPlaying));
    ui.mute.disabled = !audio;
    setText(ui.mute, audio && audio.muted ? M.unmute : M.mute);
    ui.card.dataset.playing = String(playing);
    let status;
    if (failed) status = M.statusError;
    else if (!audio || (!wantPlaying && audio.currentTime === 0)) status = M.statusTemplate.replace("{TITLE}", t.title);
    else if (!wantPlaying) status = M.statusPaused;
    else if (!playing) status = M.statusLoading;
    else status = audio.muted ? M.statusPlayingMuted : M.statusPlaying;
    setText(ui.status, status);
    ui.choices.forEach((b) => {
      const on = b.dataset.menuMediaSource === t.key;
      b.classList.toggle("selected", on);
      b.setAttribute("aria-pressed", String(on));
    });
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
    ui.card.appendChild(audio);
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
    if (a.dataset.trackKey !== selectedKey) load(selected());
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
    if (ui.sheetToggle) ui.sheetToggle.checked = false;
    if (key === selectedKey) { render(); return; }
    selectedKey = key;
    if (wantPlaying) play();
    else { if (audio) { audio.pause(); audio.removeAttribute("src"); audio.dataset.trackKey = ""; audio.load(); } failed = false; render(); }
  }

  function init(media) {
    M = media; A = media.audius; tracks = media.tracks.slice(); selectedKey = media.defaultTrack;
    const card = document.querySelector(".menuMusicTile");
    ui = {
      card,
      title: card.querySelector(".menuMusicHeader strong"),
      artist: card.querySelector(".menuMusicArtist"),
      status: document.getElementById("menuMusicStatus"),
      toggle: document.getElementById("menuMusicToggle"),
      mute: document.getElementById("menuMusicMute"),
      sheetToggle: document.getElementById("phoneTrackSheetToggle"),
      choices: Array.from(card.querySelectorAll("[data-menu-media-source]"))
    };
    ui.toggle.addEventListener("click", () => (wantPlaying ? pause() : play()));
    ui.mute.addEventListener("click", () => { if (audio) { audio.muted = !audio.muted; render(); } });
    document.getElementById("menuMediaSelector").addEventListener("click", (e) => {
      const b = e.target instanceof Element ? e.target.closest("[data-menu-media-source]") : null;
      if (b) choose(b.dataset.menuMediaSource);
    });
    render();
  }

  window.HomeSoundtrack = {
    init,
    state: () => ({ selected: selectedKey, wantPlaying, failed, playing: !!audio && !audio.paused, muted: !!audio && audio.muted, src: audio ? audio.currentSrc || audio.src : null })
  };
})();
