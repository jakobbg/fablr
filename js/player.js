/* Audio player for the feed detail page.
 * Handles play/pause, seek, ETag auto-advance, and the sticky player bar.
 */
var audio = document.getElementById('audio-el');
var bar   = document.getElementById('player-bar');
var playBtn  = document.getElementById('player-play');
var seek  = document.getElementById('player-seek');
var curEl = document.getElementById('player-cur');
var durEl = document.getElementById('player-dur');
var titleEl = document.getElementById('player-ep-title');
var autoBtn = document.getElementById('player-auto');
var activeBtn = null;
var autoAdvance = false;

var SVG_PLAY  = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
var SVG_PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
var SVG_PLAY_SM  = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
var SVG_PAUSE_SM = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

function fmtTime(s) {
  if (!isFinite(s) || s < 0) return '—';
  s = Math.round(s);
  var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  if (h > 0) return h + ':' + String(m).padStart(2,'0') + ':' + String(r).padStart(2,'0');
  return m + ':' + String(r).padStart(2,'0');
}

function updateSeek() {
  if (!audio.duration) return;
  var pct = audio.currentTime / audio.duration * 100;
  seek.value = pct;
  seek.style.setProperty('--prog', pct + '%');
  curEl.textContent = fmtTime(audio.currentTime);
}

function setPlaying(playing) {
  playBtn.innerHTML = playing ? SVG_PAUSE : SVG_PLAY;
  playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  if (activeBtn) {
    activeBtn.innerHTML = playing ? SVG_PAUSE_SM : SVG_PLAY_SM;
    activeBtn.classList.toggle('playing', playing);
    activeBtn.setAttribute('aria-label', playing
      ? 'Pause ' + activeBtn.dataset.title
      : 'Play '  + activeBtn.dataset.title);
  }
}

function playEpisode(btn) {
  var src = btn.dataset.src, title = btn.dataset.title;
  if (activeBtn === btn && !audio.paused) { audio.pause(); return; }
  if (activeBtn && activeBtn !== btn) {
    activeBtn.innerHTML = SVG_PLAY_SM;
    activeBtn.classList.remove('playing');
  }
  activeBtn = btn;
  titleEl.textContent = title;
  if (audio.src !== src) {
    audio.src = src;
    audio.load();
  }
  audio.play();
  bar.classList.add('open');
  document.body.classList.add('player-open');
}

document.querySelectorAll('.ep-play').forEach(function(btn) {
  btn.addEventListener('click', function() { playEpisode(btn); });
});

playBtn.addEventListener('click', function() {
  if (audio.paused) audio.play(); else audio.pause();
});

audio.addEventListener('play',  function() { setPlaying(true); });
audio.addEventListener('pause', function() { setPlaying(false); });
audio.addEventListener('ended', function() {
  if (autoAdvance && activeBtn) {
    var allBtns = Array.from(document.querySelectorAll('.ep-play'));
    var idx = allBtns.indexOf(activeBtn);
    if (idx !== -1 && idx + 1 < allBtns.length) {
      playEpisode(allBtns[idx + 1]);
      return;
    }
  }
  setPlaying(false);
  seek.value = 0;
  seek.style.setProperty('--prog', '0%');
  curEl.textContent = '0:00';
});
audio.addEventListener('loadedmetadata', function() {
  durEl.textContent = fmtTime(audio.duration);
});
audio.addEventListener('timeupdate', updateSeek);

seek.addEventListener('input', function() {
  if (audio.duration) {
    audio.currentTime = seek.value / 100 * audio.duration;
    seek.style.setProperty('--prog', seek.value + '%');
  }
});

document.getElementById('player-close').addEventListener('click', function() {
  audio.pause();
  audio.src = '';
  bar.classList.remove('open');
  document.body.classList.remove('player-open');
  if (activeBtn) {
    activeBtn.innerHTML = SVG_PLAY_SM;
    activeBtn.classList.remove('playing');
    activeBtn = null;
  }
  seek.value = 0;
  seek.style.setProperty('--prog', '0%');
  curEl.textContent = '0:00';
  durEl.textContent = '—';
});

autoBtn.addEventListener('click', function() {
  autoAdvance = !autoAdvance;
  autoBtn.classList.toggle('on', autoAdvance);
  autoBtn.setAttribute('aria-pressed', autoAdvance ? 'true' : 'false');
  autoBtn.setAttribute('aria-label', 'Auto-advance: ' + (autoAdvance ? 'on' : 'off'));
});

