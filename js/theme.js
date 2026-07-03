/* js/theme.js — manual light/dark theme toggle.
 *
 * Persists preference in localStorage as 'light' | 'dark'.
 * A tiny inline script in <head> reads this before CSS loads to reduce theme
 * flash during navigation.
 */
(function () {
  var ICONS  = { light: '☀', dark: '🌙' };
  var LABELS = { light: 'Switch to dark theme', dark: 'Switch to light theme' };

  function getStoredTheme() {
    try {
      var t = localStorage.getItem('theme');
      return (t === 'light' || t === 'dark') ? t : null;
    } catch (_) {
      return null;
    }
  }

  function setStoredTheme(t) {
    try {
      localStorage.setItem('theme', t);
    } catch (_) {
      // Ignore storage failures (private mode, blocked storage, etc.)
    }
  }

  function currentTheme() {
    return getStoredTheme() || 'dark';
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
  }

  function updateBtn() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var t = currentTheme();
    btn.textContent = ICONS[t];
    btn.setAttribute('aria-label', LABELS[t]);
    btn.setAttribute('title', LABELS[t]);
  }

  function toggleTheme() {
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    setStoredTheme(next);
    applyTheme(next);
    updateBtn();
  }

  function init() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    if (!btn.dataset.boundThemeToggle) {
      btn.addEventListener('click', toggleTheme);
      btn.dataset.boundThemeToggle = '1';
    }
    applyTheme(currentTheme());
    updateBtn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());
