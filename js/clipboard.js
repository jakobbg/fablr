/* Clipboard copy with visual feedback for Copy RSS buttons.
 * Called via onclick="copyFeed(this, url)" from the RSS copy buttons
 * on both the index page and the feed detail page.
 */
function copyFeed(btn, url) {
  if (!navigator.clipboard) {
    prompt('Copy this feed URL:', url);
    return;
  }
  navigator.clipboard.writeText(url).then(function () {
    var orig = btn.textContent;
    var origLabel = btn.getAttribute('aria-label');
    btn.textContent = 'Copied!';
    btn.setAttribute('aria-label', 'Copied to clipboard');
    setTimeout(function () {
      btn.textContent = orig;
      btn.setAttribute('aria-label', origLabel);
    }, 2000);
  });
}
